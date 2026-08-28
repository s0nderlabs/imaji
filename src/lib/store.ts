/* Flat-file storage (SPEC section 4, "Storage").
   Everything lives under IMAJI_DATA_DIR, default ./data:

     data/tokens.json
     data/kits/{token}/{tag}/kit.json
     data/kits/{token}/{tag}/meta.json
     data/kits/{token}/{tag}/card.png
     data/kits/{token}/{tag}/film.mp4
     data/renders/{id}/            scratch, deleted after a render

   No database, on purpose: the whole store is readable with `cat`. */
import { promises as fs } from "node:fs"
import path from "node:path"
import { normaliseKit, type KitJSON, type Output } from "./kit"

export type CardStatus = "none" | "done" | "failed"
export type FilmStatus = "none" | "queued" | "rendering" | "done" | "failed"

/* the three video cuts, each rendered on its own and reported on its own */
export const VIDEO_KINDS = ["film", "vertical", "launch"] as const
export type VideoKind = (typeof VIDEO_KINDS)[number]

export type Meta = {
  repo: string
  tag: string
  receivedAt: string
  outputs: Output[]
  /* vertical and launch are optional so a meta.json written before they
     existed still reads back as a valid Meta */
  status: { card: CardStatus; film: FilmStatus; vertical?: FilmStatus; launch?: FilmStatus }
  /* the last failure, whichever render it belonged to. Kept because it is
     what the older kit pages read. */
  error?: string
  /* the failure per render, so a failed launch cannot put its message under
     the film */
  errors?: Partial<Record<"card" | VideoKind, string>>
  kitUrl: string
  indexUrl: string
}

export function dataDir(): string {
  return path.resolve(process.env.IMAJI_DATA_DIR || "./data")
}

export function kitsRoot(): string {
  return path.join(dataDir(), "kits")
}

export function rendersRoot(): string {
  return path.join(dataDir(), "renders")
}

/* Tag and token both reach the filesystem straight from a URL, so both are
   reduced to a safe charset before they are ever joined onto a path. */
export function sanitiseTag(tag: string): string {
  const safe = String(tag).replace(/[^A-Za-z0-9._-]/g, "-").replace(/^\.+/, "").slice(0, 128)
  return safe.length ? safe : "untagged"
}

export function sanitiseToken(token: string): string {
  return String(token).replace(/[^A-Za-z0-9]/g, "").slice(0, 64)
}

export function kitDir(token: string, tag: string): string {
  return path.join(kitsRoot(), sanitiseToken(token), sanitiseTag(tag))
}

export function fileFor(token: string, tag: string, name: string): string {
  const safeName = path.basename(String(name)).replace(/[^A-Za-z0-9._-]/g, "")
  return path.join(kitDir(token, tag), safeName)
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T
  } catch {
    return null
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(file))
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8")
}

export async function writeKit(token: string, tag: string, kit: KitJSON): Promise<void> {
  await writeJson(path.join(kitDir(token, tag), "kit.json"), kit)
}

/* Anything on disk is re-validated on the way out. A kit.json written by an
   older shape, a hand edit, or a partial write would otherwise reach a server
   component as a KitJSON that is missing the arrays the page maps over: a 500
   where the page is designed to show a 404. */
export async function readKit(token: string, tag: string): Promise<KitJSON | null> {
  const raw = await readJson<unknown>(path.join(kitDir(token, tag), "kit.json"))
  if (raw === null) return null
  try {
    return normaliseKit(raw).kit
  } catch {
    return null
  }
}

async function writeMetaNow(token: string, tag: string, meta: Meta): Promise<void> {
  await writeJson(path.join(kitDir(token, tag), "meta.json"), meta)
}

/* the request path writes through the same per-kit chain the background
   renders patch through, so neither can resurrect the other's stale copy */
export async function writeMeta(token: string, tag: string, meta: Meta): Promise<void> {
  const key = `${token}/${tag}`
  const previous = metaChains.get(key) ?? Promise.resolve()
  const run = previous.catch(() => undefined).then(() => writeMetaNow(token, tag, meta))
  metaChains.set(key, run)
  try {
    await run
  } finally {
    if (metaChains.get(key) === run) metaChains.delete(key)
  }
}

export async function readMeta(token: string, tag: string): Promise<Meta | null> {
  return readJson<Meta>(path.join(kitDir(token, tag), "meta.json"))
}

/* Read-modify-write of one kit's meta. Used by the background film render to
   move status along without clobbering the fields the request already set. */
export type MetaPatch = Omit<Partial<Meta>, "status" | "errors"> & {
  status?: Partial<Meta["status"]>
  errors?: Meta["errors"]
}

/* Three background renders (film, vertical, launch) patch the same meta.json
   from the same process. A plain read-modify-write lets two of them read the
   same snapshot and the second write drop the first one's status (seen on the
   v0.3.0 run: the vertical cut finished but stayed "queued"). Patches to one
   kit are therefore chained so each one reads the previous one's result. */
const metaChains = new Map<string, Promise<unknown>>()

export async function patchMeta(token: string, tag: string, patch: MetaPatch): Promise<Meta | null> {
  const key = `${token}/${tag}`
  const previous = metaChains.get(key) ?? Promise.resolve()
  const run = previous
    .catch(() => undefined)
    .then(async (): Promise<Meta | null> => {
      const current = await readMeta(token, tag)
      if (!current) return null
      const errors = { ...(current.errors ?? {}), ...(patch.errors ?? {}) }
      const next: Meta = {
        ...current,
        ...patch,
        status: { ...current.status, ...(patch.status ?? {}) },
        ...(Object.keys(errors).length ? { errors } : {}),
      }
      await writeMeta(token, tag, next)
      return next
    })
  metaChains.set(key, run)
  try {
    return await run
  } finally {
    if (metaChains.get(key) === run) metaChains.delete(key)
  }
}

/* Every kit under one token, newest first. A directory whose meta.json is
   missing or unreadable is skipped rather than failing the whole listing. */
export async function listKits(token: string): Promise<Meta[]> {
  const dir = path.join(kitsRoot(), sanitiseToken(token))
  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return []
  }
  const metas: Meta[] = []
  for (const entry of entries) {
    const meta = await readMeta(token, entry)
    if (meta) metas.push(meta)
  }
  metas.sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
  return metas
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}
