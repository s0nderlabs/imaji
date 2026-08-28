/* The renderer (SPEC section 4).

   A film is rendered by sharding it. The parent opens the composition once to
   read the duration off the one registered timeline, splits
   ceil(duration*fps) frames into contiguous ranges, and hands each range to a
   worker process (src/render/worker.ts) that runs its own Chrome at
   deviceScaleFactor = scale, seeks t = frame/fps on the paused timeline,
   screenshots every frame and pipes the PNGs into its own ffmpeg. Each worker
   writes a keyframe-aligned H.264 segment; the parent concat-copies the
   segments into the finished mp4. Nothing is ever staged as a PNG dump on
   disk, and the wall clock divides by the number of shards, which is what
   makes 4K at 60 fps affordable.

   The renderer decides nothing about the content. It opens a file, seeks a
   timeline and writes pixels. */
import { spawn, type ChildProcess } from "node:child_process"
import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import puppeteer, { type Browser, type Page } from "puppeteer-core"

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

/* the shipped defaults: 4K (a 1920x1080 stage at deviceScaleFactor 2) at
   60 fps, rendered across most of the cores on the box */
export const DEFAULT_FILM_FPS = 60
export const DEFAULT_RENDER_SCALE = 2

export function chromePath(): string {
  return process.env.CHROME_PATH || DEFAULT_CHROME
}

export function ffmpegPath(): string {
  return process.env.FFMPEG_PATH || "ffmpeg"
}

/* One env reader for all three knobs: blank, unparseable and out of range all
   mean "use the default" rather than "fail the render". */
export function intFromEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  const i = Math.round(n)
  if (i < min || i > max) return fallback
  return i
}

/* IMAJI_RENDER_FPS is the name; FILM_FPS is the one this used to have and is
   still read so an older .env keeps working. */
export function filmFps(): number {
  const raw = process.env.IMAJI_RENDER_FPS ?? process.env.FILM_FPS
  return intFromEnv(raw, DEFAULT_FILM_FPS, 1, 240)
}

/* deviceScaleFactor for the video cuts: 2 turns the 1920x1080 stage into
   3840x2160 and the 1080x1920 vertical stage into 2160x3840. */
export function renderScale(): number {
  return intFromEnv(process.env.IMAJI_RENDER_SCALE, DEFAULT_RENDER_SCALE, 1, 4)
}

/* Two cores are left alone on purpose: one for the server that is answering
   requests while a kit renders, one for whatever else the box is doing. */
export function defaultShards(cpuCount: number = os.cpus().length): number {
  const cpus = Number.isFinite(cpuCount) && cpuCount > 0 ? Math.floor(cpuCount) : 4
  return Math.max(2, Math.min(8, cpus - 2))
}

export function renderShards(): number {
  return intFromEnv(process.env.IMAJI_RENDER_SHARDS, defaultShards(), 1, 16)
}

export type FrameRange = { index: number; start: number; end: number }

/* Contiguous, gap free, overlap free: equal blocks with the last one
   absorbing the remainder. K never exceeds the frame count, so no worker is
   ever spawned for an empty range. */
export function planRanges(totalFrames: number, shards: number): FrameRange[] {
  const total = Number.isFinite(totalFrames) ? Math.floor(totalFrames) : 0
  if (total <= 0) return []
  const wanted = Number.isFinite(shards) ? Math.floor(shards) : 1
  const k = Math.max(1, Math.min(wanted, total))
  const block = Math.floor(total / k)
  const ranges: FrameRange[] = []
  for (let i = 0; i < k; i++) {
    const start = i * block
    const end = i === k - 1 ? total : (i + 1) * block
    ranges.push({ index: i, start, end })
  }
  return ranges
}

/* A project dir holds exactly one composition; find its entry file. */
export async function entryFor(projectDir: string): Promise<string> {
  const compositions = path.join(projectDir, "compositions")
  const names = await fs.readdir(compositions)
  for (const name of names) {
    const entry = path.join(compositions, name, "index.html")
    try {
      await fs.access(entry)
      return entry
    } catch {
      continue
    }
  }
  throw new Error(`no composition entry under ${compositions}`)
}

/* Chromium refuses to start as root without --no-sandbox, which is exactly
   what the Docker image does. The flag is opt-in through the environment so
   the Mac path (a normal user, a real sandbox) is untouched, and
   --disable-dev-shm-usage goes with it because a container /dev/shm is
   usually 64 MB and Chrome will crash on a 4K frame loop. */
export function chromeArgs(): string[] {
  const args = ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-extensions", "--mute-audio"]
  if (process.env.IMAJI_CHROME_NO_SANDBOX === "1") args.push("--no-sandbox", "--disable-dev-shm-usage")
  return args
}

async function launch(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: chromeArgs(),
  })
}

type Stage = { w: number; h: number }

async function openStage(browser: Browser, entry: string, scale: number): Promise<{ page: Page; stage: Stage }> {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.goto("file://" + entry, { waitUntil: "load", timeout: 60_000 })
  await page.evaluate(() => document.fonts.ready.then(() => true))

  const stage = await page.evaluate(() => {
    const el = document.querySelector("[data-composition-id]") as HTMLElement | null
    if (!el) return null
    return { w: Number(el.dataset.width || 1920), h: Number(el.dataset.height || 1080) }
  })
  if (!stage) throw new Error("no [data-composition-id] stage element found")

  /* the viewport is pinned to the stage so a screenshot is 1:1 with the
     design and no scrollbar can ever appear; the scale factor is what
     multiplies it up to 4K without touching a single number in the CSS */
  await page.setViewport({ width: stage.w, height: stage.h, deviceScaleFactor: scale })
  await page.evaluate(() => {
    const el = document.querySelector("[data-composition-id]") as HTMLElement | null
    if (el) el.style.transform = "none"
  })
  return { page, stage }
}

async function waitForReady(page: Page, timeoutMs = 15_000): Promise<void> {
  try {
    await page.waitForFunction(() => (window as unknown as { IMAJI_READY?: boolean }).IMAJI_READY === true, {
      timeout: timeoutMs,
      polling: 100,
    })
  } catch {
    /* a composition that never flips the flag still renders; it just may not
       have finished its font-size ladder. Better a slightly loose fit than a
       failed kit. */
  }
}

/* The card is a still: one screenshot of the stage element. It stays at the
   stage's own 1200x630, which is the size the kit page, the docs and the
   Mind-facing contract all name. */
/* Chrome is the expensive thing on this box. However many kits arrive at
   once, at most two cards and one sharded video render run at a time; the
   rest wait their turn in order. */
class Gate {
  private active = 0
  private waiting: Array<() => void> = []
  constructor(private readonly limit: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve))
    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      const next = this.waiting.shift()
      if (next) next()
    }
  }
}
const cardGate = new Gate(2)
const videoGate = new Gate(1)

export async function renderCard(projectDir: string, outPng: string): Promise<void> {
  return cardGate.run(() => renderCardNow(projectDir, outPng))
}

async function renderCardNow(projectDir: string, outPng: string): Promise<void> {
  const entry = await entryFor(projectDir)
  await fs.mkdir(path.dirname(outPng), { recursive: true })
  const browser = await launch()
  try {
    const { page } = await openStage(browser, entry, 1)
    await waitForReady(page)
    const stageEl = await page.$("[data-composition-id]")
    if (!stageEl) throw new Error("stage element vanished before the screenshot")
    const png = (await stageEl.screenshot({ type: "png" })) as Uint8Array
    await fs.writeFile(outPng, Buffer.from(png))
  } finally {
    await browser.close()
  }
}

/* Take exclusive control of the registered timeline: pause, rewind, and
   disarm play/resume/restart so a composition's own autoplay kicker can never
   race the seek loop. Returns the duration in seconds. */
async function takeTimeline(page: Page): Promise<number> {
  let duration = 0
  for (let tries = 0; tries < 50 && duration === 0; tries++) {
    const info = await page.evaluate(() => {
      const w = window as unknown as {
        __timelines?: Record<string, unknown>
        __renderTl?: unknown
      }
      const registry = w.__timelines
      if (!registry) return null
      const tl = (registry.main ?? Object.values(registry)[0]) as
        | { pause: () => void; time: (t?: number, s?: boolean) => void; duration: () => number; play?: unknown; resume?: unknown; restart?: unknown }
        | undefined
      if (!tl) return null
      w.__renderTl = tl
      tl.pause()
      tl.time(0)
      tl.play = function (this: unknown) { return this }
      tl.resume = function (this: unknown) { return this }
      tl.restart = function (this: unknown) { return this }
      const d = tl.duration()
      return Number.isFinite(d) && d > 0 ? { duration: d } : { duration: 0 }
    })
    if (info && info.duration > 0) duration = info.duration
    else await new Promise((r) => setTimeout(r, 100))
  }
  if (duration === 0) throw new Error("no usable window.__timelines.main appeared within 5s")
  return duration
}

/* One frame's worth of page work, run inside Chrome:
   seek the paused timeline, let a composition that exposes __prepare(t) do
   whatever it needs for this instant, and if the stage holds a <video>, wait
   for it to finish decoding to the new time so the screenshot cannot catch a
   torn or stale frame. Resolves at once when there is no video, which is
   every composition imaji ships today. */
const SEEK_AND_SETTLE = (tt: number): Promise<boolean> => {
  const w = window as unknown as {
    __renderTl: { pause: () => void; time: (t: number, s: boolean) => void }
    __prepare?: (t: number) => unknown
  }
  w.__renderTl.pause()
  w.__renderTl.time(tt, false)
  const prepared = typeof w.__prepare === "function" ? Promise.resolve(w.__prepare(tt)) : Promise.resolve()
  return prepared.then(() => {
    const stage = document.querySelector("[data-composition-id]")
    const video = (stage ? stage.querySelector("video") : document.querySelector("video")) as HTMLVideoElement | null
    if (!video || !video.currentSrc || video.readyState < 1 || !video.seeking) return true
    return new Promise<boolean>((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        video.removeEventListener("seeked", finish)
        resolve(true)
      }
      video.addEventListener("seeked", finish)
      setTimeout(finish, 2000)
    })
  })
}

/* A freshly launched worker must not screenshot an embedded <video> before it
   has decodable data, or the first in-window frames of its range tear.
   Resolves immediately when there is no video. */
const WAIT_FOR_VIDEO_DATA = (): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const stage = document.querySelector("[data-composition-id]")
    const video = (stage ? stage.querySelector("video") : document.querySelector("video")) as HTMLVideoElement | null
    if (!video || !video.currentSrc || video.readyState >= 2) return resolve(true)
    const finish = () => resolve(true)
    video.addEventListener("loadeddata", finish, { once: true })
    video.addEventListener("canplay", finish, { once: true })
    setTimeout(finish, 15_000)
  })

function writeFrame(stdin: NodeJS.WritableStream, buf: Buffer): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ok = stdin.write(buf, (err) => err && reject(err))
    if (ok) resolve()
    else stdin.once("drain", resolve)
  })
}

export type ShardOptions = {
  entry: string
  start: number
  end: number
  fps: number
  scale: number
  segment: string
  onFrame?: (done: number) => void
}

/* One shard: its own Chrome, its own ffmpeg, its own slice of the timeline.
   The segment is written with a closed GOP whose length is one second, so it
   opens on an IDR and the parent's concat can stream-copy it. */
export async function renderShard(options: ShardOptions): Promise<void> {
  const { entry, start, end, fps, scale, segment } = options
  await fs.mkdir(path.dirname(segment), { recursive: true })
  const browser = await launch()
  let ff: ChildProcess | null = null
  try {
    const { page } = await openStage(browser, entry, scale)
    await waitForReady(page)
    await takeTimeline(page)
    await page.evaluate(WAIT_FOR_VIDEO_DATA)

    const encoder = spawn(
      ffmpegPath(),
      [
        "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-x264-params", "open-gop=0",
        "-pix_fmt", "yuv420p",
        /* every segment starts on a keyframe and keeps one per second, which
           is what lets the parent concat them with -c copy */
        "-g", String(fps), "-keyint_min", String(fps),
        "-video_track_timescale", "90000",
        "-f", "mp4", segment,
      ],
      { stdio: ["pipe", "inherit", "inherit"] },
    )
    ff = encoder

    let ffError: Error | null = null
    const ffDone = new Promise<void>((resolve, reject) => {
      encoder.on("close", (code) => {
        if (code === 0) return resolve()
        ffError = ffError ?? new Error("ffmpeg exited " + code)
        reject(ffError)
      })
      encoder.on("error", (error: Error) => {
        ffError = error
        reject(error)
      })
    })
    /* ffmpeg can fail long before the frame loop reaches its await (a missing
       binary rejects immediately), so the handler is attached at creation and
       the real await stays below. */
    ffDone.catch(() => undefined)
    encoder.stdin?.on("error", () => undefined)

    try {
      for (let f = start; f < end; f++) {
        await page.evaluate(SEEK_AND_SETTLE, f / fps)
        const png = (await page.screenshot({ type: "png" })) as Uint8Array
        await writeFrame(encoder.stdin as NodeJS.WritableStream, Buffer.from(png))
        options.onFrame?.(f - start + 1)
      }
      encoder.stdin?.end()
    } catch (error) {
      encoder.stdin?.destroy()
      encoder.kill("SIGKILL")
      throw ffError ?? error
    }
    await ffDone
    ff = null
  } finally {
    /* on the throw path ffmpeg is still live: kill it so it cannot finalize a
       truncated segment the parent would then happily concat */
    if (ff && ff.exitCode === null) {
      try { ff.kill("SIGKILL") } catch { /* already gone */ }
    }
    await browser.close().catch(() => undefined)
  }
}

export type FilmOptions = {
  fps?: number
  /* deviceScaleFactor; 2 is 4K out of a 1920x1080 stage */
  scale?: number
  /* how many worker processes share the frames */
  shards?: number
  onProgress?: (frame: number, total: number) => void
  /* the ceiling for this render; the ten-second film and the forty-five
     second launch video are not the same size of job */
  deadlineMs?: number
}

/* A stalled Chrome or a stalled ffmpeg would otherwise hold "rendering"
   forever and keep headless browsers resident. Ten minutes is well past what
   a 10 s film costs at 4K 60 on this box. */
export const FILM_DEADLINE_MS = 10 * 60 * 1000

/* A launch video is up to 45 s, so up to about four and a half times the
   frames of a film. The deadline scales with it. */
export const LAUNCH_DEADLINE_MS = 30 * 60 * 1000

/* bun runs the worker. Under `bun run start` the server is already a bun
   process, so its own binary is the safest thing to re-enter. */
export function bunPath(): string {
  if (process.env.IMAJI_BUN) return process.env.IMAJI_BUN
  const exec = process.execPath || ""
  if (path.basename(exec).toLowerCase().startsWith("bun")) return exec
  return "bun"
}

/* The worker sits beside the compositions, so it is found the same way they
   are and a relocated src/ needs only the one env var. */
export function workerEntry(): string {
  if (process.env.IMAJI_RENDER_WORKER) return process.env.IMAJI_RENDER_WORKER
  const src = process.env.IMAJI_RENDER_SRC || path.join(process.cwd(), "src", "render")
  return path.join(src, "worker.ts")
}

/* concat-demuxer single-quote escaping: a literal ' inside a path becomes '\'' */
function concatEscape(value: string): string {
  return value.replace(/'/g, "'\\''")
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "inherit", "inherit"] })
    child.on("error", reject)
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited ${code}`))))
  })
}

async function runFilm(
  projectDir: string,
  outMp4: string,
  partFile: string,
  shardDir: string,
  children: Set<ChildProcess>,
  options: FilmOptions,
): Promise<void> {
  const fps = options.fps && options.fps > 0 ? options.fps : filmFps()
  const scale = options.scale && options.scale > 0 ? options.scale : renderScale()
  const entry = await entryFor(projectDir)

  /* one cheap pass at scale 1 to read the duration off the timeline; the
     workers are the only ones that pay for 4K */
  const probe = await launch()
  let duration = 0
  try {
    const { page } = await openStage(probe, entry, 1)
    await waitForReady(page)
    duration = await takeTimeline(page)
  } finally {
    await probe.close().catch(() => undefined)
  }

  /* exactly the frame count the single-process engine had: ceil(duration*fps),
     seeking t = f/fps and never seeking t = duration itself */
  const totalFrames = Math.ceil(duration * fps)
  const ranges = planRanges(totalFrames, options.shards && options.shards > 0 ? options.shards : renderShards())
  if (ranges.length === 0) throw new Error("the composition asked for zero frames")

  await fs.rm(shardDir, { recursive: true, force: true })
  await fs.mkdir(shardDir, { recursive: true })

  const segments = ranges.map((r) => path.join(shardDir, `seg-${String(r.index).padStart(2, "0")}.mp4`))
  const done = new Array<number>(ranges.length).fill(0)

  const worker = workerEntry()
  const bun = bunPath()
  const waits = ranges.map((range, i) => {
    const child = spawn(
      bun,
      [
        worker,
        "--entry", entry,
        "--start", String(range.start),
        "--end", String(range.end),
        "--fps", String(fps),
        "--scale", String(scale),
        "--segment", segments[i],
        "--shard", String(range.index),
      ],
      { stdio: ["ignore", "pipe", "inherit"] },
    )
    children.add(child)

    /* the worker reports frame counts on stdout, one line each, so the parent
       can add them up and keep onProgress meaningful across shards */
    let buffered = ""
    child.stdout?.setEncoding("utf8")
    child.stdout?.on("data", (chunk: string) => {
      buffered += chunk
      const lines = buffered.split("\n")
      buffered = lines.pop() ?? ""
      for (const line of lines) {
        const match = /^imaji-shard (\d+) (\d+)$/.exec(line.trim())
        if (!match) continue
        done[Number(match[1])] = Number(match[2])
        options.onProgress?.(done.reduce((a, b) => a + b, 0), totalFrames)
      }
    })

    return new Promise<void>((resolve, reject) => {
      child.on("error", reject)
      child.on("close", (code) => {
        children.delete(child)
        if (code === 0) resolve()
        else reject(new Error(`shard ${range.index} exited ${code}`))
      })
    })
  })

  try {
    await Promise.all(waits)
  } catch (error) {
    /* one shard died: SIGTERM the siblings so each worker's Chrome is closed
       by puppeteer's own handler rather than orphaned */
    for (const child of children) {
      if (child.exitCode === null) {
        try { child.kill("SIGTERM") } catch { /* already gone */ }
      }
    }
    throw error
  }

  const listPath = path.join(shardDir, "concat.txt")
  await fs.writeFile(listPath, segments.map((s) => `file '${concatEscape(s)}'`).join("\n") + "\n", "utf8")
  await run(ffmpegPath(), [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listPath,
    "-c", "copy", "-movflags", "+faststart",
    /* the muxer is named explicitly because the output is written to a .part
       file first and ffmpeg cannot infer mp4 from that extension */
    "-f", "mp4", partFile,
  ])

  /* the film only becomes film.mp4 once it is whole: two renders of the same
     tag would otherwise interleave into one unplayable file, and a page could
     be handed a half-written mp4 as ready. rename is atomic. */
  await fs.rename(partFile, outMp4)
}

export async function renderFilm(projectDir: string, outMp4: string, options: FilmOptions = {}): Promise<void> {
  return videoGate.run(() => renderFilmNow(projectDir, outMp4, options))
}

async function renderFilmNow(projectDir: string, outMp4: string, options: FilmOptions = {}): Promise<void> {
  await fs.mkdir(path.dirname(outMp4), { recursive: true })
  const partFile = `${outMp4}.${randomUUID()}.part`
  const shardDir = path.join(projectDir, `.shards-${randomUUID()}`)
  const children = new Set<ChildProcess>()

  const deadlineMs = options.deadlineMs && options.deadlineMs > 0 ? options.deadlineMs : FILM_DEADLINE_MS
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        for (const child of children) {
          if (child.exitCode === null) {
            try { child.kill("SIGTERM") } catch { /* already gone */ }
          }
        }
        reject(new Error(`film render exceeded ${Math.round(deadlineMs / 1000)}s`))
      }, deadlineMs)
    })
    await Promise.race([runFilm(projectDir, outMp4, partFile, shardDir, children, options), deadline])
  } finally {
    if (timer) clearTimeout(timer)
    for (const child of children) {
      if (child.exitCode === null) {
        try { child.kill("SIGTERM") } catch { /* already gone */ }
      }
    }
    await fs.rm(partFile, { force: true }).catch(() => undefined)
    await fs.rm(shardDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
