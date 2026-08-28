// IMAJI round-1 judging sheet. Self-contained HTML (data URIs) so the same file
// opens locally and publishes as an artifact. Usage: bun sheet.ts [round]
import { readdirSync, mkdirSync, existsSync } from "node:fs"
import { OUT } from "./fal"

const ROUND = process.argv[2] ?? "round1"
const DIR = `${OUT}${ROUND}/`
const TRIM = `${DIR}trim/`
mkdirSync(TRIM, { recursive: true })

const ROUNDS: Record<string, { prefix: string; title: string; lede: string; flat?: boolean; lanes: Record<string, { n: string; title: string; note: string }> }> = {
  round1: {
    prefix: "r1", title: "imaji logo, round one",
    lede: "Twelve candidates, four hands, two models each, plus two lanes where the model painted the three dots. Every image is monochrome ink on paper by design; colour comes in mastering. Reply with ids (1a, 5b) and one line of what to keep and what to lose, and round two conditions on those.",
    lanes: {
      signature: { n: "1", title: "Fountain-pen signature", note: "five separate letters, one sitting, hairline, wide spacing. The forr winner's cousin." },
      oneline: { n: "2", title: "One line, three lifts", note: "the pen never leaves the paper through the word; it lifts only to place the three dots." },
      brush: { n: "3", title: "One brush pass", note: "fine brush or marker, faster and heavier, the j tail as one sweep." },
      pencil: { n: "4", title: "Pencil whisper", note: "graphite, sketchy, a faint ruled baseline; the dots are the firmest marks." },
      signaturedots: { n: "5", title: "Signature, dots in orange", note: "lane 1 with the three tittles painted by the model in e8641a, to see the idea live." },
      onelinedots: { n: "6", title: "One line, dots in orange", note: "lane 2 with the three tittles in e8641a." },
    },
  },
  round2: {
    prefix: "r2", title: "imaji logo, round two",
    lede: "3a refined. Every candidate was drawn from the actual round-one image through an edit model, so the letterforms are 3a's and only the execution moves. Accent locked to Tigerlily, Pantone 17-1456, e2583e; two lanes let the model paint the dots in it, the rest stay ink for mastering. Reply with an id, or say 3a stays as it is.",
    flat: true,
    lanes: {
      original: { n: "0", title: "3a, round one, as picked", note: "the reference every candidate below was drawn from." },
      elevate: { n: "1", title: "3a, elevated", note: "same letterforms, even spacing, steady baseline, identical dots, clean edges. The master candidate." },
      elevate_tigerlily: { n: "2", title: "3a elevated, dots in Tigerlily", note: "lane 1 with the three dots as brush dabs in e2583e, painted by the model." },
      compact_j: { n: "3", title: "Compact j", note: "the j tail shortened so the mark sits wide and low, header-shaped." },
      more_ink: { n: "4", title: "More ink", note: "the same brush with denser black, for favicon survival." },
      nb_tigerlily: { n: "5", title: "3a as is, dots in Tigerlily", note: "no redraw beyond the dots, the second model's take." },
      "3a": { n: "6", title: "3a traced", note: "the original, vectorised to a real SVG, no redraw at all." },
    },
  },
}
const R = ROUNDS[ROUND]
if (!R) throw new Error(`unknown round ${ROUND}`)
const LANES = R.lanes
const LETTER: Record<string, string> = { gpt2: "a", gpt2e: "a", vec: "b", nbpro: "b", vectorize: "c" }
const MODEL: Record<string, string> = { gpt2: "GPT Image 2, drawn hand", vec: "Recraft V4.1, real SVG", gpt2e: "GPT Image 2 edit, from 3a", nbpro: "Nano Banana Pro edit, from 3a", vectorize: "Recraft vectorize, real SVG" }

function sh(cmd: string[]) {
  const p = Bun.spawnSync(cmd)
  if (p.exitCode !== 0) throw new Error(`${cmd[0]} failed: ${p.stderr.toString().slice(0, 300)}`)
}
async function dataUri(path: string, mime: string) {
  const b = await Bun.file(path).arrayBuffer()
  return `data:${mime};base64,${Buffer.from(b).toString("base64")}`
}
// Big tile: jpg at 1200 wide. Ladder: mark trimmed to its ink, png.
async function tile(file: string) {
  const stem = file.replace(/\.[a-z0-9]+$/i, "")
  const src = DIR + file
  const big = `${TRIM}${stem}.big.jpg`
  const trim = `${TRIM}${stem}.trim.png`
  if (!existsSync(big)) sh(["magick", src, "-background", "#fbfaf7", "-flatten", "-resize", "1200x", "-quality", "82", big])
  if (!existsSync(trim)) {
    // Bounding box of the ink: grey, blur, threshold, then trim reports the box.
    const bb = Bun.spawnSync(["magick", src, "-background", "#fbfaf7", "-flatten", "-colorspace", "gray", "-blur", "0x1.5", "-threshold", "82%", "-format", "%@", "info:"]).stdout.toString().trim()
    const m = bb.match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/)
    if (!m) throw new Error(`no ink box for ${file}: ${bb}`)
    const [w, h, x, y] = m.slice(1).map(Number)
    const pad = Math.round(h * 0.25)
    // Paper colour sampled from the corner, then knocked out so the mark sits on any ground.
    const corner = Bun.spawnSync(["magick", src, "-background", "#fbfaf7", "-flatten", "-format", "%[pixel:p{12,12}]", "info:"]).stdout.toString().trim()
    sh(["magick", src, "-background", "#fbfaf7", "-flatten", "-fuzz", "13%", "-transparent", corner, "-crop", `${w + pad * 2}x${h + pad * 2}+${Math.max(0, x - pad)}+${Math.max(0, y - pad)}`, "+repage", "-resize", "900x", trim])
  }
  return { big: await dataUri(big, "image/jpeg"), trim: await dataUri(trim, "image/png") }
}

const files = readdirSync(DIR).filter(f => /\.(png|svg)$/i.test(f) && f.startsWith(`${R.prefix}_`))
const parse = (f: string) => { const stem = f.replace(/\.[a-z0-9]+$/i, "").slice(R.prefix.length + 1); const i = stem.lastIndexOf("_"); return { lane: stem.slice(0, i), model: stem.slice(i + 1) } }
let cards = ""
let ladder = ""
for (const [lane, { n, title, note }] of Object.entries(LANES)) {
  const laneFiles = files.filter(f => parse(f).lane === lane).sort()
  if (!laneFiles.length) continue
  let figs = ""
  for (const f of laneFiles) {
    const { model } = parse(f)
    const id = `${n}${LETTER[model] ?? "x"}`
    const t = await tile(f)
    figs += R.flat
      ? `<figure><div class="tile"><img src="${t.big}" alt="${title}, ${MODEL[model]}"><span class="id">${id}</span></div><figcaption><b>${title}</b><span>${MODEL[model] ?? model}</span></figcaption><p class="fnote">${note}</p></figure>`
      : `<figure><div class="tile"><img src="${t.big}" alt="${title}, ${MODEL[model]}"><span class="id">${id}</span></div><figcaption><b>${MODEL[model] ?? model}</b><span>${f}</span></figcaption></figure>`
    ladder += `<div class="row"><span class="rid">${id}</span><span class="hdr"><img src="${t.trim}" alt=""><span class="nav"><i>Your kits</i><i>GitHub</i></span></span><span class="fav"><img src="${t.trim}" alt=""></span><span class="dark"><img src="${t.trim}" alt=""></span></div>`
  }
  if (R.flat) cards += figs
  else cards += `<section><p class="kicker">0${n}</p><h2>${title}</h2><p class="note">${note}</p><div class="grid">${figs}</div></section>`
}
if (R.flat) cards = `<section><p class="kicker">Candidates</p><h2>3a and five redraws of it</h2><div class="grid" style="margin-top:14px">${cards}</div></section>`

const html = `<title>${R.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{--paper:#fbfaf7;--card:#ffffff;--ink:#1c1917;--ink-2:#57534e;--ink-3:#8d867e;--hair:rgba(28,25,23,.09);--accent:#e8641a;--dark:#171412}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}}
:root[data-theme="dark"]{--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}
*{box-sizing:border-box;margin:0}
body{background:var(--paper);color:var(--ink);font:14px/1.55 Geist,Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:56px 24px 96px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:26px;font-weight:500;letter-spacing:-.01em;text-wrap:balance}
p.lede{color:var(--ink-2);max-width:62ch;margin-top:8px;text-wrap:pretty}
.kicker{font:12px/1 "Geist Mono",ui-monospace,monospace;color:var(--accent);letter-spacing:.06em;margin-top:52px}
h2{font-size:18px;font-weight:500;margin-top:6px}
p.note{color:var(--ink-3);font-size:13px;margin:2px 0 14px;max-width:70ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:16px}
figure{background:var(--card);border-radius:10px;box-shadow:inset 0 0 0 1px var(--hair),0 1px 2px rgba(0,0,0,.04)}
.tile{position:relative;padding:12px}
.tile img{width:100%;aspect-ratio:16/9;object-fit:contain;display:block;border-radius:6px;background:#fbfaf7}
.id,.rid{font:12px/1 "Geist Mono",ui-monospace,monospace;color:var(--ink-2)}
.id{position:absolute;top:20px;left:20px;background:#fbfaf7;padding:5px 7px;border-radius:5px;box-shadow:inset 0 0 0 1px rgba(28,25,23,.12);color:#1c1917}
figcaption{display:flex;justify-content:space-between;gap:12px;padding:8px 14px 12px;font-size:12.5px}
figcaption span{color:var(--ink-3);font-family:"Geist Mono",ui-monospace,monospace;font-size:11px}
.fnote{padding:0 14px 12px;font-size:12.5px;color:var(--ink-2);margin-top:-4px}
.ladder{display:grid;gap:10px;margin-top:14px}
.row{display:grid;grid-template-columns:32px 1fr 88px 200px;gap:12px;align-items:center}
.hdr{display:flex;align-items:center;justify-content:space-between;height:52px;padding:0 16px;background:#fbfaf7;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(28,25,23,.09)}
.hdr img{height:26px;width:auto;display:block}
.nav{display:flex;gap:16px}.nav i{font:12.5px/1 Geist,sans-serif;font-style:normal;color:#57534e}
.fav{display:flex;align-items:center;justify-content:center;height:52px;background:#fbfaf7;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(28,25,23,.09)}
.fav img{height:14px;width:auto}
.dark{display:flex;align-items:center;height:52px;padding:0 16px;background:#171412;border-radius:8px}
.dark img{height:26px;width:auto;filter:invert(1) hue-rotate(180deg)}
.legend{display:flex;gap:18px;color:var(--ink-3);font-size:12px;margin-top:10px}
.how{margin-top:56px;padding:18px 20px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--hair);max-width:70ch;color:var(--ink-2)}
.how b{color:var(--ink)}
</style>
<div class="wrap">
<h1>${R.title}</h1>
<p class="lede">${R.lede}</p>
${cards}
<p class="kicker">In place</p>
<h2>Header, favicon, dark</h2>
<p class="note">Each mark trimmed to its ink and dropped into the header the front end will have, at favicon height, and on the dark ground (inverted for the strip; the real dark version is drawn, not filtered).</p>
<div class="ladder">${ladder}</div>
<div class="how"><b>How this was made.</b> forr's fal.ai kit, reused as is. ${ROUND === "round1" ? "GPT Image 2 (high) for the drawn hand, Recraft V4.1 text-to-vector for a real SVG of the same brief. Twelve jobs, projected $1.80 against a $2 cap" : "The round-one 3a image uploaded once, then GPT Image 2 edit and Nano Banana Pro edit redraw it under five briefs, plus Recraft vectorize for a real SVG. Six jobs, projected $0.96 against a $1 cap"}, spelling the word out in every prompt so the models do not drift to "imagi".</div>
</div>`
const dest = `${OUT}sheet-${ROUND}.html`
await Bun.write(dest, html)
console.log(dest, (Bun.file(dest).size / 1024 / 1024).toFixed(2) + " MB")
