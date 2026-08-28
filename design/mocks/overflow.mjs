import puppeteer from "puppeteer-core"
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.goto("file:///Users/alkautsar/Documents/s0nderlabs/imaji/design/mocks/out/imaji-mock.html#%7B%22film%22%3A%22done%22%7D", { waitUntil: "load" })
await new Promise(r => setTimeout(r, 1500))
const res = await page.evaluate(() => {
  const w = innerWidth, sw = document.documentElement.scrollWidth
  const bad = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.position !== 'fixed' && r.right > w + 1 && r.width > 40 }).map(e => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ').slice(0,2).join('.') : '') + ' right=' + Math.round(e.getBoundingClientRect().right) + ' w=' + Math.round(e.getBoundingClientRect().width))
  return { innerWidth: w, scrollWidth: sw, bad: bad.slice(0, 14) }
})
console.log(JSON.stringify(res, null, 1))
await page.screenshot({ path: "/tmp/imaji-phone-pp.png", fullPage: true })
await page.evaluate(() => document.querySelector('[data-open="job"]').click()); await new Promise(r => setTimeout(r, 700)); await page.screenshot({ path: "/tmp/imaji-phone-sheet.png", fullPage: false })
await browser.close()
