/* The kit the front door shows.

   The front door's whole argument is "here is what you get", so the example
   on it has to be a real kit rather than a screenshot of one. Set
   IMAJI_SHOWCASE_READID to the read id of the kits this server should show
   and the page reads the newest one off disk on every request: the film in
   the fold, the transcript of the run the Mind did, the card, the copy it
   wrote, what it kept and what it left out.

   With the variable unset (a fresh clone, or a server that has no kits of
   its own yet) the page falls back to imaji's own v0.2.0 kit, whose files
   are committed under public/showcase. Nothing here ever invents a number:
   a timing appears only in the static fallback, where it is a recorded fact,
   and never for a live kit, where the store does not keep it. */
import { tokenForReadId } from "./readid"
import { listKits, readKit, readMeta, type CardStatus, type FilmStatus, type Meta } from "./store"
import { isOnboarding, madeSentence } from "@/components/text"

/** one run line, in pieces, so the typewriter can bolden the real values */
export type Seg = { t: string; b?: boolean }
export type LogLine = { segs: Seg[]; done?: boolean }

export type Media = { src: string; poster?: string }

export type Showcase = {
  /** true when this came off disk rather than out of the fallback */
  live: boolean
  version: string
  repo: string
  /** the release this kit was built on top of, when there is one */
  previousVersion: string | null
  /** the film behind the fold, and the version it belongs to */
  fold: { src: string; poster?: string; version: string }
  log: LogLine[]
  card: string | null
  film: Media | null
  vertical: Media | null
  launch: Media | null
  tweet: string | null
  thread: string[]
  linkedin: string[]
  /** how this kit came to exist, one sentence */
  made: string
  /** what the Mind kept from it */
  memory: string | null
  skipped: string[]
  /** who the posts are from, for the platform mocks */
  brand: { name: string; logo: string | null; ground: "dark" | "light" }
  /** when the kit landed, ISO; the mocks date their posts from it */
  receivedAt: string | null
}

const DONE = (s: CardStatus | FilmStatus | undefined) => s === "done"

function paragraphsOf(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/* ------------------------------------------------------------- fallback
   imaji's own v0.2.0 kit, the one the design was drawn around. The files
   are in the repo, so this renders on any clone with no data at all. */
const STATIC: Showcase = {
  live: false,
  version: "v0.2.0",
  repo: "s0nderlabs/imaji",
  previousVersion: "v0.1.0",
  fold: {
    src: "/showcase/film.mp4",
    poster: "/showcase/film-poster.jpg",
    version: "v0.2.0",
  },
  log: [
    { segs: [{ t: "v0.2.0", b: true }, { t: " tagged in " }, { t: "s0nderlabs/imaji", b: true }] },
    { segs: [{ t: "your Mind woke, unprompted" }] },
    { segs: [{ t: "it read the release" }] },
    { segs: [{ t: "it remembered " }, { t: "v0.1.0", b: true }] },
    { segs: [{ t: "it decided what the release earned" }] },
    { segs: [{ t: "it wrote the kit in " }, { t: "2 min 41 s", b: true }] },
    { segs: [{ t: "imaji rendered the card in " }, { t: "2 s", b: true }] },
    { segs: [{ t: "imaji rendered the film in " }, { t: "12 s", b: true }] },
    { segs: [{ t: "kit ready" }], done: true },
  ],
  card: "/showcase/card.jpg",
  film: { src: "/showcase/film.mp4", poster: "/showcase/film-poster.jpg" },
  vertical: null,
  launch: null,
  tweet:
    "imaji v0.2.0: your Mind now renders a 10-second film for every release, not just the card. Tag a release, get the kit. No prompts, no content calendar.",
  thread: [
    "v0.2.0 is out. What changed: the film. Every release now gets a 10-second launch video rendered from HTML, on brand, deterministic, no diffusion model guessing at your logo.",
    "How it works: you tag a release, a GitHub Action wakes your own Mind, the Mind reads the notes, remembers your last release, writes the copy and calls imaji to render the visuals.",
    "Building on v0.1.0, which shipped the card and the private kit page. Next: the Bazaar listing so any Mind can take the job. imaji.s0nderlabs.xyz",
  ],
  linkedin: [
    "We shipped imaji v0.2.0. Every release your team tags now comes back as a full launch kit: a tweet, a thread, this post, a social card and a 10-second film. Your own Mind writes it, remembering every release before it. imaji only renders.",
  ],
  made: "Your Mind read the release, remembered v0.1.0, and wrote this kit. imaji rendered the card and the film.",
  memory:
    "v0.2.0 builds on v0.1.0 by making the film real: ten seconds, four beats, rendered frame by frame from HTML.",
  skipped: [],
  brand: { name: "imaji", logo: "/imaji-5b-on-dark.svg", ground: "dark" },
  receivedAt: "2026-08-28T06:52:28.050Z",
}

/* --------------------------------------------------------------- the run
   Every line is built from something the store actually holds. There is no
   timing here because a live kit does not record one. */
function logFor(meta: Meta, previous: string | null): LogLine[] {
  const lines: LogLine[] = [
    { segs: [{ t: meta.tag, b: true }, { t: " tagged in " }, { t: meta.repo, b: true }] },
    { segs: [{ t: "your Mind woke, unprompted" }] },
    { segs: [{ t: "it read the release" }] },
  ]
  if (previous) lines.push({ segs: [{ t: "it remembered " }, { t: previous, b: true }] })
  lines.push({ segs: [{ t: "it decided what the release earned" }] })
  lines.push({ segs: [{ t: "it wrote the kit" }] })

  const rendered: Array<[boolean, string]> = [
    [DONE(meta.status.card), "the card"],
    [DONE(meta.status.film), "the film"],
    [DONE(meta.status.vertical), "the vertical cut"],
    [DONE(meta.status.launch), "the launch video"],
  ]
  for (const [ok, noun] of rendered) {
    if (ok) lines.push({ segs: [{ t: `imaji rendered ${noun}` }] })
  }
  lines.push({ segs: [{ t: "kit ready" }], done: true })
  return lines
}

/** Files for one kit are served by the read id, never by the token. */
function fileBase(readId: string, tag: string): string {
  return `/api/kits/${readId}/${encodeURIComponent(tag)}`
}

export async function loadShowcase(): Promise<Showcase> {
  const readId = (process.env.IMAJI_SHOWCASE_READID || "").trim()
  if (!readId) return STATIC

  try {
    const token = await tokenForReadId(readId)
    if (!token) return STATIC

    const metas = await listKits(token)
    const releases = metas.filter((m) => !isOnboarding(m.tag))
    const newest = releases[0]
    if (!newest) return STATIC

    const kit = await readKit(token, newest.tag)
    const meta = (await readMeta(token, newest.tag)) ?? newest
    if (!kit) return STATIC

    const previous = releases[1]?.tag ?? null
    const base = fileBase(readId, newest.tag)

    /* the fold needs a film that exists. Usually it is this kit's own; when
       this release's film is still rendering or failed, the newest one that
       did render stands in and the sentence under the headline names its
       version rather than this one's. */
    const withFilm = releases.find((m) => DONE(m.status.film)) ?? null
    const fold = withFilm
      ? {
          src: `${fileBase(readId, withFilm.tag)}/film.mp4`,
          poster: DONE(withFilm.status.card)
            ? `${fileBase(readId, withFilm.tag)}/card.png`
            : undefined,
          version: withFilm.tag,
        }
      : STATIC.fold

    const cardHref = DONE(meta.status.card) ? `${base}/card.png` : null

    return {
      live: true,
      version: kit.version,
      repo: kit.repo,
      previousVersion: previous,
      fold,
      log: logFor(meta, previous),
      card: cardHref,
      film: DONE(meta.status.film)
        ? { src: `${base}/film.mp4`, poster: cardHref ?? undefined }
        : null,
      vertical: DONE(meta.status.vertical) ? { src: `${base}/film-vertical.mp4` } : null,
      launch: DONE(meta.status.launch)
        ? { src: `${base}/launch.mp4`, poster: cardHref ?? undefined }
        : null,
      tweet: kit.tweet ?? null,
      thread: kit.thread,
      linkedin: paragraphsOf(kit.linkedin),
      made: madeSentence(meta, previous ?? undefined),
      memory: kit.memory ?? null,
      skipped: kit.skipped,
      brand: {
        name: kit.brand.name,
        logo: kit.brand.logoUrl ?? null,
        ground: kit.brand.ground === "light" ? "light" : "dark",
      },
      receivedAt: meta.receivedAt,
    }
  } catch {
    /* the front door is the one page that must never 500: a bad read id, a
       half-written kit or a missing data directory all fall back to the
       kit that ships with the repo */
    return STATIC
  }
}
