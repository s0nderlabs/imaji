/* demo/render.mjs

   Renders the launch video. Three parts, one join:

     A  demo/composition/index.html?part=a   segments 1 to 6, 72 s
     B  the launch video the Mind wrote for v0.3.0, untouched
     C  demo/composition/index.html?part=c   the end card, 11 s

   A and C are rendered the exact way the product renders its film: pin the
   viewport to the stage, take the ONE paused timeline registered on
   window.__timelines.main, disarm its playback so nothing races the seek loop,
   seek t = frame/fps for ceil(duration*fps) frames, screenshot each frame and
   pipe the PNG stream straight into ffmpeg. B is copied in as it came out of
   the renderer, so what the video claims imaji made is the file imaji made.

   All three are encoded with the same settings and joined with the concat
   demuxer, so the result is one continuous h264 stream.

     bun demo/render.mjs                 the whole video
     bun demo/render.mjs --shots         one still per segment, no video
     bun demo/render.mjs --at 12,34.5    one still at each of those seconds
     bun demo/render.mjs --part c --at 4 a still from the end card */
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const ENTRY = path.join(HERE, "composition", "index.html")
const OUT_DIR = path.join(HERE, "out")
const WORK = path.join(OUT_DIR, "parts")
const OUT_MP4 = path.join(OUT_DIR, "imaji-launch.mp4")

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const FPS = Number(process.env.DEMO_FPS || 30)
const DEADLINE_MS = 45 * 60 * 1000

/* the encode every part is normalised to, so the joins are seamless */
const ENC = [
  "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
  "-preset", "medium", "-crf", "18",
  "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-video_track_timescale", "30000",
  "-an", "-movflags", "+faststart",
]

/* one still per segment, at a moment where that segment is fully resolved */
const SEGMENTS = [
  { n: 1, part: "a", t: 5.6, what: "cold open" },
  { n: 2, part: "a", t: 9.4, what: "you tag a release" },
  { n: 3, part: "a", t: 14.4, what: "the terminal" },
  { n: 4, part: "a", t: 22.4, what: "the run, and the message going out" },
  { n: 5, part: "a", t: 26.4, what: "your Mind reads it" },
  { n: 6, part: "a", t: 37.0, what: "the Mind writes the kit" },
  { n: 7, part: "a", t: 45.4, what: "the kit page, the card" },
  { n: 8, part: "a", t: 53.6, what: "the film inside the page" },
  { n: 9, part: "a", t: 64.5, what: "the real app, the reply" },
  { n: 10, part: "a", t: 72.6, what: "the real app, the refusal" },
  { n: 11, part: "a", t: 75.6, what: "the bridge" },
  { n: 12, part: "c", t: 9.0, what: "the end card" },
]

const args = process.argv.slice(2)
const shotsOnly = args.includes("--shots")
const atIndex = args.indexOf("--at")
const atList = atIndex >= 0 ? String(args[atIndex + 1] || "").split(",").map(Number).filter((n) => Number.isFinite(n)) : []
const partIndex = args.indexOf("--part")
const atPart = partIndex >= 0 ? String(args[partIndex + 1] || "a").toLowerCase() : "a"

function run(cmd, argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ["ignore", "inherit", "inherit"] })
    p.on("error", reject)
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}
function capture(cmd, argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ["ignore", "pipe", "ignore"] })
    let out = ""
    p.stdout.on("data", (d) => (out += d))
    p.on("error", reject)
    p.on("close", () => resolve(out.trim()))
  })
}
async function frameCount(file) {
  const n = await capture(FFPROBE, [
    "-v", "error", "-select_streams", "v:0",
    "-count_frames", "-show_entries", "stream=nb_read_frames",
    "-of", "default=nokey=1:noprint_wrappers=1", file,
  ])
  return Number(n)
}
async function probe(file) {
  return capture(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration,size,bit_rate",
    "-show_entries", "stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt,profile",
    "-of", "default=noprint_wrappers=1", file,
  ])
}

async function openStage(browser, part) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  page.on("pageerror", (e) => console.error("  page error:", e.message))
  await page.goto("file://" + ENTRY + "?part=" + part, { waitUntil: "load", timeout: 120_000 })
  const stage = await page.evaluate(() => {
    const s = document.querySelector("[data-composition-id]")
    return s ? { w: Number(s.dataset.width || 1920), h: Number(s.dataset.height || 1080) } : null
  })
  if (!stage) throw new Error("no [data-composition-id] stage element found")
  await page.setViewport({ width: stage.w, height: stage.h, deviceScaleFactor: 1 })
  /* the faces have to be in and every frame of the film decoded before the
     timeline exists, so the caret lands on real metrics */
  await page.waitForFunction(() => window.IMAJI_READY === true, { timeout: 240_000, polling: 200 })
  const fonts = await page.evaluate(() => window.IMAJI_FONTS)
  if (fonts && fonts.missing && fonts.missing.length) throw new Error("fonts missing: " + fonts.missing.join(", "))
  return page
}

async function takeTimeline(page) {
  const info = await page.evaluate(() => {
    const w = window
    const tl = w.__timelines && (w.__timelines.main || Object.values(w.__timelines)[0])
    if (!tl) return null
    w.__renderTl = tl
    tl.pause()
    tl.time(0)
    tl.play = function () { return this }
    tl.resume = function () { return this }
    tl.restart = function () { return this }
    return { duration: tl.duration() }
  })
  if (!info || !(info.duration > 0)) throw new Error("no usable window.__timelines.main")
  return info.duration
}

/* seek, then hand the reels the time so they can decode and paint the exact
   frame of real footage this moment needs. __prepare keeps a small sliding
   window of decoded images rather than holding hundreds at once. */
async function seek(page, t) {
  await page.evaluate((tt) => {
    window.__renderTl.pause()
    window.__renderTl.time(tt, false)
  }, t)
  await page.evaluate((tt) => window.__prepare && window.__prepare(tt), t)
}

function writeFrame(stdin, buf) {
  return new Promise((resolve, reject) => {
    const ok = stdin.write(buf, (err) => err && reject(err))
    if (ok) resolve()
    else stdin.once("drain", resolve)
  })
}

/* renders one part to an mp4 and returns its frame count */
async function renderPart(browser, part, file, started) {
  const page = await openStage(browser, part)
  const duration = await takeTimeline(page)
  const totalFrames = Math.round(duration * FPS)
  console.log(`part ${part}: ${duration.toFixed(2)}s, ${totalFrames} frames`)

  const ff = spawn(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    ...ENC, "-f", "mp4", file,
  ], { stdio: ["pipe", "inherit", "inherit"] })
  const ffDone = new Promise((resolve, reject) => {
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg exited " + code))))
    ff.on("error", reject)
  })
  ffDone.catch(() => undefined)
  ff.stdin.on("error", () => undefined)

  try {
    for (let f = 0; f < totalFrames; f++) {
      await seek(page, f / FPS)
      const png = await page.screenshot({ type: "png" })
      await writeFrame(ff.stdin, Buffer.from(png))
      if ((f + 1) % 150 === 0 || f + 1 === totalFrames) {
        const secs = (Date.now() - started) / 1000
        const rate = (f + 1) / secs
        console.log(`  ${f + 1}/${totalFrames}  ${((f + 1) / totalFrames * 100).toFixed(0)}%  ${rate.toFixed(1)} fps`)
      }
    }
    ff.stdin.end()
  } catch (error) {
    ff.stdin.destroy()
    ff.kill("SIGKILL")
    throw error
  }
  await ffDone
  await page.close()
  return totalFrames
}

/* ---------- main ---------- */

await fs.mkdir(OUT_DIR, { recursive: true })
await fs.mkdir(WORK, { recursive: true })

/* the launch video of the newest kit for this tag, found in the store the way
   capture.mjs finds it. The path holds a kit token, so it is never written to
   a file. */
const TAG = process.env.IMAJI_TAG || "v0.3.0"
async function newestLaunch() {
  const kitsDir = path.join(ROOT, "data", "kits")
  let best = null
  for (const id of await fs.readdir(kitsDir)) {
    const dir = path.join(kitsDir, id, TAG)
    try {
      const meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8"))
      const at = Date.parse(meta.receivedAt || 0)
      if (!best || at > best.at) best = { at, dir }
    } catch {
      continue
    }
  }
  if (!best) throw new Error(`no ${TAG} kit found under data/kits`)
  const file = path.join(best.dir, "launch.mp4")
  await fs.access(file)
  return file
}
const LAUNCH = await newestLaunch()

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-extensions", "--mute-audio"],
})
const started = Date.now()

try {
  if (shotsOnly || atList.length) {
    const marks = atList.length
      ? atList.map((t) => ({ part: atPart, t, name: `at-${atPart}-${t}` }))
      : SEGMENTS.map((s) => ({ part: s.part, t: s.t, name: `segment-${s.n}`, what: s.what }))
    for (const part of ["a", "c"]) {
      const mine = marks.filter((m) => m.part === part)
      if (!mine.length) continue
      const page = await openStage(browser, part)
      const duration = await takeTimeline(page)
      for (const m of mine) {
        await seek(page, Math.min(m.t, duration - 0.001))
        const out = path.join(OUT_DIR, m.name + ".png")
        await page.screenshot({ path: out, type: "png" })
        console.log(`  ${path.basename(out)}  part ${part}  t=${m.t}s  ${m.what || ""}`)
      }
      await page.close()
    }
  } else {
    const timer = setTimeout(() => {
      console.error(`render exceeded ${Math.round(DEADLINE_MS / 1000)}s`)
      void browser.close()
      process.exit(1)
    }, DEADLINE_MS)

    const partA = path.join(WORK, "a.mp4")
    const partB = path.join(WORK, "b.mp4")
    const partC = path.join(WORK, "c.mp4")

    const framesA = await renderPart(browser, "a", partA, started)
    const framesC = await renderPart(browser, "c", partC, started)

    /* the launch video, re-wrapped with the same encode so the joins line up.
       Nothing about the picture changes: same size, same rate, same content. */
    console.log("normalising the launch video")
    await run(FFMPEG, ["-y", "-loglevel", "error", "-i", LAUNCH, ...ENC, partB])

    const list = path.join(WORK, "parts.txt")
    await fs.writeFile(list, [partA, partB, partC].map((f) => `file '${f}'`).join("\n") + "\n")
    console.log("joining")
    await run(FFMPEG, [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list,
      "-c", "copy", "-movflags", "+faststart", OUT_MP4,
    ])
    clearTimeout(timer)

    const framesB = await frameCount(partB)
    const framesOut = await frameCount(OUT_MP4)
    console.log(`\nwrote ${path.relative(ROOT, OUT_MP4)} in ${Math.round((Date.now() - started) / 1000)}s`)
    console.log(`frames  a ${framesA} + b ${framesB} + c ${framesC} = ${framesA + framesB + framesC}, output ${framesOut}`)
    if (framesOut !== framesA + framesB + framesC) console.error("FRAME COUNT MISMATCH at the joins")
    console.log(await probe(OUT_MP4))

    /* a contact sheet of the finished film: 24 frames, six per row, so the
       whole thing can be looked at in one go without scrubbing */
    const step = Math.max(1, Math.floor(framesOut / 24))
    await run(FFMPEG, [
      "-y", "-loglevel", "error", "-i", OUT_MP4,
      "-vf", `select='not(mod(n\,${step}))',scale=426:240,tile=6x4`,
      "-frames:v", "1", "-q:v", "3", path.join(OUT_DIR, "contact.jpg"),
    ])
    console.log("wrote demo/out/contact.jpg")

    /* one still per segment, so the result can be checked without scrubbing */
    for (const part of ["a", "c"]) {
      const mine = SEGMENTS.filter((s) => s.part === part)
      const page = await openStage(browser, part)
      const duration = await takeTimeline(page)
      for (const s of mine) {
        await seek(page, Math.min(s.t, duration - 0.001))
        await page.screenshot({ path: path.join(OUT_DIR, `segment-${s.n}.png`), type: "png" })
      }
      /* the poster: the cold open, at 1280x720 */
      if (part === "a") {
        await seek(page, 5.6)
        await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
        await page.evaluate(() => {
          const s = document.querySelector(".stage")
          s.style.transformOrigin = "0 0"
          s.style.transform = "scale(0.6666667)"
        })
        await page.screenshot({ path: path.join(OUT_DIR, "poster.png"), type: "png" })
      }
      await page.close()
    }
    console.log(`wrote demo/out/segment-1.png through segment-${SEGMENTS.length}.png and poster.png`)
  }
} finally {
  await browser.close()
}
