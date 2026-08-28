/* Build a throwaway project directory for one render (SPEC section 4).

   A project dir is a copy of one composition plus the vendored runtime:

     data/renders/<id>/compositions/<name>/index.html
     data/renders/<id>/vendor/...

   The depth is deliberate: it is the same relative depth the compositions
   sit at in the source tree, so `../../vendor/...` resolves identically
   whether the file is opened from src/ during design or from the copy
   Chrome loads over file://. Nothing is fetched at render time; the only
   network call in this module is the optional brand logo, and it happens
   before Chrome ever opens. */
import { promises as fs } from "node:fs"
import { randomUUID } from "node:crypto"
import dns from "node:dns"
import net from "node:net"
import path from "node:path"
import type { KitJSON, LaunchBeat } from "@/lib/kit"
import { LIMITS } from "@/lib/kit"
import { rendersRoot } from "@/lib/store"
import { captureUrls } from "./capture"

export type CompositionName = "card" | "film" | "launch"

/* What a launch beat looks like by the time the composition sees it: every
   picture is already a data URL, so the page opens with no network at all. */
export type RenderBeat =
  | { type: "text"; headline: string; accentWord?: string; sub?: string }
  | { type: "image"; src: string; caption?: string }
  | { type: "capture"; fold: string; full: string; caption?: string }
  | { type: "lines"; lines: string[] }
  | { type: "signoff"; closing: string }

export type RenderVars = {
  brandName: string
  logoDataUrl?: string
  url: string
  repo: string
  version: string
  headline: string
  accentWord: string
  subline: string
  lines: string[]
  closing: string
  accent: string
  ground: string
  type: string
  look: string
  /* the film reads this; "landscape" and a missing value are the same thing */
  orientation?: "landscape" | "portrait"
  /* only the launch composition reads this */
  launch?: { beats: RenderBeat[] }
}

export type Project = { id: string; dir: string; entry: string }

const MARKER = "/*__IMAJI_VARS__*/"
const IMAGE_TIMEOUT_MS = 10_000
const LOGO_MAX_BYTES = 2 * 1024 * 1024
const LOGO_TYPES = ["image/svg+xml", "image/png"]
/* a beat image is a screenshot or a diagram, so it gets the photo types and a
   bigger ceiling than a logo does */
const BEAT_MAX_BYTES = 6 * 1024 * 1024
const BEAT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
const IMAGE_MAX_REDIRECTS = 3

export function renderSrcDir(): string {
  return process.env.IMAJI_RENDER_SRC || path.join(process.cwd(), "src", "render")
}

export function varsFromKit(kit: KitJSON): RenderVars {
  return {
    brandName: kit.brand.name,
    url: kit.brand.url || "",
    repo: kit.repo,
    version: kit.version,
    headline: kit.card.headline,
    accentWord: kit.card.accentWord || "",
    subline: kit.card.subline,
    lines: kit.film.lines,
    closing: kit.film.closing,
    accent: kit.brand.accent,
    ground: kit.brand.ground,
    type: kit.brand.type,
    look: kit.look,
  }
}

/* A logo URL is attacker-supplied (it arrives inside a kit) and it is fetched
   by this server, which for this build is a Mac on a home network. So the
   host is resolved first and anything that is not a public address is
   refused: loopback, the RFC1918 ranges, link-local (which is where cloud
   metadata endpoints live), unique-local v6, and the v4-mapped forms of all
   of them. */
export function isPrivateAddress(address: string): boolean {
  const version = net.isIP(address)
  if (version === 4) {
    const parts = address.split(".").map(Number)
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
    const [a, b] = parts
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a >= 224) return true
    return false
  }
  if (version === 6) {
    const lower = address.toLowerCase()
    if (lower === "::" || lower === "::1") return true
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true
    const mapped = /^::ffff:(.+)$/.exec(lower)
    if (mapped) {
      const inner = mapped[1]
      if (net.isIP(inner) === 4) return isPrivateAddress(inner)
    }
    return false
  }
  return true
}

export async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  const bare = hostname.replace(/^\[|\]$/g, "")
  if (net.isIP(bare)) return !isPrivateAddress(bare)
  try {
    const records = await dns.promises.lookup(bare, { all: true })
    if (records.length === 0) return false
    return records.every((r) => !isPrivateAddress(r.address))
  } catch {
    return false
  }
}

/* Fetch one picture and inline it as a data URL. Any failure at all (timeout,
   wrong type, too big, non-200, a private address, too many redirects)
   returns undefined and the caller falls back: the brand name as text for a
   logo, a text beat for a launch image. It never throws. */
export async function fetchImageDataUrl(
  source: string | undefined,
  types: readonly string[],
  maxBytes: number,
): Promise<string | undefined> {
  if (!source) return undefined
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS)
  try {
    /* redirects are followed by hand so every hop is checked, not just the
       first, and so the chain cannot be walked forever */
    let current = source
    let res: Response | null = null
    for (let hop = 0; hop <= IMAGE_MAX_REDIRECTS; hop++) {
      let target: URL
      try {
        target = new URL(current)
      } catch {
        return undefined
      }
      if (target.protocol !== "https:") return undefined
      if (!(await resolvesToPublicAddress(target.hostname))) return undefined

      const hopRes = await fetch(target, { signal: controller.signal, redirect: "manual" })
      if (hopRes.status >= 300 && hopRes.status < 400) {
        const location = hopRes.headers.get("location")
        if (!location) return undefined
        current = new URL(location, target).toString()
        continue
      }
      res = hopRes
      break
    }
    if (!res) return undefined
    if (!res.ok) return undefined
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    if (!types.includes(type)) return undefined
    const declaredHeader = res.headers.get("content-length")
    if (declaredHeader !== null && Number(declaredHeader) > maxBytes) return undefined
    if (!res.body) return undefined
    /* read through a counter and stop the moment the cap is crossed, so a
       response with no Content-Length cannot be buffered whole first */
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return undefined
      }
      chunks.push(value)
    }
    const buffer = Buffer.concat(chunks)
    return `data:${type};base64,${buffer.toString("base64")}`
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

export function fetchLogoDataUrl(logoUrl: string | undefined): Promise<string | undefined> {
  return fetchImageDataUrl(logoUrl, LOGO_TYPES, LOGO_MAX_BYTES)
}

/* A beat that could not be fetched or captured still has to hold its slot, so
   it becomes a text beat: the caption if the Mind wrote one, otherwise the
   host it was pointing at. Which is why JOB.md asks for captions that stand
   on their own.

   A caption is written to sit under a picture, so on its own it reads as a
   fragment. It is set as a sentence instead: a capital at the front and a
   full stop at the end. No accent word is invented for it, because the Mind
   never chose one for this beat and guessing at emphasis is the renderer
   deciding something. */
function degradeBeat(url: string, caption: string | undefined): RenderBeat {
  let text = (caption || "").trim()
  if (!text) {
    try {
      text = new URL(url).hostname.replace(/^www\./, "")
    } catch {
      text = url
    }
  }
  text = text.trim() || url
  let sentence = text.charAt(0).toUpperCase() + text.slice(1)
  if (/[.!?\u2026]$/.test(sentence)) {
    if (sentence.length > LIMITS.headline) {
      sentence = sentence.slice(0, LIMITS.headline - 1).trimEnd() + "."
    }
  } else {
    if (sentence.length + 1 > LIMITS.headline) sentence = sentence.slice(0, LIMITS.headline - 1).trimEnd()
    sentence = sentence + "."
  }
  return { type: "text", headline: sentence }
}

/* Turn the storyboard the Mind wrote into one the composition can open with
   no network: every image is fetched, every capture is screenshotted, and
   anything that fails degrades to text with a warning. Called before Chrome
   ever opens on the composition itself. */
export async function resolveLaunchBeats(
  beats: LaunchBeat[],
): Promise<{ beats: RenderBeat[]; warnings: string[] }> {
  const warnings: string[] = []
  const captures = await captureUrls(beats.filter((b) => b.type === "capture").map((b) => b.url))

  const out: RenderBeat[] = []
  for (const beat of beats) {
    if (beat.type === "image") {
      const src = await fetchImageDataUrl(beat.src, BEAT_TYPES, BEAT_MAX_BYTES)
      if (src) out.push({ type: "image", src, ...(beat.caption ? { caption: beat.caption } : {}) })
      else {
        warnings.push(`launch image ${beat.src} could not be fetched, that beat is text now`)
        out.push(degradeBeat(beat.src, beat.caption))
      }
      continue
    }
    if (beat.type === "capture") {
      const shot = captures.get(beat.url) ?? null
      if (shot) out.push({ type: "capture", fold: shot.fold, full: shot.full, ...(beat.caption ? { caption: beat.caption } : {}) })
      else {
        warnings.push(`launch capture of ${beat.url} failed, that beat is text now`)
        out.push(degradeBeat(beat.url, beat.caption))
      }
      continue
    }
    out.push(beat)
  }
  return { beats: out, warnings }
}

/* JSON that is safe to drop inside a <script> element: an angle bracket in
   the data could otherwise close the script early, and the two exotic line
   separators are line terminators in JS source. */
function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export async function composeProject(
  composition: CompositionName,
  vars: RenderVars,
): Promise<Project> {
  const src = renderSrcDir()
  const id = randomUUID()
  const dir = path.join(rendersRoot(), id)
  const compDest = path.join(dir, "compositions", composition)

  await fs.mkdir(path.join(dir, "compositions"), { recursive: true })
  await fs.cp(path.join(src, "compositions", composition), compDest, { recursive: true })
  await fs.cp(path.join(src, "vendor"), path.join(dir, "vendor"), { recursive: true })

  const entry = path.join(compDest, "index.html")
  const html = await fs.readFile(entry, "utf8")
  if (!html.includes(MARKER)) throw new Error(`composition ${composition} has no ${MARKER} marker`)
  /* a function replacement, so `$&`, `$\`` and `$\'` inside the kit copy are
     inserted literally instead of expanded against the page */
  const script = `window.IMAJI_VARS = ${scriptSafeJson(vars)}`
  await fs.writeFile(entry, html.replace(MARKER, () => script), "utf8")

  return { id, dir, entry }
}

export async function discardProject(project: Project): Promise<void> {
  try {
    await fs.rm(project.dir, { recursive: true, force: true })
  } catch {
    /* a leftover scratch dir is not worth failing a finished render over */
  }
}
