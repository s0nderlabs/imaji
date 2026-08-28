// Screenshots every layout in out/ at 1440 and 390 and writes out/index.html, a picking sheet.
// Usage (repo root): bun design/frontdoor/gallery.mjs
import puppeteer from "puppeteer-core"
import { readdirSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve, basename } from "node:path"

const HERE = resolve("design/frontdoor")
const OUT = resolve(HERE, "out")
const SHOTS = resolve(OUT, "shots")
mkdirSync(SHOTS, { recursive: true })
const files = readdirSync(OUT).filter(f => /^\d\d-.*\.html$/.test(f)).sort()
if (!files.length) { console.error("no layouts in", OUT); process.exit(1) }

const INDEX_ONLY = process.argv.includes("--index-only")
const rows = []
const browser = INDEX_ONLY ? null : await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true })
for (const f of files) {
  if (INDEX_ONLY) {
    const stem0 = basename(f, ".html")
    const html0 = readFileSync(resolve(OUT, f), "utf8")
    rows.push({ f, stem: stem0, title: (html0.match(/<title>([^<]*)<\/title>/) || [, stem0])[1], overflow: false })
    continue
  }
  const stem = basename(f, ".html")
  const url = "file://" + resolve(OUT, f)
  const html = readFileSync(resolve(OUT, f), "utf8")
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, stem])[1]
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: "load" }); await new Promise(r => setTimeout(r, 1800))
  await page.screenshot({ path: resolve(SHOTS, `${stem}-desktop.png`), fullPage: false })
  await page.screenshot({ path: resolve(SHOTS, `${stem}-desktop-full.png`), fullPage: true })
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(url, { waitUntil: "load" }); await new Promise(r => setTimeout(r, 1500))
  const probe = await page.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth }))
  await page.screenshot({ path: resolve(SHOTS, `${stem}-phone.png`), fullPage: false })
  await page.close()
  rows.push({ f, stem, title, overflow: probe.sw > probe.w })
  console.log(stem, title, probe.sw > probe.w ? "PHONE OVERFLOW" : "ok")
}
if (browser) await browser.close()

const cards = rows.map((r, i) => `<a class="c" href="#v=${i + 1}" data-i="${i + 1}"><img src="./shots/${r.stem}-desktop.png" alt="${r.title}"><div class="t"><b>${r.stem.slice(0, 2)}</b> ${r.title.replace(/^imaji, /, "")}${r.overflow ? ' <i>phone overflow</i>' : ''}</div><img class="p" src="./shots/${r.stem}-phone.png" alt=""></a>`).join("\n")
const tabs = rows.map((r, i) => `<button class="n" data-i="${i + 1}" title="${r.title.replace(/^imaji, /, "")}">${i + 1}</button>`).join("")
const list = JSON.stringify(rows.map(r => ({ f: r.f, title: r.title.replace(/^imaji, /, "") })))
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>imaji front door, ten layouts</title>
<style>
:root{--bg:#171412;--ink:#f3efe8;--mute:#a8a097;--card:#221d1a;--acc:#e2583e}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 "Helvetica Neue",Helvetica,sans-serif}
.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:12px 24px;background:rgba(23,20,18,.92);backdrop-filter:blur(10px) saturate(1.3);box-shadow:inset 0 -1px 0 rgba(255,255,255,.07)}
.bar h1{font-weight:500;font-size:15px;margin:0 14px 0 0;white-space:nowrap}
.seg{display:flex;background:var(--card);border-radius:9px;padding:3px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.seg button{appearance:none;border:0;background:transparent;color:var(--mute);font:inherit;font-size:13px;padding:5px 12px;border-radius:7px;cursor:pointer;transition:background .15s cubic-bezier(.23,1,.32,1),color .15s}
.seg button.on{background:#3a312c;color:var(--ink)}
.nums{display:flex;gap:4px;margin-left:6px}
.n{appearance:none;border:0;background:var(--card);color:var(--mute);font:inherit;font-size:13px;width:32px;height:30px;border-radius:7px;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);font-variant-numeric:tabular-nums}
.n.on{background:var(--acc);color:#1a1614;box-shadow:none}
.name{color:var(--mute);margin-left:8px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fonts{display:flex;gap:8px;align-items:center;margin-left:10px;padding-left:12px;box-shadow:inset 1px 0 0 rgba(255,255,255,.08)}
.fonts label{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--mute)}
.fonts select,.fonts input{font:12px "Helvetica Neue",Helvetica,sans-serif;color:var(--ink);background:var(--card);border:0;border-radius:7px;padding:4px 6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);max-width:140px}
.fonts input[type=range]{padding:0;height:22px;width:110px;background:transparent;box-shadow:none}
.fonts b{font-weight:400;font-size:10px;color:var(--mute);font-variant-numeric:tabular-nums}
.fonts button{appearance:none;border:0;background:transparent;color:var(--mute);font:inherit;font-size:12px;padding:5px 8px;border-radius:7px;cursor:pointer;align-self:flex-end}
.fonts button:hover{color:var(--ink)}
@media (max-width:1100px){.fonts{display:none}}
.hint{color:var(--mute);font-size:12px;white-space:nowrap}
.grid{padding:24px}
.grid p{color:var(--mute);margin:0 0 20px;max-width:70ch}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:22px}
.c{display:grid;grid-template-columns:1fr 92px;gap:10px;align-items:start;background:var(--card);border-radius:12px;padding:10px;color:inherit;text-decoration:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);transition:transform .15s cubic-bezier(.23,1,.32,1)}
.c:hover{transform:translateY(-2px)}
.c img{width:100%;border-radius:6px;display:block;background:#000}
.c .p{grid-column:2;grid-row:1/span 2;border-radius:8px}
.t{grid-column:1;font-size:13px;color:#e8e2d9;padding:4px 2px 0}.t b{font-family:ui-monospace,monospace;color:var(--acc);margin-right:6px}.t i{color:#ff8c6b;font-style:normal;margin-left:8px}
.view{display:none;padding:18px 24px 40px}
.stage{margin:0 auto;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.5),0 24px 60px rgba(0,0,0,.45);transition:width .25s cubic-bezier(.23,1,.32,1)}
.stage iframe{display:block;border:0;width:100%;height:calc(100vh - 100px);background:#fff}
.stage.desktop{width:min(100%,1440px)}
.stage.phone{width:390px}
.stage.phone iframe{height:844px}
body.viewing .grid{display:none}body.viewing .view{display:block}
</style></head><body>
<div class="bar">
  <h1>imaji front door</h1>
  <div class="seg" id="mode"><button data-m="grid" class="on">All ten</button><button data-m="view">One at a time</button></div>
  <div class="nums" id="nums">${tabs}</div>
  <div class="seg" id="size"><button data-s="desktop" class="on">Desktop</button><button data-s="phone">Phone</button></div>
  <div class="fonts" id="fonts">
    <label>Display <select data-k="display"></select></label>
    <label>Text <select data-k="text"></select></label>
    <label>Mono <select data-k="mono"></select></label>
    <label>Weight <select data-k="weight"></select></label>
    <label>Tracking <input type="range" data-k="track" min="-0.05" max="0.03" step="0.002" value="0"><b id="trk"></b></label>
    <button id="fontsReset" title="back to each layout's own fonts">Reset</button>
  </div>
  <span class="name" id="name"></span>
  <span class="hint">keys: 1 to 0, arrows, D / P, G</span>
</div>
<div class="grid"><p>Click a card to open it in the viewer. Left is the first fold at 1440, right is the phone at 390. Reply with a number, or two numbers and what to take from each.</p><div class="g">${cards}</div></div>
<div class="view"><div class="stage desktop" id="stage"><iframe id="frame" title="layout"></iframe></div></div>
<script>
const L=${list};let cur=0,size="desktop",mode="grid"
const FAM={display:["PolySans","PolySans Mono","Die Grotesk","Die Grotesk C","Open Sauce One","Helvetica Neue","Adventor","Peace Sans","Tempting","Geist Pixel","PP Mori","Recoleta"],text:["Open Sauce One","PolySans","Die Grotesk","Die Grotesk C","Helvetica Neue","Adventor","PP Mori"],mono:["PolySans Mono","Geist Pixel","Geist Pixel Grid","SF Mono"],weight:[300,400,500,600,700,800]}
let fonts={display:"",text:"",mono:"",weight:"",track:""}
try{const f=JSON.parse(localStorage.getItem("imaji-pick-fonts")||"null");if(f)fonts=Object.assign(fonts,f)}catch(e){}
function fillFonts(){document.querySelectorAll("#fonts select").forEach(sel=>{const k=sel.dataset.k;sel.innerHTML="";const o=document.createElement("option");o.value="";o.textContent="layout default";sel.appendChild(o);FAM[k].forEach(v=>{const op=document.createElement("option");op.value=String(v);op.textContent=String(v);sel.appendChild(op)});sel.value=fonts[k]===""?"":String(fonts[k])});const r=document.querySelector('#fonts input[data-k=track]');r.value=fonts.track===""?"0":String(fonts.track);document.getElementById("trk").textContent=fonts.track===""?"":fonts.track+"em"}
function pushFonts(){const f=document.getElementById("frame");if(f&&f.contentWindow)try{f.contentWindow.postMessage({type:"imaji-fonts",state:fonts,hide:true},"*")}catch(e){}
  try{localStorage.setItem("imaji-pick-fonts",JSON.stringify(fonts))}catch(e){}}
document.getElementById("fonts").addEventListener("change",e=>{const k=e.target.dataset.k;if(!k)return;fonts[k]=e.target.value===""?"":(k==="weight"?Number(e.target.value):e.target.value);pushFonts()})
document.querySelector('#fonts input[data-k=track]').addEventListener("input",e=>{fonts.track=Number(e.target.value);document.getElementById("trk").textContent=e.target.value+"em";pushFonts()})
document.getElementById("fontsReset").addEventListener("click",()=>{fonts={display:"",text:"",mono:"",weight:"",track:""};fillFonts();const f=document.getElementById("frame");if(f&&f.contentWindow)f.contentWindow.postMessage({type:"imaji-fonts",reset:true,hide:true},"*");try{localStorage.setItem("imaji-pick-fonts",JSON.stringify(fonts))}catch(e){}})
window.addEventListener("message",e=>{if(e.data&&e.data.type==="imaji-fonts-ready")pushFonts()})
fillFonts()
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)]
function render(){document.body.classList.toggle("viewing",mode==="view")
  $$("#mode button").forEach(b=>b.classList.toggle("on",b.dataset.m===mode))
  $$("#size button").forEach(b=>b.classList.toggle("on",b.dataset.s===size))
  $$(".n").forEach(b=>b.classList.toggle("on",mode==="view"&&Number(b.dataset.i)===cur+1))
  $("#stage").className="stage "+size
  $("#name").textContent=mode==="view"?String(cur+1).padStart(2,"0")+"  "+L[cur].title:""
  if(mode==="view"){const src="./"+L[cur].f;if($("#frame").getAttribute("src")!==src)$("#frame").setAttribute("src",src)}
  try{localStorage.setItem("imaji-pick",JSON.stringify({cur,size,mode}))}catch(e){}
  history.replaceState(null,"",mode==="view"?"#v="+(cur+1)+"&"+size:"#")}
function show(i){cur=Math.max(0,Math.min(L.length-1,i));mode="view";render()}
$("#mode").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;mode=b.dataset.m;render()})
$("#size").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;size=b.dataset.s;render()})
$("#nums").addEventListener("click",e=>{const b=e.target.closest("button");if(b)show(Number(b.dataset.i)-1)})
$$(".c").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();show(Number(a.dataset.i)-1)}))
document.addEventListener("keydown",e=>{if(e.target.tagName==="IFRAME")return
  if(e.key>="1"&&e.key<="9")show(Number(e.key)-1);else if(e.key==="0")show(9)
  else if(e.key==="ArrowRight"||e.key==="j")show(cur+1);else if(e.key==="ArrowLeft"||e.key==="k")show(cur-1)
  else if(e.key==="d"||e.key==="D"){size="desktop";render()}else if(e.key==="p"||e.key==="P"){size="phone";render()}
  else if(e.key==="g"||e.key==="G"){mode="grid";render()}})
const m=location.hash.match(/#v=(\\d+)(?:&(desktop|phone))?/)
if(m){cur=Number(m[1])-1;if(m[2])size=m[2];mode="view"}
else{try{const s=JSON.parse(localStorage.getItem("imaji-pick")||"null");if(s){cur=s.cur||0;size=s.size||"desktop";mode=s.mode||"grid"}}catch(e){}}
render()
</script>
</body></html>`
writeFileSync(resolve(OUT, "index.html"), index)
console.log("wrote", resolve(OUT, "index.html"))
