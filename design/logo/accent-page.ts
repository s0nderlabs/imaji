// IMAJI accent explorer: the 3a brush mark with live-painted dots, a curated
// field of candidates (with Pantone references), a custom picker with nearest
// Pantone, and contrast on paper and on dark. Self-contained HTML.
import { OUT } from "./fal"

const b64 = async (p: string, mime: string) => `data:${mime};base64,${Buffer.from(await Bun.file(p).arrayBuffer()).toString("base64")}`
const letters = await b64(`${OUT}accent/letters.png`, "image/png")
const dots = await b64(`${OUT}accent/dots.png`, "image/png")

// Pantone references. sRGB values are the commonly published approximations;
// Pantone inks are not exactly reproducible on screen. Enough to judge by.
const PANTONE: [string, string][] = [
  ["Living Coral 16-1546", "#FF6F61"], ["Viva Magenta 18-1750", "#BB2649"], ["Peach Fuzz 13-1023", "#FFBE98"],
  ["Mocha Mousse 17-1230", "#A47864"], ["Ultra Violet 18-3838", "#5F4B8B"], ["Very Peri 17-3938", "#6667AB"],
  ["Classic Blue 19-4052", "#0F4C81"], ["Emerald 17-5641", "#009B77"], ["Turquoise 15-5519", "#45B5AA"],
  ["Honeysuckle 18-2120", "#D94F70"], ["Tangerine Tango 17-1463", "#DD4124"], ["Radiant Orchid 18-3224", "#AD5E99"],
  ["Marsala 18-1438", "#955251"], ["Greenery 15-0343", "#88B04B"], ["Illuminating 13-0647", "#F5DF4D"],
  ["Flame Scarlet 18-1662", "#CD212A"], ["Chili Pepper 19-1557", "#9B1B30"], ["Blue Iris 18-3943", "#5A5B9F"],
  ["Mimosa 14-0848", "#F0C05A"], ["Rust 18-1248", "#B7472A"], ["Aqua Sky 14-4811", "#7BC4C4"],
  ["Tigerlily 17-1456", "#E2583E"], ["True Red 19-1664", "#BF1932"], ["Fuchsia Rose 17-2031", "#C74375"],
  ["Cerulean 15-4020", "#9BB7D4"],
  ["485 C", "#DA291C"], ["Warm Red C", "#F9423A"], ["032 C", "#EF3340"], ["1795 C", "#D22630"], ["7417 C", "#E04E39"],
  ["7625 C", "#E1523D"], ["1655 C", "#FC4C02"], ["1585 C", "#FF6A39"], ["165 C", "#FF671F"], ["1595 C", "#D86018"],
  ["7579 C", "#DC6B2F"], ["152 C", "#E57200"], ["1235 C", "#FFB81C"], ["7408 C", "#F0B323"], ["116 C", "#FFCD00"],
  ["3005 C", "#0077C8"], ["300 C", "#005EB8"], ["2728 C", "#0047BB"], ["Reflex Blue C", "#001489"], ["2925 C", "#009CDE"],
  ["7466 C", "#00B0B9"], ["3262 C", "#00BFB3"], ["3272 C", "#00A499"], ["7472 C", "#5CB8B2"], ["3275 C", "#00B398"],
  ["340 C", "#00965E"], ["355 C", "#009639"], ["7737 C", "#6BA539"], ["2665 C", "#7D55C7"], ["2593 C", "#8031A7"],
  ["Rhodamine Red C", "#E10098"], ["213 C", "#E31C79"], ["219 C", "#DA1884"], ["7621 C", "#AB2328"], ["7427 C", "#971B2F"],
  ["7413 C", "#DC8633"], ["1375 C", "#FF9E1B"], ["2347 C", "#E10600"], ["3252 C", "#2AD2C9"], ["631 C", "#3EB1C8"],
  ["7461 C", "#007DBA"], ["7687 C", "#1D428A"], ["2955 C", "#003865"], ["7580 C", "#C4622D"], ["7599 C", "#B0381F"],
  ["7527 C", "#D6D2C4"], ["7530 C", "#A39382"], ["7517 C", "#9A3B26"], ["7522 C", "#B15A5A"], ["7616 C", "#8B4A4A"],
  ["5545 C", "#4E7F6F"], ["5535 C", "#1E3D33"], ["3298 C", "#006A52"], ["5473 C", "#115E67"], ["7715 C", "#006D68"],
  ["7476 C", "#0D4E5A"], ["7708 C", "#005F83"], ["7690 C", "#0076A8"], ["2140 C", "#4C7CD4"], ["2727 C", "#307FE2"],
  ["2685 C", "#4B1E8A"], ["7669 C", "#615E9B"], ["7657 C", "#8E3A80"], ["7434 C", "#B8467A"], ["7623 C", "#8A2A2B"],
]

// The curated field. Groups are the argument; each entry says what it is for.
const FIELD = [
  { g: "Warm inks, comforting", items: [
    ["Burnt orange", "#e8641a", "imaji today. Already in the kit JSON, the card, the film and the Mind's memory. Warm, sure, and a little expected."],
    ["Seal red", "#d63a2a", "The maker's stamp. Ink for the writing, vermilion for the chop: the dots get a reason to be coloured."],
    ["Coral red", "#E04E39", "Between the two above. Softer than seal red, less citrus than orange."],
    ["Living Coral", "#FF6F61", "Pantone 2019. The most comforting of the warm set, at the cost of contrast for the accent word on paper."],
    ["Tigerlily", "#E2583E", "A brighter, cleaner orange-red. Reads as playful."],
    ["Rust", "#B7472A", "Earthy, quiet, grown-up. Holds on paper, goes a little dull on dark."],
    ["Marsala", "#955251", "Wine and clay. The calmest warm option; the dots become a whisper."],
    ["Hermès orange", "#FF6A39", "Luxury-house orange. Loud at dot size, and it is somebody else's colour."],
  ]},
  { g: "Cool inks, unique", items: [
    ["Turquoise", "#00BFB3", "The one cool colour that sits well on warm paper. Fresh, unexpected, calm."],
    ["Seafoam", "#5CB8B2", "Turquoise with the volume down. Comforting, but the dots start to fade at favicon size."],
    ["Emerald", "#009B77", "Pantone 2013. Shipped, passing, green-check energy without being GitHub green."],
    ["Deep teal", "#115E67", "Ink-like, serious, beautiful on paper; on dark it needs the letters to carry it."],
    ["Classic Blue", "#0F4C81", "Pantone 2020. Dependable and quiet; on dark it nearly disappears."],
    ["Cobalt", "#0047BB", "Electric on paper, the beautifului register. Cool against warm paper is the tension."],
    ["Very Peri", "#6667AB", "Pantone 2022. Periwinkle: soft, dreamy, and the closest to the default AI violet, which is the risk."],
  ]},
  { g: "Off the path", items: [
    ["Honeysuckle", "#D94F70", "Pantone 2011. Warm pink-red, feminine and confident; not a developer default anywhere."],
    ["Viva Magenta", "#BB2649", "Pantone 2023. Crimson with depth. Cool in the fashion sense, comforting in the wine sense."],
    ["Plum", "#8E3A80", "Deep and unusual; reads as ink, not as a UI colour."],
    ["Gold", "#F0B323", "Warm and luminous on dark, weak for the accent word on paper."],
  ]},
]

const html = `<title>imaji accent field</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{--paper:#fbfaf7;--card:#ffffff;--ink:#1c1917;--ink-2:#57534e;--ink-3:#8d867e;--hair:rgba(28,25,23,.09);--dark:#171412;--accent:#e8641a}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}}
:root[data-theme="dark"]{--paper:#171412;--card:#1f1b18;--ink:#f3efe8;--ink-2:#b7aea3;--ink-3:#8d867e;--hair:rgba(243,239,232,.1)}
*{box-sizing:border-box;margin:0}
body{background:var(--paper);color:var(--ink);font:14px/1.55 Geist,Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:48px 24px 96px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:26px;font-weight:500;letter-spacing:-.01em}
p.lede{color:var(--ink-2);max-width:64ch;margin-top:8px;text-wrap:pretty}
.kicker{font:12px/1 "Geist Mono",ui-monospace,monospace;color:var(--accent);letter-spacing:.06em;margin-top:44px}
h2{font-size:18px;font-weight:500;margin-top:6px}
.mono{font-family:"Geist Mono",ui-monospace,monospace}
/* the mark: two layers, letters in ink, dots painted with the accent through a mask */
.mark{position:relative;aspect-ratio:900/540;width:100%}
.mark .l,.mark .d{position:absolute;inset:0;width:100%;height:100%}
.mark .l{background:url("${letters}") center/contain no-repeat}
.mark .d{background:var(--accent);-webkit-mask:url("${dots}") center/contain no-repeat;mask:url("${dots}") center/contain no-repeat}
.on-dark .mark .l{filter:invert(1)}
/* hero */
.hero{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
.stage{border-radius:12px;padding:28px 36px;box-shadow:inset 0 0 0 1px var(--hair)}
.stage.on-paper{background:#fbfaf7;color:#1c1917;--ink:#1c1917;--ink-3:#8d867e}
.stage.on-dark{background:#171412;color:#f3efe8;--ink:#f3efe8;--ink-3:#8d867e}
.stage .mark{max-width:360px;margin:0 auto}
.stage .ui{margin-top:26px;display:flex;flex-direction:column;gap:14px}
.stage h3{font-size:24px;font-weight:500;line-height:1.15;letter-spacing:-.01em;text-wrap:balance}
.stage h3 em{font-style:normal;color:var(--accent)}
.stage .row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;font-weight:500;border:0}
.stage.on-dark .btn{color:#171412}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:6px;font:12px/1 "Geist Mono",monospace;box-shadow:inset 0 0 0 1px currentColor;opacity:.75}
.fav{display:inline-flex;align-items:center;gap:8px}
.fav .mark{width:44px}
.fav span{font-size:12px;opacity:.6}
.meter{display:flex;gap:18px;margin-top:18px;font:12px/1.4 "Geist Mono",monospace;color:var(--ink-3)}
.meter b{color:var(--ink);font-weight:500}
.meter .ok{color:#1f7a4f}.meter .lo{color:#b7472a}
/* picker */
.pick{display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}
.pick label{font-size:13px;color:var(--ink-2)}
.pick input[type=color]{width:38px;height:30px;border:0;background:none;padding:0;cursor:pointer}
.pick input[type=text]{font:13px "Geist Mono",monospace;width:110px;height:30px;padding:0 10px;border:0;border-radius:6px;background:var(--card);color:var(--ink);box-shadow:inset 0 0 0 1px var(--hair)}
.pick .near{font-size:13px;color:var(--ink-2)}
.pick .near b{color:var(--ink);font-weight:500}
.pick button{font:13px Geist,sans-serif;height:30px;padding:0 12px;border:0;border-radius:6px;background:var(--card);color:var(--ink);box-shadow:inset 0 0 0 1px var(--hair);cursor:pointer}
.pick button:active{transform:scale(.97)}
/* field */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-top:14px}
.tile{--accent:#000;background:var(--card);border-radius:10px;box-shadow:inset 0 0 0 1px var(--hair);padding:12px;cursor:pointer;transition:transform .15s cubic-bezier(.23,1,.32,1),box-shadow .15s}
.tile:hover{transform:translateY(-1px)}
.tile.sel{box-shadow:inset 0 0 0 2px var(--accent),0 8px 24px rgba(0,0,0,.08)}
.tile .pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tile .pair>div{border-radius:6px;padding:14px 16px}
.tile .pair .on-paper{background:#fbfaf7}.tile .pair .on-dark{background:#171412}
.tile .nm{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px}
.tile .nm b{font-weight:500;font-size:14px}
.tile .nm span{font:11.5px "Geist Mono",monospace;color:var(--ink-3)}
.tile .pt{font-size:12px;color:var(--ink-3);margin-top:2px}
.tile p{font-size:12.5px;color:var(--ink-2);margin-top:8px;text-wrap:pretty}
.tile .cr{display:flex;gap:12px;margin-top:8px;font:11px "Geist Mono",monospace;color:var(--ink-3)}
.tile .cr i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--accent);vertical-align:-1px;margin-right:6px}
.note{margin-top:44px;padding:16px 18px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--hair);max-width:72ch;color:var(--ink-2);font-size:13px}
.note b{color:var(--ink);font-weight:500}
@media (max-width:820px){.hero{grid-template-columns:1fr}.stage{padding:22px}}
@media (prefers-reduced-motion:reduce){.tile{transition:none}}
</style>
<div class="wrap">
<h1>imaji accent field</h1>
<p class="lede">The 3a brush mark with its three dots painted live. Click any tile, or type a hex, and the two stages update: the mark, the accent word in a headline, the one filled button, the favicon. Numbers under each stage are contrast ratios; the accent word needs at least 3 : 1 to read at headline size, body-size text needs 4.5 : 1.</p>

<div class="hero" id="hero">
  <div class="stage on-paper">
    <div class="mark"><div class="l"></div><div class="d"></div></div>
    <div class="ui">
      <h3>One release in, a whole kit <em>out</em>.</h3>
      <div class="row"><button class="btn">Copy the job</button><span class="chip">v0.2.0</span><span class="fav"><span class="mark"><span class="l"></span><span class="d"></span></span><span>favicon</span></span></div>
    </div>
    <div class="meter"><span>on paper <b id="c-paper">0</b> : 1 <span id="s-paper"></span></span><span>accent word <span id="w-paper"></span></span></div>
  </div>
  <div class="stage on-dark">
    <div class="mark"><div class="l"></div><div class="d"></div></div>
    <div class="ui">
      <h3>One release in, a whole kit <em>out</em>.</h3>
      <div class="row"><button class="btn">Copy the job</button><span class="chip">v0.2.0</span><span class="fav"><span class="mark"><span class="l"></span><span class="d"></span></span><span>favicon</span></span></div>
    </div>
    <div class="meter"><span>on dark <b id="c-dark">0</b> : 1 <span id="s-dark"></span></span><span>accent word <span id="w-dark"></span></span></div>
  </div>
</div>

<div class="pick">
  <label for="col">Any colour</label>
  <input type="color" id="col" value="#e8641a">
  <input type="text" id="hex" value="#e8641a" spellcheck="false" aria-label="hex">
  <span class="near">nearest Pantone <b id="near"></b></span>
  <button id="copy">Copy my pick</button>
  <span class="near" id="copied" hidden>copied</span>
</div>

<div id="field"></div>

<div class="note"><b>On the Pantone references.</b> The sRGB values are the commonly published approximations of each swatch; a printed Pantone chip will not match a screen exactly. They are here to give each colour a name and a family, and so a custom pick can be reported as "nearest Pantone". The dots are painted through the mark's own brush texture, so what you see is what mastering will produce.</div>
</div>
<script>
const PANTONE = ${JSON.stringify(PANTONE)};
const FIELD = ${JSON.stringify(FIELD)};
const $ = s => document.querySelector(s);
const hexToRgb = h => { h = h.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join(''); const n = parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const lum = ([r,g,b]) => { const f = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055,2.4) }; return .2126*f(r)+.7152*f(g)+.0722*f(b) };
const contrast = (a,b) => { const l1=lum(hexToRgb(a)), l2=lum(hexToRgb(b)); const [hi,lo]=l1>l2?[l1,l2]:[l2,l1]; return (hi+.05)/(lo+.05) };
// nearest Pantone in a simple Lab distance
const toLab = hex => { let [r,g,b] = hexToRgb(hex).map(c=>{c/=255; return c>.04045?Math.pow((c+.055)/1.055,2.4):c/12.92}); let x=(r*.4124+g*.3576+b*.1805)/.95047, y=(r*.2126+g*.7152+b*.0722), z=(r*.0193+g*.1192+b*.9505)/1.08883; const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116; return [116*f(y)-16, 500*(f(x)-f(y)), 200*(f(y)-f(z))] };
const nearest = hex => { const L = toLab(hex); let best=null, bd=1e9; for (const [n,h] of PANTONE){ const M=toLab(h); const d=Math.hypot(L[0]-M[0],L[1]-M[1],L[2]-M[2]); if(d<bd){bd=d;best=[n,h,d]} } return best };
const PAPER='#fbfaf7', DARK='#171412';
const fmt = x => x.toFixed(1);
let current = { name: 'Burnt orange', hex: '#e8641a' };
function apply(name, hex){
  current = { name, hex };
  document.documentElement.style.setProperty('--accent', hex);
  $('#hero').style.setProperty('--accent', hex);
  $('#col').value = hex; $('#hex').value = hex;
  const cp = contrast(hex, PAPER), cd = contrast(hex, DARK);
  $('#c-paper').textContent = fmt(cp); $('#c-dark').textContent = fmt(cd);
  $('#s-paper').textContent = cp>=4.5?'body ok':cp>=3?'large only':'low'; $('#s-paper').className = cp>=3?'ok':'lo';
  $('#s-dark').textContent = cd>=4.5?'body ok':cd>=3?'large only':'low'; $('#s-dark').className = cd>=3?'ok':'lo';
  $('#w-paper').textContent = cp>=3?'reads':'does not read'; $('#w-paper').className = cp>=3?'ok':'lo';
  $('#w-dark').textContent = cd>=3?'reads':'does not read'; $('#w-dark').className = cd>=3?'ok':'lo';
  const n = nearest(hex); $('#near').textContent = n[2] < 2.5 ? n[0] : n[0] + ' (' + (n[2]<8?'close':'loosely') + ')';
  document.querySelectorAll('.tile').forEach(t => t.classList.toggle('sel', t.dataset.hex.toLowerCase() === hex.toLowerCase()));
  try { localStorage.setItem('imaji-accent', JSON.stringify(current)) } catch {}
}
// field
let html = '';
for (const g of FIELD) {
  html += '<p class="kicker">' + g.g + '</p><div class="grid">';
  for (const [name, hex, why] of g.items) {
    const n = nearest(hex); const cp = contrast(hex, PAPER), cd = contrast(hex, DARK);
    const pt = n[2] < 2.5 ? n[0] : 'near ' + n[0];
    html += '<div class="tile" data-hex="' + hex + '" data-name="' + name + '" style="--accent:' + hex + '" role="button" tabindex="0">'
      + '<div class="pair"><div class="on-paper"><div class="mark"><div class="l"></div><div class="d"></div></div></div><div class="on-dark"><div class="mark"><div class="l"></div><div class="d"></div></div></div></div>'
      + '<div class="nm"><b><span class="sw"></span>' + name + '</b><span>' + hex.toLowerCase() + '</span></div>'
      + '<div class="pt">Pantone ' + pt + '</div>'
      + '<p>' + why + '</p>'
      + '<div class="cr"><span><i style="background:' + (cp>=3?'#1f7a4f':'#b7472a') + '"></i>paper ' + fmt(cp) + ' : 1</span><span><i style="background:' + (cd>=3?'#1f7a4f':'#b7472a') + '"></i>dark ' + fmt(cd) + ' : 1</span></div>'
      + '</div>';
  }
  html += '</div>';
}
$('#field').innerHTML = html;
document.querySelectorAll('.tile').forEach(t => {
  const go = () => apply(t.dataset.name, t.dataset.hex);
  t.addEventListener('click', go);
  t.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); go() } });
});
$('#col').addEventListener('input', e => apply('custom', e.target.value));
$('#hex').addEventListener('change', e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v) || /^#[0-9a-f]{3}$/i.test(v)) apply('custom', v) });
$('#copy').addEventListener('click', async () => {
  const n = nearest(current.hex);
  const text = 'accent: ' + current.name + ' ' + current.hex.toLowerCase() + ' (nearest Pantone ' + n[0] + ')';
  try { await navigator.clipboard.writeText(text) } catch {}
  $('#copied').hidden = false; setTimeout(() => $('#copied').hidden = true, 1400);
});
let saved = null; try { saved = JSON.parse(localStorage.getItem('imaji-accent') || 'null') } catch {}
apply(saved?.name || 'Burnt orange', saved?.hex || '#e8641a');
</script>`
const dest = `${OUT}accent-field.html`
await Bun.write(dest, html)
console.log(dest, (Bun.file(dest).size / 1024).toFixed(0) + " KB")
