// IMAJI master sheet: the finalists as finished vector marks. Self-contained HTML.
import { OUT } from "./fal"

const IDS: Record<string, { title: string; note: string }> = {
  "0a": { title: "0a, the 3a hand as picked", note: "your pick from round one, traced as is. The entry stroke on the first i and the speed in the j tail are the most alive of the four." },
  "1a": { title: "1a, 3a elevated", note: "the GPT redraw: dots evened, spacing steadier, stroke a touch lighter and more polite." },
  "5b": { title: "5b, 3a with the model's dabs", note: "the Nano Banana pass: letterforms are 3a's, the dots came out as brush dabs rather than dots, and the mark sits a little more compact." },
  "2a": { title: "2a, elevated, Tigerlily by the model", note: "the retry that landed after your shortlist: 1a's twin with slightly larger dots. Here for completeness." },
}

const b64 = async (p: string, mime: string) => `data:${mime};base64,${Buffer.from(await Bun.file(p).arrayBuffer()).toString("base64")}`
function sh(cmd: string[]) { const p = Bun.spawnSync(cmd); if (p.exitCode !== 0) throw new Error(`${cmd[0]} failed: ${p.stderr.toString().slice(0, 300)}`) }

let cards = ""
for (const [id, { title, note }] of Object.entries(IDS)) {
  const D = `${OUT}master/${id}/`
  // page-size renders as jpg, the mark itself as the transparent png (header, ladder)
  sh(["magick", `${D}imaji-${id}-light.png`, "-resize", "1000x", "-quality", "85", `${D}light.jpg`])
  sh(["magick", `${D}imaji-${id}-dark.png`, "-resize", "1000x", "-quality", "85", `${D}dark.jpg`])
  sh(["magick", `${D}imaji-${id}-transparent.png`, "-resize", "800x", `${D}mark.png`])
  const light = await b64(`${D}light.jpg`, "image/jpeg")
  const dark = await b64(`${D}dark.jpg`, "image/jpeg")
  const mark = await b64(`${D}mark.png`, "image/png")
  const svg = await Bun.file(`${D}imaji-${id}.svg`).text()
  const favDots = await b64(`${D}favicon-dots-${id}.png`, "image/png")
  const favI = await b64(`${D}favicon-i-${id}.png`, "image/png")
  const favWord = await b64(`${D}favicon-word-${id}.png`, "image/png")
  const kb = (Bun.file(`${D}imaji-${id}.svg`).size / 1024).toFixed(0)
  cards += `<section class="m">
  <p class="kicker">${id}</p><h2>${title}</h2><p class="note">${note}</p>
  <div class="pair"><figure class="on-paper"><img src="${light}" alt="${id} on paper"></figure><figure class="on-dark"><img src="${dark}" alt="${id} on dark"></figure></div>
  <div class="ladder">
    <div class="hdr"><img src="${mark}" alt=""><span class="nav"><i>Your kits</i><i>GitHub</i></span></div>
    <div class="hdr dk"><img src="${mark}" alt=""><span class="nav"><i>Your kits</i><i>GitHub</i></span></div>
  </div>
  <div class="favs">
    <div class="fav"><span class="lab">favicon: the i</span><img src="${favI}" width="16" height="16" alt=""><img src="${favI}" width="32" height="32" alt=""><img src="${favI}" width="64" height="64" alt=""></div>
    <div class="fav"><span class="lab">favicon: three dots</span><img src="${favDots}" width="16" height="16" alt=""><img src="${favDots}" width="32" height="32" alt=""><img src="${favDots}" width="64" height="64" alt=""></div>
    <div class="fav"><span class="lab">favicon: the word</span><img src="${favWord}" width="16" height="16" alt=""><img src="${favWord}" width="32" height="32" alt=""><img src="${favWord}" width="64" height="64" alt=""></div>
    <div class="fav live"><span class="lab">the SVG itself, inline, ink = currentColor</span><span class="svgwrap">${svg}</span><span class="svgwrap dk">${svg}</span></div>
  </div>
  <p class="files">imaji-${id}.svg (${kb} KB, two paths: ink in currentColor, dots #e2583e) · imaji-${id}-ink.svg · -light.png · -dark.png · -transparent.png · favicon-i / -dots / -word</p>
</section>`
}

const html = `<title>imaji mark masters</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{--paper:#fbfaf7;--card:#ffffff;--ink:#1c1917;--ink-2:#57534e;--ink-3:#8d867e;--hair:rgba(28,25,23,.09);--accent:#e2583e}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}}
:root[data-theme="dark"]{--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}
*{box-sizing:border-box;margin:0}
body{background:var(--paper);color:var(--ink);font:14px/1.55 Geist,Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:48px 24px 96px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:26px;font-weight:500;letter-spacing:-.01em}
p.lede{color:var(--ink-2);max-width:64ch;margin-top:8px;text-wrap:pretty}
.kicker{font:12px/1 "Geist Mono",ui-monospace,monospace;color:var(--accent);letter-spacing:.06em;margin-top:52px}
h2{font-size:18px;font-weight:500;margin-top:6px}
p.note{color:var(--ink-2);font-size:13.5px;margin:2px 0 14px;max-width:70ch;text-wrap:pretty}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{border-radius:10px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--hair)}
figure img{width:100%;display:block}
.ladder{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.hdr{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 18px;background:#fbfaf7;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(28,25,23,.09);color:#1c1917}
.hdr img{height:28px;width:auto;display:block}
.hdr.dk{background:#171412;color:#f3efe8;box-shadow:none}
.hdr.dk img{filter:invert(1) hue-rotate(180deg) saturate(1.6)}
.nav{display:flex;gap:16px}.nav i{font:12.5px/1 Geist,sans-serif;font-style:normal;opacity:.7}
.favs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px}
.fav{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:8px;background:#fbfaf7;box-shadow:inset 0 0 0 1px rgba(28,25,23,.09);color:#1c1917;flex-wrap:wrap}
.fav .lab{width:100%;font:11px/1 "Geist Mono",monospace;color:#8d867e;margin-bottom:2px}
.fav img{image-rendering:auto}
.fav.live{grid-column:span 1}
.svgwrap{display:inline-block;width:110px;color:#1c1917}.svgwrap svg{width:100%;height:auto;display:block}
.svgwrap.dk{background:#171412;color:#f3efe8;padding:8px;border-radius:6px}
p.files{font:11.5px/1.5 "Geist Mono",monospace;color:var(--ink-3);margin-top:12px}
.how{margin-top:56px;padding:18px 20px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--hair);max-width:72ch;color:var(--ink-2);font-size:13px}
.how b{color:var(--ink);font-weight:500}
@media (max-width:820px){.pair,.ladder{grid-template-columns:1fr}.favs{grid-template-columns:1fr 1fr}}
</style>
<div class="wrap">
<h1>imaji mark masters</h1>
<p class="lede">Your three finalists (and the late retry) as finished marks: traced to vector from the ink, dots in exact Tigerlily #e2583e, ink in currentColor so the same file is the light and the dark version. Each is shown on paper, on dark, in the header at 28 px, and as three favicon ideas at 16, 32 and 64. Pick one id and it goes into the product.</p>
${cards}
<div class="how"><b>How they were made.</b> The mark in each generated image is only about 260 px wide, so a raster master was never on the table. Each was cut from its paper, split into letters and dots at the row where the letters begin, upsampled 4x, traced with potrace, and recomposed as one SVG with two paths. Nothing was redrawn by hand; the only edits are the exact accent and the trace.</div>
</div>`
const dest = `${OUT}sheet-master.html`
await Bun.write(dest, html)
console.log(dest, (Bun.file(dest).size / 1024 / 1024).toFixed(2) + " MB")
