/* The kit JSON contract (SPEC section 3).
   The Mind produces the kit; this module validates, defaults and clamps it.
   Lenient by design: only `version` and `repo` are hard requirements, and
   nothing here ever invents copy. Every correction is reported as a warning
   so the kit page can show what was adjusted. */
import { z } from "zod"

export const OUTPUTS = ["x", "linkedin", "card", "film", "vertical", "launch"] as const
export type Output = (typeof OUTPUTS)[number]

/* What a kit gets when it does not say. The two video cuts are opt-in: a Mind
   asks for them per release, so a kit that never mentions them is the four
   outputs imaji shipped with. */
export const DEFAULT_OUTPUTS: readonly Output[] = ["x", "linkedin", "card", "film"]

export const LOOKS = ["editorial", "punchy", "quiet"] as const
export type Look = (typeof LOOKS)[number]

export const GROUNDS = ["light", "dark"] as const
export type Ground = (typeof GROUNDS)[number]

export const TYPES = ["grotesque", "serif", "mono"] as const
export type TypeVoice = (typeof TYPES)[number]

export const DEFAULT_ACCENT = "#E2583E"

/* clamp lengths, SPEC section 3. thread parts and the LinkedIn post are not
   given a number in the spec; a thread part is a post so it takes the tweet
   limit, and the LinkedIn post takes LinkedIn's own 3000-char ceiling. */
export const LIMITS = {
  tweet: 280,
  threadPart: 280,
  threadParts: 10,
  linkedin: 3000,
  headline: 60,
  subline: 100,
  filmLine: 70,
  closing: 80,
  skipped: 200,
  memory: 300,
  caption: 80,
} as const

/* The launch video, SPEC section 3. The Mind writes a beats array; every beat
   is one scene and its own slot on the timeline. The wordmark opens the film
   before beat one, always, so it carries its own duration here. */
export const LAUNCH_BEAT_TYPES = ["text", "image", "capture", "lines", "signoff"] as const
export type LaunchBeatType = (typeof LAUNCH_BEAT_TYPES)[number]

export const LAUNCH_DURATIONS = {
  mark: 2.5,
  text: 4,
  image: 4.5,
  capture: 5,
  linesBase: 1.8,
  linePer: 1.2,
  signoff: 3.5,
} as const

export const LAUNCH_MIN_BEATS = 3
export const LAUNCH_MAX_BEATS = 10
export const LAUNCH_MAX_LINES = 4
export const LAUNCH_MAX_SECONDS = 45

export type LaunchBeat =
  | { type: "text"; headline: string; accentWord?: string; sub?: string }
  | { type: "image"; src: string; caption?: string }
  | { type: "capture"; url: string; caption?: string }
  | { type: "lines"; lines: string[] }
  | { type: "signoff"; closing: string }

export type Launch = { beats: LaunchBeat[] }

export function launchBeatDuration(beat: LaunchBeat): number {
  switch (beat.type) {
    case "text":
      return LAUNCH_DURATIONS.text
    case "image":
      return LAUNCH_DURATIONS.image
    case "capture":
      return LAUNCH_DURATIONS.capture
    case "lines":
      return LAUNCH_DURATIONS.linesBase + LAUNCH_DURATIONS.linePer * beat.lines.length
    case "signoff":
      return LAUNCH_DURATIONS.signoff
  }
}

/* The wordmark beat is not in the array, so it is added here and nowhere else.
   The composition and this function have to agree or the mp4 is cut short. */
export function launchDuration(beats: LaunchBeat[]): number {
  let total = LAUNCH_DURATIONS.mark
  for (const beat of beats) total += launchBeatDuration(beat)
  return total
}

export type KitJSON = {
  version: string
  repo: string
  releaseUrl?: string
  outputs: Output[]
  look: Look
  brand: {
    name: string
    accent: string
    ground: Ground
    type: TypeVoice
    logoUrl?: string
    url?: string
  }
  tweet?: string
  thread: string[]
  linkedin?: string
  card: { headline: string; subline: string; accentWord?: string }
  film: { lines: string[]; closing: string }
  launch?: Launch
  skipped: string[]
  memory?: string
}

export class KitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KitError"
  }
}

/* Deliberately loose: every field is accepted as unknown and reshaped by
   normaliseKit. zod's job here is to reject a body that is not an object
   and to pin the two required fields. */
const rawKitSchema = z.object({
  version: z
    .string()
    .trim()
    .min(1, "version is required")
    .regex(/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/, "version must look like a tag: letters, digits, dots, dashes, at most 64 characters"),
  repo: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/, "repo must look like owner/name"),
  releaseUrl: z.unknown().optional(),
  outputs: z.unknown().optional(),
  look: z.unknown().optional(),
  brand: z.unknown().optional(),
  tweet: z.unknown().optional(),
  thread: z.unknown().optional(),
  linkedin: z.unknown().optional(),
  card: z.unknown().optional(),
  film: z.unknown().optional(),
  launch: z.unknown().optional(),
  skipped: z.unknown().optional(),
  memory: z.unknown().optional(),
})

/* The Mind is asked to escape newlines, so they arrive as the two literal
   characters backslash + n. Turn those back into real newlines. */
export function unescapeNewlines(input: string): string {
  return input.replace(/\\r\\n/g, "\n").replace(/\\r/g, "\n").replace(/\\n/g, "\n")
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const text = unescapeNewlines(value).trim()
  return text.length ? text : undefined
}

/* Cut at the last sentence end inside the limit when one exists past the
   halfway mark, else at the last word boundary, so a clamp never leaves a
   dangling letter on a post. */
function clamp(text: string, max: number): { text: string; clamped: boolean } {
  if (text.length <= max) return { text, clamped: false }
  const head = text.slice(0, max)
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "))
  if (sentence > max / 2) return { text: head.slice(0, sentence + 1).trimEnd(), clamped: true }
  const word = head.lastIndexOf(" ")
  const cut = word > max / 2 ? head.slice(0, word) : head
  return { text: cut.replace(/[\s,;:]+$/, "").trimEnd(), clamped: true }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normaliseHex(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const hex = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [r, g, b] = hex.slice(1).split("")
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return undefined
}

function httpsUrl(value: unknown): string | undefined {
  const text = asString(value)
  if (!text) return undefined
  try {
    const url = new URL(text)
    if (url.protocol !== "https:") return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/* One beat of the launch storyboard. A beat that cannot be rendered as
   written is dropped and reported, never guessed at: the Mind gets told what
   it did wrong in the warnings and the rest of the film still ships. */
function normaliseBeat(entry: unknown, index: number, warnings: string[]): LaunchBeat | null {
  const drop = (why: string): null => {
    warnings.push(`launch beat ${index} ${why}, dropped`)
    return null
  }
  if (!isPlainObject(entry)) return drop("was not an object")

  const type = typeof entry.type === "string" ? entry.type.trim().toLowerCase() : ""
  if (!(LAUNCH_BEAT_TYPES as readonly string[]).includes(type)) {
    return drop(`has an unknown type "${String(entry.type ?? "")}"`)
  }

  if (type === "text") {
    const raw = asString(entry.headline)
    if (!raw) return drop("is a text beat with no headline")
    const head = clamp(raw, LIMITS.headline)
    if (head.clamped) warnings.push(`launch beat ${index} headline clamped to ${LIMITS.headline} characters`)
    const beat: LaunchBeat = { type: "text", headline: head.text }
    const accentWord = asString(entry.accentWord)
    if (accentWord) {
      const words = head.text
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
      if (words.includes(accentWord.toLowerCase())) beat.accentWord = accentWord
      else warnings.push(`launch beat ${index} accentWord "${accentWord}" is not a word of its headline, ignored`)
    }
    const sub = asString(entry.sub)
    if (sub) {
      const c = clamp(sub, LIMITS.subline)
      if (c.clamped) warnings.push(`launch beat ${index} sub clamped to ${LIMITS.subline} characters`)
      beat.sub = c.text
    }
    return beat
  }

  if (type === "image" || type === "capture") {
    const source = httpsUrl(type === "image" ? entry.src : entry.url)
    if (!source) return drop(`is a ${type} beat without an https ${type === "image" ? "src" : "url"}`)
    const caption = asString(entry.caption)
    let text: string | undefined
    if (caption) {
      const c = clamp(caption, LIMITS.caption)
      if (c.clamped) warnings.push(`launch beat ${index} caption clamped to ${LIMITS.caption} characters`)
      text = c.text
    }
    return type === "image"
      ? { type: "image", src: source, ...(text ? { caption: text } : {}) }
      : { type: "capture", url: source, ...(text ? { caption: text } : {}) }
  }

  if (type === "lines") {
    const lines: string[] = []
    if (Array.isArray(entry.lines)) {
      for (const one of entry.lines) {
        const text = asString(one)
        if (!text) continue
        if (lines.length >= LAUNCH_MAX_LINES) {
          warnings.push(`launch beat ${index} has more than ${LAUNCH_MAX_LINES} lines, the extra lines were dropped`)
          break
        }
        const c = clamp(text, LIMITS.filmLine)
        if (c.clamped) warnings.push(`launch beat ${index} line ${lines.length + 1} clamped to ${LIMITS.filmLine} characters`)
        lines.push(c.text)
      }
    }
    if (!lines.length) return drop("is a lines beat with no lines")
    return { type: "lines", lines }
  }

  const closingRaw = asString(entry.closing)
  if (!closingRaw) return drop("is a signoff beat with no closing")
  const c = clamp(closingRaw, LIMITS.closing)
  if (c.clamped) warnings.push(`launch beat ${index} closing clamped to ${LIMITS.closing} characters`)
  return { type: "signoff", closing: c.text }
}

/* Validate, default, clamp. Throws KitError on a body the renderer cannot
   act on at all; everything else is corrected and reported. */
export function normaliseKit(input: unknown): { kit: KitJSON; warnings: string[] } {
  const warnings: string[] = []

  if (!isPlainObject(input)) throw new KitError("kit must be a JSON object")
  if (JSON.stringify(input).includes("\u2014")) warnings.push("the copy contains an em dash, which the job asks you never to use")

  const parsed = rawKitSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new KitError(first ? `${first.path.join(".") || "kit"}: ${first.message}` : "invalid kit")
  }
  const raw = parsed.data

  const version = raw.version.trim()
  const repo = raw.repo.trim()
  const repoName = repo.split("/")[1] ?? repo

  /* outputs: a subset, canonical order, deduped. Missing means the four
     imaji shipped with, never the two opt-in video cuts. */
  let outputs: Output[]
  if (raw.outputs === undefined || raw.outputs === null) {
    outputs = [...DEFAULT_OUTPUTS]
  } else if (!Array.isArray(raw.outputs)) {
    warnings.push("outputs was not a list, using all four")
    outputs = [...DEFAULT_OUTPUTS]
  } else {
    const wanted = new Set<string>()
    for (const entry of raw.outputs) {
      if (typeof entry !== "string") continue
      const key = entry.trim().toLowerCase()
      if ((OUTPUTS as readonly string[]).includes(key)) wanted.add(key)
      else warnings.push(`unknown output "${entry}" ignored`)
    }
    outputs = OUTPUTS.filter((o) => wanted.has(o))
  }

  /* look */
  let look: Look = "editorial"
  if (raw.look !== undefined && raw.look !== null) {
    const key = typeof raw.look === "string" ? raw.look.trim().toLowerCase() : ""
    if ((LOOKS as readonly string[]).includes(key)) look = key as Look
    else warnings.push(`unknown look "${String(raw.look)}", using editorial`)
  }

  /* brand */
  const rawBrand = isPlainObject(raw.brand) ? raw.brand : {}
  if (raw.brand !== undefined && !isPlainObject(raw.brand)) warnings.push("brand was not an object, using defaults")

  const brandName = clamp(asString(rawBrand.name) ?? repoName, 80).text
  let accent = DEFAULT_ACCENT
  if (rawBrand.accent !== undefined && rawBrand.accent !== null) {
    const hex = normaliseHex(rawBrand.accent)
    if (hex) accent = hex
    else warnings.push(`brand.accent "${String(rawBrand.accent)}" is not a hex colour, using ${DEFAULT_ACCENT}`)
  }

  let ground: Ground = "dark"
  if (rawBrand.ground !== undefined && rawBrand.ground !== null) {
    const key = typeof rawBrand.ground === "string" ? rawBrand.ground.trim().toLowerCase() : ""
    if ((GROUNDS as readonly string[]).includes(key)) ground = key as Ground
    else warnings.push(`unknown brand.ground "${String(rawBrand.ground)}", using dark`)
  }

  let typeVoice: TypeVoice = "grotesque"
  if (rawBrand.type !== undefined && rawBrand.type !== null) {
    const key = typeof rawBrand.type === "string" ? rawBrand.type.trim().toLowerCase() : ""
    if ((TYPES as readonly string[]).includes(key)) typeVoice = key as TypeVoice
    else warnings.push(`unknown brand.type "${String(rawBrand.type)}", using grotesque`)
  }

  let logoUrl = httpsUrl(rawBrand.logoUrl)
  if (rawBrand.logoUrl !== undefined && rawBrand.logoUrl !== null && !logoUrl) {
    warnings.push("brand.logoUrl is not an https URL, ignored")
    logoUrl = undefined
  }
  const brandUrlRaw = asString(rawBrand.url)
  const brandUrl = brandUrlRaw && brandUrlRaw.length <= 300 ? brandUrlRaw : undefined

  const releaseUrl = httpsUrl(raw.releaseUrl)

  /* copy */
  let tweet: string | undefined
  const rawTweet = asString(raw.tweet)
  if (rawTweet) {
    const c = clamp(rawTweet, LIMITS.tweet)
    if (c.clamped) warnings.push(`tweet clamped to ${LIMITS.tweet} characters`)
    tweet = c.text
  }

  const thread: string[] = []
  if (Array.isArray(raw.thread)) {
    for (const part of raw.thread) {
      const text = asString(part)
      if (!text) continue
      if (thread.length >= LIMITS.threadParts) {
        warnings.push(`thread capped at ${LIMITS.threadParts} parts, the rest dropped`)
        break
      }
      const c = clamp(text, LIMITS.threadPart)
      if (c.clamped) warnings.push(`thread part ${thread.length + 1} clamped to ${LIMITS.threadPart} characters`)
      thread.push(c.text)
    }
  } else if (raw.thread !== undefined && raw.thread !== null) {
    warnings.push("thread was not a list, ignored")
  }

  let linkedin: string | undefined
  const rawLinkedin = asString(raw.linkedin)
  if (rawLinkedin) {
    const c = clamp(rawLinkedin, LIMITS.linkedin)
    if (c.clamped) warnings.push(`linkedin clamped to ${LIMITS.linkedin} characters`)
    linkedin = c.text
  }

  /* card. The renderer never invents copy: when the card is missing but was
     asked for, it falls back to the version and the repo, nothing else. */
  const rawCard = isPlainObject(raw.card) ? raw.card : {}
  if (raw.card !== undefined && raw.card !== null && !isPlainObject(raw.card)) {
    warnings.push("card was not an object, using version and repo")
  }
  let headline = asString(rawCard.headline)
  let subline = asString(rawCard.subline)
  if (!headline) {
    headline = version
    if (outputs.includes("card")) warnings.push("card.headline missing, using the version")
  }
  if (!subline) {
    subline = repo
    if (outputs.includes("card")) warnings.push("card.subline missing, using the repo")
  }
  const headlineClamp = clamp(headline, LIMITS.headline)
  if (headlineClamp.clamped) warnings.push(`card.headline clamped to ${LIMITS.headline} characters`)
  headline = headlineClamp.text
  const sublineClamp = clamp(subline, LIMITS.subline)
  if (sublineClamp.clamped) warnings.push(`card.subline clamped to ${LIMITS.subline} characters`)
  subline = sublineClamp.text

  let accentWord = asString(rawCard.accentWord)
  if (accentWord) {
    /* the accent word must be a word of the (already clamped) headline, or
       colouring it would silently do nothing */
    const words = headline.toLowerCase().split(/\s+/).map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    if (!words.includes(accentWord.toLowerCase())) {
      warnings.push(`card.accentWord "${accentWord}" is not a word of the headline, ignored`)
      accentWord = undefined
    }
  }

  /* film */
  const rawFilm = isPlainObject(raw.film) ? raw.film : {}
  if (raw.film !== undefined && raw.film !== null && !isPlainObject(raw.film)) {
    warnings.push("film was not an object, using defaults")
  }
  const lines: string[] = []
  if (Array.isArray(rawFilm.lines)) {
    for (const entry of rawFilm.lines) {
      const text = asString(entry)
      if (!text) continue
      if (lines.length === 3) {
        warnings.push("film.lines has more than three lines, extra lines dropped")
        break
      }
      const c = clamp(text, LIMITS.filmLine)
      if (c.clamped) warnings.push(`film line ${lines.length + 1} clamped to ${LIMITS.filmLine} characters`)
      lines.push(c.text)
    }
  } else if (rawFilm.lines !== undefined && rawFilm.lines !== null) {
    warnings.push("film.lines was not a list, ignored")
  }

  const filmClosing = asString(rawFilm.closing)
  let closing = filmClosing
  if (!closing) {
    closing = version
    if (outputs.includes("film")) warnings.push("film.closing missing, using the version")
  }
  const closingClamp = clamp(closing, LIMITS.closing)
  if (closingClamp.clamped) warnings.push(`film.closing clamped to ${LIMITS.closing} characters`)
  closing = closingClamp.text

  /* launch: the beats array the Mind storyboards. Every beat is checked on
     its own and a beat imaji cannot render is dropped rather than failing the
     kit. Two beats are structural and are supplied if the Mind left them out:
     a film opens on what it is and closes on where to get it. */
  const wantsLaunch = outputs.includes("launch")
  let launch: Launch | undefined
  const rawLaunch = isPlainObject(raw.launch) ? raw.launch : undefined
  if (raw.launch !== undefined && raw.launch !== null && !rawLaunch) {
    warnings.push("launch was not an object, ignored")
  }
  if (rawLaunch) {
    const beats: LaunchBeat[] = []
    if (Array.isArray(rawLaunch.beats)) {
      for (const entry of rawLaunch.beats) {
        if (beats.length >= LAUNCH_MAX_BEATS) {
          warnings.push(`launch.beats has more than ${LAUNCH_MAX_BEATS} beats, the extra beats were dropped`)
          break
        }
        const beat = normaliseBeat(entry, beats.length + 1, warnings)
        if (beat) beats.push(beat)
      }
    } else if (rawLaunch.beats !== undefined && rawLaunch.beats !== null) {
      warnings.push("launch.beats was not a list, ignored")
    }
    if (beats.length) launch = { beats }
  }

  if (wantsLaunch && (!launch || launch.beats.length < LAUNCH_MIN_BEATS)) {
    throw new KitError(
      `"launch" is in outputs, so launch.beats needs ${LAUNCH_MIN_BEATS} to ${LAUNCH_MAX_BEATS} usable beats`,
    )
  }

  if (launch) {
    const beats = launch.beats
    if (beats[0].type !== "text") {
      beats.unshift({ type: "text", headline, ...(accentWord ? { accentWord } : {}) })
      warnings.push("a launch opens on what it is, so a text beat was added from the card headline")
    }
    if (beats[beats.length - 1].type !== "signoff") {
      beats.push({ type: "signoff", closing: filmClosing ?? `${brandName} ${version}` })
      warnings.push("a launch closes on where to get it, so a signoff beat was added")
    }
    /* over the ceiling, the beats just before the signoff go first: the open
       and the close are the two that carry the identity */
    let dropped = 0
    while (launchDuration(beats) > LAUNCH_MAX_SECONDS && beats.length > 2) {
      beats.splice(beats.length - 2, 1)
      dropped++
    }
    if (dropped) {
      warnings.push(
        `launch ran past ${LAUNCH_MAX_SECONDS} seconds, ${dropped} ${dropped === 1 ? "beat was" : "beats were"} dropped`,
      )
    }
  }

  /* skipped + memory */
  const skipped: string[] = []
  if (Array.isArray(raw.skipped)) {
    for (const entry of raw.skipped) {
      if (skipped.length >= 6) {
        warnings.push("skipped capped at 6 entries, the rest dropped")
        break
      }
      const text = asString(entry)
      if (!text) continue
      skipped.push(clamp(text, LIMITS.skipped).text)
    }
  } else if (raw.skipped !== undefined && raw.skipped !== null) {
    warnings.push("skipped was not a list, ignored")
  }

  const rawMemory = asString(raw.memory)
  const memory = rawMemory ? clamp(rawMemory, LIMITS.memory).text : undefined

  const kit: KitJSON = {
    version,
    repo,
    ...(releaseUrl ? { releaseUrl } : {}),
    outputs,
    look,
    brand: {
      name: brandName,
      accent,
      ground,
      type: typeVoice,
      ...(logoUrl ? { logoUrl } : {}),
      ...(brandUrl ? { url: brandUrl } : {}),
    },
    ...(tweet ? { tweet } : {}),
    thread,
    ...(linkedin ? { linkedin } : {}),
    card: { headline, subline, ...(accentWord ? { accentWord } : {}) },
    film: { lines, closing },
    ...(launch ? { launch } : {}),
    skipped,
    ...(memory ? { memory } : {}),
  }

  return { kit, warnings }
}
