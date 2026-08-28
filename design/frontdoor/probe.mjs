// True-mobile probe: bun design/frontdoor/probe.mjs <file.html>
// Prints innerWidth / scrollWidth and any element wider than the viewport, writes a full-page phone screenshot.
import puppeteer from "puppeteer-core"
import { resolve, basename } from "node:path"
const file = process.argv[2]
if (!file) { console.error("usage: bun design/frontdoor/probe.mjs <file.html>"); process.exit(1) }
const url = "file://" + resolve(file)
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.goto(url, { waitUntil: "load" })
await new Promise(r => setTimeout(r, 1500))
const res = await page.evaluate(() => {
  const w = innerWidth, sw = document.documentElement.scrollWidth
  const bad = [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.position !== "fixed" && r.right > w + 1 && r.width > 40 }).map(e => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").slice(0, 2).join(".") : "") + " right=" + Math.round(e.getBoundingClientRect().right) + " w=" + Math.round(e.getBoundingClientRect().width))
  return { innerWidth: w, scrollWidth: sw, overflowing: bad.slice(0, 12) }
})
const out = `/tmp/fd-${basename(file, ".html")}-phone.png`
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(JSON.stringify(res, null, 1))
console.log("phone screenshot:", out, res.scrollWidth > res.innerWidth ? "OVERFLOW" : "ok")
