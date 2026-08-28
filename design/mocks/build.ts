// Builds the self-contained mock studio page: template + fonts + mark + card + real copy.
// Usage: bun design/mocks/build.ts   ->  design/mocks/out/imaji-mock.html
import { mkdirSync } from "node:fs"
const ROOT = new URL("../../", import.meta.url).pathname
const HERE = new URL("./", import.meta.url).pathname
const F = `${ROOT}design/fonts/`
const b64 = async (p: string, mime: string) => `data:${mime};base64,${Buffer.from(await Bun.file(p).arrayBuffer()).toString("base64")}`
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

let html = await Bun.file(`${HERE}template.html`).text()
// potrace path data breaks lines between numbers: join with spaces, never strip
const mark = (await Bun.file(`${HERE}assets/imaji-5b.svg`).text()).replace(/\s*\n\s*/g, " ")
const job = esc((await Bun.file(`${ROOT}job/JOB.md`).text()).split("\n").slice(0, 14).join("\n") + "\n…")
const wf = esc((await Bun.file(`${ROOT}templates/imaji.yml`).text()).split("\n").slice(0, 14).join("\n") + "\n…")

const rep: Record<string, string> = {
  "{{MARK}}": mark,
  "{{JOB}}": job,
  "{{WORKFLOW}}": wf,
  "{{CARD}}": await b64(`${HERE}assets/card-v020-tl.jpg`, "image/jpeg"),
  "{{GRAIN}}": await b64(`${HERE}assets/grain.png`, "image/png"),
  "{{FAVICON}}": await b64(`${HERE}assets/favicon-5b.png`, "image/png"),
  "{{PS300}}": await b64(`${F}polysans/PolySansTrial-Slim.otf`, "font/otf"),
  "{{PS400}}": await b64(`${F}polysans/PolySansTrial-Neutral.otf`, "font/otf"),
  "{{PS500}}": await b64(`${F}polysans/PolySansTrial-Median.otf`, "font/otf"),
  "{{PS700}}": await b64(`${F}polysans/PolySansTrial-Bulky.otf`, "font/otf"),
  "{{PSM400}}": await b64(`${F}polysans-mono/PolySansTrial-NeutralMono.otf`, "font/otf"),
  "{{PSM500}}": await b64(`${F}polysans-mono/PolySansTrial-MedianMono.otf`, "font/otf"),
  "{{DG}}": await b64(`${F}die-grotesk/test-die-grotesk-vf-roman.woff2`, "font/woff2"),
  "{{OS400}}": await b64(`${F}OpenSauceOne-Regular.ttf`, "font/ttf"),
  "{{OS500}}": await b64(`${F}OpenSauceOne-Medium.ttf`, "font/ttf"),
  "{{OS600}}": await b64(`${F}OpenSauceOne-SemiBold.ttf`, "font/ttf"),
  "{{PEACE}}": await b64(`${F}free/PeaceSans.otf`, "font/otf"),
  "{{TEMPTING}}": await b64(`${F}free/Tempting.otf`, "font/otf"),
  "{{ADV400}}": await b64(`${F}free/texgyreadventor-regular.otf`, "font/otf"),
  "{{ADV700}}": await b64(`${F}free/texgyreadventor-bold.otf`, "font/otf"),
  "{{PIXEL}}": await b64(`${F}geist-pixel/GeistPixel-Square.woff2`, "font/woff2"),
}
for (const [k, v] of Object.entries(rep)) html = html.split(k).join(v)
const left = html.match(/{{[A-Z0-9_]+}}/g)
if (left) throw new Error("unreplaced: " + left.join(", "))
mkdirSync(`${HERE}out`, { recursive: true })
const dest = `${HERE}out/imaji-mock.html`
await Bun.write(dest, html)
console.log(dest, (Bun.file(dest).size / 1024).toFixed(0) + " KB")
