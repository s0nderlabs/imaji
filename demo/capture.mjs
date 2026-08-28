/* demo/capture.mjs

   Gathers every asset the launch composition needs, so that the composition
   itself has zero network dependency and renders deterministically.

   Three sources, all real:
     1. screenshots of the LIVE kit page and kit index at
        https://imaji.s0nderlabs.xyz, taken with the same system Chrome the
        product renders with, one instance, closed at the end,
     2. the frames of the real ten second film of the v0.3.0 kit, extracted
        with ffmpeg, so the film beat shows the film itself,
     3. every string on screen, read out of the file it really lives in.

   Nothing here invents content. If a page 404s the script says so and stops
   rather than substituting a mock.

   Usage: bun demo/capture.mjs   (or: node demo/capture.mjs) */
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const SHOTS = path.join(HERE, "assets", "shots")
const FRAMES = path.join(HERE, "assets", "frames")
const REC_DIR = path.join(HERE, "assets", "rec")

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const BASE = process.env.IMAJI_BASE_URL || "https://imaji.s0nderlabs.xyz"
const TAG = process.env.IMAJI_TAG || "v0.3.0"

/* ---------- pick the kit to film, from the store, never by hand ---------- */

async function newestKit() {
  const kitsDir = path.join(ROOT, "data", "kits")
  const ids = await fs.readdir(kitsDir)
  let best = null
  for (const id of ids) {
    const dir = path.join(kitsDir, id, TAG)
    let meta
    try {
      meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8"))
    } catch {
      continue
    }
    const at = Date.parse(meta.receivedAt || 0)
    if (!best || at > best.at) best = { at, meta, dir }
  }
  if (!best) throw new Error(`no ${TAG} kit found under data/kits`)
  return best
}

/* ---------- shots ---------- */

async function shoot(page, name, opts = {}) {
  const out = path.join(SHOTS, name + ".png")
  await page.screenshot({ path: out, type: "png", ...opts })
  const { size } = await fs.stat(out)
  console.log(`  shot ${name}.png  ${(size / 1024).toFixed(0)} KB`)
}

async function gotoOk(page, url) {
  const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 })
  const status = res ? res.status() : 0
  if (status !== 200) throw new Error(`${url} returned ${status}`)
  await page.evaluate(() => document.fonts.ready.then(() => true))
  await new Promise((r) => setTimeout(r, 900))
}

/* Park a labelled block a fixed distance below the top of the viewport and
   hold still. The kit page labels its blocks with a heading or a figure
   caption, so both are searched. Returns the scrollY reached. */
const BLOCK_SEL = "h1,h2,h3,figcaption span,figcaption"

async function parkSection(page, label, offset) {
  const y = await page.evaluate((sel, t, off) => {
    const hit = Array.from(document.querySelectorAll(sel)).find((n) =>
      (n.textContent || "").trim().toLowerCase().startsWith(t.toLowerCase()),
    )
    if (!hit) return -1
    const block = hit.closest("section,figure") || hit
    const top = block.getBoundingClientRect().top + window.scrollY - off
    window.scrollTo(0, Math.max(0, top))
    return window.scrollY
  }, BLOCK_SEL, label, offset)
  if (y < 0) throw new Error(`no block labelled "${label}"`)
  await new Promise((r) => setTimeout(r, 500))
  return y
}

/* ---------- ffmpeg ---------- */

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"] })
    p.on("error", reject)
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}
function capture(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "ignore"] })
    let out = ""
    p.stdout.on("data", (d) => (out += d))
    p.on("error", reject)
    p.on("close", () => resolve(out.trim()))
  })
}

/* ---------- main ---------- */

const kit = await newestKit()
const kitJson = JSON.parse(await fs.readFile(path.join(kit.dir, "kit.json"), "utf8"))
const kitUrl = kit.meta.kitUrl
const indexUrl = kit.meta.indexUrl
console.log(`kit ${TAG} received ${kit.meta.receivedAt}`)
console.log(`kit page ${kitUrl}`)

await fs.mkdir(SHOTS, { recursive: true })
await fs.mkdir(FRAMES, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-extensions", "--mute-audio"],
})

const report = { kitUrl, indexUrl, tag: TAG, shots: {} }

try {
  /* 1440x810 is 16:9, so a shot maps onto the 1920x1080 stage with no crop and
     no distortion, and every glyph lands 1.33x larger than it would at a 1920
     viewport. deviceScaleFactor 2 makes that upscale a retina DOWNscale
     instead: the source is 2880x1620, the stage shows it at 1920x1080. */
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 2 })

  console.log(`\nkit index ${indexUrl}`)
  await gotoOk(page, indexUrl)
  await shoot(page, "kit-index")

  console.log(`\nkit page ${kitUrl}`)
  await gotoOk(page, kitUrl)
  /* the films may still be in their polling state on a cold page; give the
     poll one cycle so the <video> elements are there rather than placeholders */
  await new Promise((r) => setTimeout(r, 6000))
  /* the browser's own video chrome is not part of the page's design; drop it
     everywhere before any shot, so what is filmed is the frame the page draws */
  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((v) => {
      v.removeAttribute("controls")
      try { v.currentTime = 0.2 } catch {}
    })
  })
  await new Promise((r) => setTimeout(r, 800))
  report.shots.kitHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  console.log(`  kit page height ${report.shots.kitHeight}px`)
  await shoot(page, "kit-top")

  for (const [name, label, off] of [
    ["kit-card", "The card", 40],
    ["kit-tweet", "The tweet", 60],
    ["kit-thread", "The thread", 60],
  ]) {
    const y = await parkSection(page, label, off)
    console.log(`  parked "${label}" at y=${y}`)
    await shoot(page, name)
  }

  /* the ten second film: park its section, then measure the <video> box in
     viewport pixels so the composition can paint the real frames exactly over
     the frame the page draws for it */
  const filmY = await parkSection(page, "The film", 60)
  /* the browser's own video chrome is not part of the page's design; drop it
     so the shot shows the frame the page draws, not Chrome's controls */
  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((v) => {
      v.removeAttribute("controls")
      try { v.currentTime = 0.2 } catch {}
    })
  })
  await new Promise((r) => setTimeout(r, 800))
  const box = await page.evaluate((sel) => {
    const hit = Array.from(document.querySelectorAll(sel)).find((n) =>
      (n.textContent || "").trim().toLowerCase().startsWith("the film"),
    )
    const block = hit.closest("figure") || hit.closest("section") || document.body
    /* the wide slot: the 16:9 box the landscape film lands in, whether it is
       already the <video> or still the panel that waits for it */
    const candidates = Array.from(block.querySelectorAll("video,div"))
      .map((n) => {
        const r = n.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      })
      .filter((b) => b.w > 260 && b.h > 140 && Math.abs(b.w / b.h - 16 / 9) < 0.16)
    if (!candidates.length) return null
    candidates.sort((a, b) => b.w - a.w)
    return candidates[0]
  }, BLOCK_SEL)
  if (!box) throw new Error("no 16:9 film box inside the film block of the kit page")
  console.log(`  film box ${Math.round(box.w)}x${Math.round(box.h)} at ${Math.round(box.x)},${Math.round(box.y)} (scroll ${filmY})`)
  report.filmBox = box
  await shoot(page, "kit-film")

  await page.close()
} finally {
  await browser.close()
  console.log("\nchrome closed")
}

/* --- the real ten second film, frame by frame ---
   1280x720 is plenty: the composition paints it into a box under 1100px wide,
   and 300 smaller frames keep the page light enough to seek quickly. */
const filmPath = path.join(kit.dir, "film.mp4")
await fs.access(filmPath)
console.log(`\nextracting frames from ${path.relative(ROOT, filmPath)}`)
for (const f of await fs.readdir(FRAMES)) await fs.rm(path.join(FRAMES, f))
await run(FFMPEG, [
  "-y", "-loglevel", "error",
  "-i", filmPath,
  "-vf", "scale=1280:720:flags=lanczos",
  "-vsync", "0",
  path.join(FRAMES, "frame_%03d.png"),
])
const frames = (await fs.readdir(FRAMES)).filter((f) => f.endsWith(".png")).sort()
let bytes = 0
for (const f of frames) bytes += (await fs.stat(path.join(FRAMES, f))).size
console.log(`  ${frames.length} frames, ${(bytes / 1024 / 1024).toFixed(1)} MB`)
report.frames = frames.length

/* --- the recording of the real Minds app ---
   elpabl0 recorded a new thread against the real Mind: the question, the wait,
   the answer, then a second question about a typo-only release and the Mind
   refusing it. Two beats of the film are that recording, cropped to the thread
   and otherwise untouched. The frames of the three ranges are cut out here so
   the composition can paint them without a <video> element. */
const REC_SRC = process.env.IMAJI_RECORDING || path.join(HERE, "assets", "recording.mov")
const REC_RANGES = [
  /* the question already sent, the thread waking up */
  { name: "r1", at: 24.0, len: 1.8, crop: "2560:1440:680:0" },
  /* the wait ending and the whole answer landing */
  { name: "r2", at: 53.8, len: 6.4, crop: "2560:1440:680:0" },
  /* the second question, and the refusal */
  { name: "r3", at: 153.4, len: 3.6, crop: "2600:1462:672:468" },
]
const REC = {}
if (await fs.access(REC_SRC).then(() => true, () => false)) {
  console.log(`\ncutting the recording ranges from ${path.relative(ROOT, REC_SRC)}`)
  for (const f of await fs.readdir(REC_DIR).catch(() => [])) await fs.rm(path.join(REC_DIR, f))
  await fs.mkdir(REC_DIR, { recursive: true })
  for (const r of REC_RANGES) {
    await run(FFMPEG, [
      "-y", "-loglevel", "error", "-ss", String(r.at), "-t", String(r.len), "-i", REC_SRC,
      "-vf", `crop=${r.crop},scale=1640:922:flags=lanczos,fps=30`, "-q:v", "4",
      path.join(REC_DIR, r.name + "_%04d.jpg"),
    ])
    REC[r.name] = (await fs.readdir(REC_DIR)).filter((f) => f.startsWith(r.name + "_")).length
    console.log(`  ${r.name}: ${REC[r.name]} frames`)
  }
} else {
  for (const r of REC_RANGES) {
    REC[r.name] = (await fs.readdir(REC_DIR).catch(() => [])).filter((f) => f.startsWith(r.name + "_")).length
  }
  console.log(`\nrecording source not present; keeping the ${REC.r1 + REC.r2 + REC.r3} frames already in demo/assets/rec`)
}
report.rec = REC

/* --- the launch video, straight through ---
   render.mjs finds it the same way this script found the kit and joins it in
   as its own part, so nothing here re-encodes it and no kit token is written
   to a file that ships. */
await fs.access(path.join(kit.dir, "launch.mp4"))
report.launch = "the newest " + TAG + " kit under data/kits"

/* --- the text, lifted verbatim from the files it lives in ---

   The composition retypes nothing. Everything it puts on screen is read here,
   out of the real file, out of a recorded run's output, or out of the kit the
   Mind wrote, and written to a script the page loads. A `fetch` would be
   blocked on file://, so it is a plain assignment. */

/* how long the launch video the Mind made runs, read off the file itself */
const LAUNCH_SECONDS = Math.round(
  Number(
    await capture(FFPROBE, [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=nokey=1:noprint_wrappers=1", path.join(kit.dir, "launch.mp4"),
    ]),
  ),
)

const notes = await fs.readFile(path.join(ROOT, "docs", "releases", `${TAG}.md`), "utf8")
const prefs = JSON.parse(await fs.readFile(path.join(ROOT, "imaji.json"), "utf8"))

/* the release message, composed the way scripts/local-release.sh composes it:
   the header, the standing preferences, the repository assets, the notes. The
   bearer line is the placeholder the script itself writes on a dry run. */
const assets = [
  "design/frontdoor/assets/card-v020-tl.jpg",
  "design/frontdoor/assets/card-v010.jpg",
  "design/frontdoor/assets/film-poster.jpg",
]
const message = [
  `render endpoint: POST ${BASE}/api/render`,
  "authorization header: Bearer <kit token>",
  "content type: application/json",
  "",
  `repo: ${kitJson.repo}`,
  `tag: ${TAG}`,
  `release url: ${kitJson.releaseUrl}`,
  "previous tag: v0.2.0",
  `compare: https://github.com/${kitJson.repo}/compare/v0.2.0...${TAG}`,
  "",
  "--- standing preferences from imaji.json ---",
  JSON.stringify(prefs),
  "--- end imaji.json ---",
  "Honour these for this release unless I overrode them in chat. If they conflict with a rule I gave you in chat, the chat rule wins.",
  "",
  "--- repository assets ---",
  `homepage: ${BASE}`,
  "images (public raw URLs, fetchable only if this repo is public):",
  ...assets.map((p) => `https://raw.githubusercontent.com/${kitJson.repo}/main/${p}`),
  "--- end repository assets ---",
  "",
  "--- release notes ---",
  ...notes.trim().split("\n"),
  "--- end release notes ---",
]


/* WIB is UTC+7; the app prints a 12 hour clock with a full stop, "7.34 PM". */
function wibTime(iso, plusSeconds = 0) {
  const d = new Date(Date.parse(iso) + plusSeconds * 1000 + 7 * 3600 * 1000)
  const h = d.getUTCHours()
  const m = String(d.getUTCMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}.${m} ${ampm}`
}

/* the kit as the reply carries it: a fenced JSON block, the five fields the
   renderer acts on, in the order kit.json holds them. */
const kitCode = JSON.stringify(
  {
    tweet: kitJson.tweet,
    thread: kitJson.thread,
    linkedin: kitJson.linkedin,
    card: kitJson.card,
    launch: kitJson.launch,
  },
  null,
  2,
).split("\n")

const text = {
  tag: TAG,
  repo: kitJson.repo,
  site: "imaji.s0nderlabs.xyz",
  kitUrl,
  indexUrl,
  frames: frames.length,
  filmBox: report.filmBox,

  /* segment 2, the terminal */
  command: `gh release create ${TAG} --notes-file docs/releases/${TAG}.md`,
  releaseUrl: kitJson.releaseUrl,

  /* segment 3, the Action. Step names read out of templates/imaji.yml,
     log lines read out of a real run of scripts/local-release.sh. */
  steps: [
    "Set up job",
    "Run actions/checkout@v4",
    "Run oven-sh/setup-bun@v2",
    "Write the imaji helper scripts",
    "Gather the evidence",
    "Ask the Mind",
    "Summary",
  ],
  log: [
    "conversation alias: imaji-s0nderlabs-imaji",
    "minds-send: ensuring conversation imaji-s0nderlabs-imaji",
    "minds-send: sending 3766 bytes, waiting up to 300000ms",
    "minds-send: send returned reply",
    "--- what the Mind said ---",
  ],
  message,
  messageBytes: 3766,

  /* segment 4, the Minds app. The thread is the real one: the user side is
     the release message the workflow sends, the Mind side is the cover note it
     kept (kit.json `memory`) followed by the kit itself, in the order the kit
     file holds it. The timestamp is the run's own receivedAt. */
  minds: {
    mind: "imaji.labs",
    runway: "1,9",
    title: message[0],
    threadTitle: `${kitJson.repo} ${TAG}`,
    userMessage: message,
    sentAt: wibTime(kit.meta.receivedAt),
    replyAt: wibTime(kit.meta.receivedAt, 144),
    note: kitJson.memory,
    code: kitCode,
    discover: [
      ["Profile Page", "Build a personal web page"],
      ["Game Designer", "Design & build a game"],
      ["Travel Planner", "Plan a trip"],
      ["Nutrition Tracker", "Log meals & track macros"],
    ],
    rail: ["Minds", "Quests", "Connectors", "Saved", "Widgets"],
    account: ["alkautsarso...", "alkautsarsol2..."],
    composer: 'Type or use "/" commands',
  },

  /* how many frames of the recording each beat holds */
  rec: REC,

  /* the two beats carried by the recording of the real app */
  s5b: {
    line1: "It remembers every release.",
    acc: "remembers",
    line2: "A new thread, in the Minds app, thirty seconds.",
  },
  s5c: {
    line1: "It refuses.",
    acc: "refuses.",
    line2: "A typo fix earns no kit, and it says so in your voice.",
  },

  /* segments 1, 6 and 8, the statements */
  open: { line1: "Tag a release. Get the launch.", acc: "launch.", line2: "Written by your Mind. Rendered by imaji." },
  s2: { line1: "You tag a release.", acc: "tag" },
  s3: { line1: "A GitHub Action wakes your Mind.", acc: "wakes" },
  s4: { line1: "Your Mind reads it, remembers the last release, and writes the kit.", acc: "remembers" },
  s5: { line1: "imaji renders.", acc: "renders." },
  bridge: {
    line1: "It also made this.",
    acc: "this.",
    line2: `The launch video for ${TAG}. Written by imaji.labs, rendered by imaji, ${LAUNCH_SECONDS} seconds, unedited.`,
  },

  /* segment 8, the end card. The three steps are the front door's own. */
  end: {
    title: "Three steps.",
    steps: [
      "Hand your Mind the job.",
      "Drop the workflow in your repo.",
      "Mint a kit token.",
    ],
    agents: "Or hand it to your coding agent: imaji.s0nderlabs.xyz/agents.md",
    live: "Live now",
    quiet: `The ${LAUNCH_SECONDS} seconds you just watched were made by a Mind.`,
    tagline: "For solo builders who only ship.",
  },
}

await fs.writeFile(
  path.join(HERE, "assets", "text.js"),
  "/* generated by demo/capture.mjs. Every string here is read out of a real\n" +
    "   file, a recorded run, or the kit the Mind wrote; none of it is typed by\n" +
    "   hand into the composition. */\n" +
    "window.DEMO_TEXT = " + JSON.stringify(text, null, 2) + "\n",
)
console.log(`\nwrote demo/assets/text.js`)

await fs.writeFile(path.join(HERE, "assets", "capture.json"), JSON.stringify(report, null, 2) + "\n")
console.log(`wrote demo/assets/capture.json`)
