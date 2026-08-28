/* POST /api/render, SPEC section 4. The Mind calls this with the kit JSON.

   The card renders synchronously so the reply carries a real image; the film
   renders in the background and reports through meta.json's film status. The
   response is deliberately small and plain: the Mind reads it back with
   HTTP_Execute and repeats kitUrl to the user. */
import { KitError, normaliseKit, type KitJSON } from "@/lib/kit"
import { fileFor, patchMeta, writeKit, writeMeta, type Meta, type MetaPatch, type VideoKind } from "@/lib/store"
import { sweepInterrupted } from "@/lib/sweep"
import { hasToken } from "@/lib/tokens"
import { rememberToken } from "@/lib/readid"
import { baseUrl, kitUrls } from "@/lib/urls"
import {
  composeProject,
  discardProject,
  fetchLogoDataUrl,
  resolveLaunchBeats,
  varsFromKit,
  type Project,
  type RenderVars,
} from "@/render/compose"
import { LAUNCH_DEADLINE_MS, renderCard, renderFilm, type FilmOptions } from "@/render/render"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

/* a kit is a few kilobytes of JSON; anything past this is not a kit */
const MAX_BODY_BYTES = 256 * 1024
/* how many video renders may be queued or running before new work is refused */
const MAX_QUEUED_VIDEOS = 6

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") || ""
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim())
  return match ? match[1] : null
}

function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ ok: false, error, ...extra }, { status, headers: { "Cache-Control": "private, no-store" } })
}

/* One render per tag per cut at a time. Re-runs for the same tag are allowed
   by the spec, and a second POST inside the render window would otherwise
   start a second Chrome and a second ffmpeg writing the same file. The
   newcomer waits for the one in flight and then renders on top of it. The
   three cuts have their own keys, so the launch video does not queue behind
   the film it has nothing to do with. */
const inFlightVideos = new Map<string, Promise<void>>()

/* one field per cut, so a failed launch cannot put its message under the film */
function statusPatch(kind: VideoKind, value: "rendering" | "done" | "failed", error?: string): MetaPatch {
  const status: MetaPatch["status"] =
    kind === "film" ? { film: value } : kind === "vertical" ? { vertical: value } : { launch: value }
  if (!error) return { status }
  const errors: MetaPatch["errors"] =
    kind === "film" ? { film: error } : kind === "vertical" ? { vertical: error } : { launch: error }
  return { status, errors, error }
}

/* A video render is fire-and-forget. Every path through it ends in a meta
   write and nothing it can throw is allowed to escape: an unhandled
   rejection here would take the whole server down. */
function startVideo(
  kind: VideoKind,
  token: string,
  tag: string,
  file: string,
  compose: () => Promise<Project>,
  options: FilmOptions = {},
): void {
  const key = `${token}/${tag}/${kind}`
  const previous = inFlightVideos.get(key)

  const run = (async () => {
    if (previous) await previous.catch(() => undefined)
    await patchMeta(token, tag, statusPatch(kind, "rendering"))
    const project = await compose()
    try {
      await renderFilm(project.dir, fileFor(token, tag, file), options)
      await patchMeta(token, tag, statusPatch(kind, "done"))
    } finally {
      await discardProject(project)
    }
  })()

  inFlightVideos.set(key, run)

  void run
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`imaji: ${kind} render failed for`, tag, message)
      await patchMeta(token, tag, statusPatch(kind, "failed", message.slice(0, 400))).catch(() => null)
    })
    .finally(() => {
      if (inFlightVideos.get(key) === run) inFlightVideos.delete(key)
    })
}

export async function POST(request: Request) {
  await sweepInterrupted()

  const token = bearer(request)
  if (!token) return fail(401, "missing bearer token")
  if (!(await hasToken(token))) return fail(401, "unknown token")
  rememberToken(token)

  const declared = Number(request.headers.get("content-length") || "0")
  if (declared > MAX_BODY_BYTES) return fail(413, "kit JSON is larger than 256 KB")
  if (inFlightVideos.size >= MAX_QUEUED_VIDEOS) return fail(429, "the renderer is busy, try again in a minute")
  let body: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) return fail(413, "kit JSON is larger than 256 KB")
    body = JSON.parse(text)
  } catch {
    return fail(400, "body is not valid JSON")
  }

  let kit: KitJSON
  let warnings: string[]
  try {
    const normalised = normaliseKit(body)
    kit = normalised.kit
    warnings = normalised.warnings
  } catch (error) {
    if (error instanceof KitError) return fail(400, error.message)
    return fail(400, error instanceof Error ? error.message : "invalid kit")
  }

  const tag = kit.version
  const base = baseUrl(request)
  const urls = kitUrls(base, token, tag)
  const wantsCard = kit.outputs.includes("card")
  const wantsFilm = kit.outputs.includes("film")
  const wantsVertical = kit.outputs.includes("vertical")
  const wantsLaunch = kit.outputs.includes("launch") && !!kit.launch

  const meta: Meta = {
    repo: kit.repo,
    tag,
    receivedAt: new Date().toISOString(),
    outputs: kit.outputs,
    status: {
      card: "none",
      film: wantsFilm ? "queued" : "none",
      vertical: wantsVertical ? "queued" : "none",
      launch: wantsLaunch ? "queued" : "none",
    },
    kitUrl: urls.kitUrl,
    indexUrl: urls.indexUrl,
  }

  try {
    await writeKit(token, tag, kit)
    await writeMeta(token, tag, meta)
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "could not write the kit")
  }

  /* the logo is fetched once and shared by both renders */
  const logoDataUrl = await fetchLogoDataUrl(kit.brand.logoUrl)
  if (kit.brand.logoUrl && !logoDataUrl) warnings.push("brand.logoUrl could not be fetched, using the brand name")

  if (wantsCard) {
    const project = await composeProject("card", { ...varsFromKit(kit), logoDataUrl })
    try {
      await renderCard(project.dir, fileFor(token, tag, "card.png"))
      meta.status.card = "done"
    } catch (error) {
      meta.status.card = "failed"
      /* no video is started past this point, so none of them may be left
         claiming a render nothing will ever move */
      if (meta.status.film === "queued") meta.status.film = "failed"
      if (meta.status.vertical === "queued") meta.status.vertical = "failed"
      if (meta.status.launch === "queued") meta.status.launch = "failed"
      meta.error = error instanceof Error ? error.message : String(error)
      meta.errors = { ...(meta.errors ?? {}), card: meta.error }
      await writeMeta(token, tag, meta)
      return fail(500, `card render failed: ${meta.error}`, { kitUrl: urls.kitUrl })
    } finally {
      await discardProject(project)
    }
    await writeMeta(token, tag, meta)
  }

  const vars: RenderVars = { ...varsFromKit(kit), logoDataUrl }
  /* kitUrls names the two files it has always known about; the two newer cuts
     are served from the same directory beside film.mp4 */
  const filesUrl = urls.film.replace(/\/film\.mp4$/, "")

  if (wantsFilm) {
    startVideo("film", token, tag, "film.mp4", () => composeProject("film", { ...vars, orientation: "landscape" }))
  }

  /* the same cut on a phone-shaped stage: same composition, same timeline,
     one var different */
  if (wantsVertical) {
    startVideo("vertical", token, tag, "film-vertical.mp4", () =>
      composeProject("film", { ...vars, orientation: "portrait" }),
    )
  }

  /* the launch video resolves its pictures first (fetches and captures, all
     of it before Chrome opens on the composition), so the compose step is
     where the slow part lives and the reply does not wait for it */
  if (wantsLaunch && kit.launch) {
    const beats = kit.launch.beats
    startVideo(
      "launch",
      token,
      tag,
      "launch.mp4",
      async () => {
        const resolved = await resolveLaunchBeats(beats)
        for (const warning of resolved.warnings) console.warn("imaji:", warning)
        return composeProject("launch", { ...vars, launch: { beats: resolved.beats } })
      },
      { deadlineMs: LAUNCH_DEADLINE_MS },
    )
  }

  return Response.json(
    {
      ok: true,
      kitUrl: urls.kitUrl,
      indexUrl: urls.indexUrl,
      ...(wantsCard ? { card: urls.card } : {}),
      ...(wantsFilm ? { film: urls.film } : {}),
      ...(wantsVertical ? { vertical: `${filesUrl}/film-vertical.mp4` } : {}),
      ...(wantsLaunch ? { launch: `${filesUrl}/launch.mp4` } : {}),
      filmStatus: wantsFilm ? "queued" : "none",
      verticalStatus: wantsVertical ? "queued" : "none",
      launchStatus: wantsLaunch ? "queued" : "none",
      ...(warnings.length ? { warnings } : {}),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
