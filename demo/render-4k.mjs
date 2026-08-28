/* demo/render-4k.mjs

   The same launch video as demo/render.mjs, at 3840x2160 and 60 fps end to
   end, rendered by imaji's own engine (src/render/render.ts) rather than by a
   single Chrome. The engine shards the frames across worker processes, each
   with its own Chrome at deviceScaleFactor 2 and its own ffmpeg, and
   concat-copies the segments, which is what makes 4K affordable here.

     A  demo/composition, part a   segments 1 to 6, 77 s, 4620 frames
     B  the launch video the Mind wrote for v0.3.0, re-rendered at 4K 60 from
        the same storyboard, through the same compose + render path the render
        route uses                 28.4 s, 1704 frames
     C  demo/composition, part c   the end card, 10 s, 600 frames

   The engine opens a project directory, not a URL, so parts A and C get a
   throwaway project each whose composition is the demo composition with the
   part chosen up front (window.DEMO_PART) instead of by query string. Every
   asset path stays exactly as it is in demo/composition, so nothing about the
   picture changes.

   Part B is re-rendered rather than upscaled: the kit JSON the Mind wrote is
   normalised, its beats are resolved (the live capture included) and the
   launch composition is rendered at the new size, so the pixels are real.

     bun demo/render-4k.mjs             the whole video
     bun demo/render-4k.mjs --keep      reuse any part already rendered
     bun demo/render-4k.mjs --part a    render one part and stop */
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const OUT_DIR = path.join(HERE, "out")
const WORK = path.join(OUT_DIR, "parts-4k")
const OUT_MP4 = path.join(OUT_DIR, "imaji-launch-4k60.mp4")
const POSTER = path.join(OUT_DIR, "poster-4k.png")

/* 4K at 60 fps, and six shards rather than the engine's eight: at this size
   the ceiling on a 16 GB box is memory, not cores. Anything already set in
   the environment wins. */
process.env.IMAJI_RENDER_SCALE ||= "2"
process.env.IMAJI_RENDER_FPS ||= "60"
process.env.IMAJI_RENDER_SHARDS ||= "6"
/* the capture beat inside the launch storyboard opens the live site */
process.env.IMAJI_BASE_URL ||= "https://imaji.s0nderlabs.xyz"
/* compose writes its throwaway project dir under IMAJI_DATA_DIR; the store
   the server reads is left alone */
process.env.IMAJI_DATA_DIR ||= path.join(WORK, "work")

const { renderFilm, filmFps, renderScale, renderShards, LAUNCH_DEADLINE_MS, ffmpegPath } =
  await import(path.join(ROOT, "src", "render", "render.ts"))
const { normaliseKit } = await import(path.join(ROOT, "src", "lib", "kit.ts"))
const { composeProject, discardProject, fetchLogoDataUrl, resolveLaunchBeats, varsFromKit } =
  await import(path.join(ROOT, "src", "render", "compose.ts"))

const FFMPEG = ffmpegPath()
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const TAG = process.env.IMAJI_TAG || "v0.3.0"

const args = process.argv.slice(2)
const keep = args.includes("--keep")
const onlyIndex = args.indexOf("--part")
const only = onlyIndex >= 0 ? String(args[onlyIndex + 1] || "").toLowerCase() : ""

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
  return Number(await capture(FFPROBE, [
    "-v", "error", "-select_streams", "v:0",
    "-count_frames", "-show_entries", "stream=nb_read_frames",
    "-of", "default=nokey=1:noprint_wrappers=1", file,
  ]))
}
async function probe(file) {
  return capture(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration,size,nb_streams",
    "-show_entries", "stream=width,height,r_frame_rate,codec_name,pix_fmt,profile,level,time_base",
    "-of", "default=noprint_wrappers=1", file,
  ])
}
async function exists(file) {
  try { await fs.access(file); return true } catch { return false }
}

function progress(label, started) {
  let last = 0
  return (frame, total) => {
    if (frame - last < 300 && frame < total) return
    last = frame
    const secs = (Date.now() - started) / 1000
    console.log(`  ${label} ${frame}/${total}  ${((frame / total) * 100).toFixed(0)}%  ${(frame / secs).toFixed(2)} fps  ${Math.round(secs)}s`)
  }
}

/* One throwaway project holding the demo composition with the part fixed.
   compositions/assets and src point back at the real files, so every relative
   URL inside index.html and build.js resolves exactly as it does when the
   composition is opened from demo/composition. */
async function projectFor(part) {
  const dir = path.join(WORK, "proj-" + part)
  const comp = path.join(dir, "compositions", "demo")
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(comp, { recursive: true })
  await fs.symlink(path.join(HERE, "assets"), path.join(dir, "compositions", "assets"))
  await fs.symlink(path.join(ROOT, "src"), path.join(dir, "src"))
  await fs.copyFile(path.join(HERE, "composition", "build.js"), path.join(comp, "build.js"))
  const html = await fs.readFile(path.join(HERE, "composition", "index.html"), "utf8")
  const marker = '<script src="../assets/text.js"></script>'
  if (!html.includes(marker)) throw new Error("the composition no longer loads ../assets/text.js")
  await fs.writeFile(
    path.join(comp, "index.html"),
    html.replace(marker, `<script>window.DEMO_PART = ${JSON.stringify(part)}</script>\n` + marker),
    "utf8",
  )
  return dir
}

async function renderStage(part, file) {
  if (keep && (await exists(file))) {
    console.log(`part ${part}: keeping ${path.relative(ROOT, file)}`)
    return
  }
  const dir = await projectFor(part)
  const started = Date.now()
  console.log(`part ${part}: rendering`)
  await renderFilm(dir, file, { deadlineMs: 90 * 60 * 1000, onProgress: progress(part, started) })
  await fs.rm(dir, { recursive: true, force: true })
  console.log(`part ${part}: ${Math.round((Date.now() - started) / 1000)}s`)
}

/* the newest kit for this tag, found in the store the way capture.mjs finds
   it. The path holds a kit token, so it is never printed. */
async function newestKit() {
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
  return path.join(best.dir, "kit.json")
}

async function renderLaunch(file) {
  if (keep && (await exists(file))) {
    console.log(`part b: keeping ${path.relative(ROOT, file)}`)
    return
  }
  const { kit, warnings } = normaliseKit(JSON.parse(await fs.readFile(await newestKit(), "utf8")))
  for (const w of warnings) console.warn("  kit warning:", w)
  if (!kit.launch) throw new Error(`the ${TAG} kit has no launch storyboard`)
  console.log(`part b: ${kit.repo} ${kit.version}, ${kit.launch.beats.length} beats`)

  const logoDataUrl = await fetchLogoDataUrl(kit.brand.logoUrl)
  if (kit.brand.logoUrl && !logoDataUrl) console.warn("  the brand logo could not be fetched")
  const resolved = await resolveLaunchBeats(kit.launch.beats)
  for (const w of resolved.warnings) console.warn("  beat warning:", w)
  console.log("  beats:", resolved.beats.map((b) => b.type).join(", "))

  const project = await composeProject("launch", {
    ...varsFromKit(kit), logoDataUrl, launch: { beats: resolved.beats },
  })
  const started = Date.now()
  try {
    await renderFilm(project.dir, file, { deadlineMs: LAUNCH_DEADLINE_MS, onProgress: progress("b", started) })
  } finally {
    await discardProject(project)
  }
  console.log(`part b: ${Math.round((Date.now() - started) / 1000)}s`)
}

/* ---------- main ---------- */

await fs.mkdir(WORK, { recursive: true })
console.log(`4K 60: scale=${renderScale()} fps=${filmFps()} shards=${renderShards()}`)

const partA = path.join(WORK, "a.mp4")
const partB = path.join(WORK, "b.mp4")
const partC = path.join(WORK, "c.mp4")
const started = Date.now()

if (!only || only === "a") await renderStage("a", partA)
if (!only || only === "b") await renderLaunch(partB)
if (!only || only === "c") await renderStage("c", partC)
if (only) {
  console.log("stopping after one part")
  process.exit(0)
}

/* every part comes out of the same encoder with the same profile, pixel
   format, rate and timescale, so the join is a stream copy and no frame is
   re-encoded at either seam */
const list = path.join(WORK, "parts.txt")
await fs.writeFile(list, [partA, partB, partC].map((f) => `file '${f}'`).join("\n") + "\n")
console.log("joining")
await run(FFMPEG, [
  "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list,
  "-c", "copy", "-movflags", "+faststart", "-f", "mp4", OUT_MP4,
])

const [a, b, c, out] = await Promise.all([frameCount(partA), frameCount(partB), frameCount(partC), frameCount(OUT_MP4)])
console.log(`\nwrote ${path.relative(ROOT, OUT_MP4)} in ${Math.round((Date.now() - started) / 1000)}s`)
console.log(`frames  a ${a} + b ${b} + c ${c} = ${a + b + c}, output ${out}`)
if (out !== a + b + c) console.error("FRAME COUNT MISMATCH at the joins")
console.log(await probe(OUT_MP4))

/* the poster: the cold open at three seconds, at full size */
await run(FFMPEG, ["-y", "-loglevel", "error", "-i", OUT_MP4, "-vf", "select='eq(n,180)'", "-vsync", "0", "-frames:v", "1", POSTER])
console.log(`wrote ${path.relative(ROOT, POSTER)}`)

/* a contact sheet of the finished film, so it can be looked at in one go */
const step = Math.max(1, Math.floor(out / 24))
await run(FFMPEG, [
  "-y", "-loglevel", "error", "-i", OUT_MP4,
  "-vf", `select='not(mod(n\\,${step}))',scale=426:240,tile=6x4`,
  "-frames:v", "1", "-q:v", "3", path.join(OUT_DIR, "contact-4k.jpg"),
])
console.log("wrote demo/out/contact-4k.jpg")
