/* Screenshot a live page so a launch beat can show the product itself.

   A capture beat carries a URL the Mind chose. This module opens it in the
   same headless Chrome the renderer uses, takes two pictures, and hands them
   back as data URLs: the first fold (1920x1080), which is what a launch beat
   actually shows, and the whole page, capped at twice the fold so one very
   long marketing site cannot produce a 20000px image.

   Nothing here throws. A capture that fails for any reason (a private
   address, a slow page, a dead host, a Chrome that will not start) returns
   null and the beat degrades to text in compose.ts. A launch video is not
   worth failing over one screenshot. */
import puppeteer, { type Browser } from "puppeteer-core"
import { resolvesToPublicAddress } from "./compose"
import { chromeArgs, chromePath } from "./render"

export type Capture = { fold: string; full: string }

export const CAPTURE_WIDTH = 1920
export const CAPTURE_FOLD_HEIGHT = 1080
/* two folds tall. Anything taller only ever gets drawn smaller, and small is
   the thing that made a capture unreadable in the first place. */
export const CAPTURE_MAX_HEIGHT = 2160
export const CAPTURE_SETTLE_MS = 1500
export const CAPTURE_BUDGET_MS = 20_000
const CAPTURE_QUALITY = 85

function dataUrl(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`
}

async function captureOne(browser: Browser, url: string): Promise<Capture> {
  const target = new URL(url)
  if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("unsupported protocol")
  if (!(await resolvesToPublicAddress(target.hostname))) throw new Error("not a public address")

  const page = await browser.newPage()
  try {
    /* the hostname was checked once above, but a page can redirect, and a
       page can load pictures and frames from anywhere. Every request the
       capture makes is checked the same way, so a public host that answers
       with a hop to a loopback or link-local address gets nothing. */
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      void (async () => {
        try {
          const hop = new URL(req.url())
          if (hop.protocol === "data:" || hop.protocol === "blob:" || hop.protocol === "about:") {
            await req.continue()
            return
          }
          if (hop.protocol !== "https:") {
            await req.abort("blockedbyclient")
            return
          }
          if (!(await resolvesToPublicAddress(hop.hostname))) {
            await req.abort("blockedbyclient")
            return
          }
          await req.continue()
        } catch {
          await req.abort("failed").catch(() => undefined)
        }
      })()
    })
    await page.setViewport({ width: CAPTURE_WIDTH, height: CAPTURE_FOLD_HEIGHT, deviceScaleFactor: 1 })
    await page.goto(target.toString(), { waitUntil: "load", timeout: CAPTURE_BUDGET_MS })
    await new Promise((r) => setTimeout(r, CAPTURE_SETTLE_MS))

    const fold = (await page.screenshot({ type: "jpeg", quality: CAPTURE_QUALITY })) as Uint8Array

    /* the tall shot is taken by growing the viewport rather than with
       fullPage, so the result is exactly CAPTURE_WIDTH wide and never taller
       than the cap, whatever the page does below the fold */
    const height = await page.evaluate(() => {
      const d = document.documentElement
      const b = document.body
      return Math.max(d.scrollHeight, d.offsetHeight, b ? b.scrollHeight : 0, b ? b.offsetHeight : 0)
    })
    const tall = Math.min(Math.max(Math.round(height) || CAPTURE_FOLD_HEIGHT, CAPTURE_FOLD_HEIGHT), CAPTURE_MAX_HEIGHT)
    await page.setViewport({ width: CAPTURE_WIDTH, height: tall, deviceScaleFactor: 1 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 400))
    const full = (await page.screenshot({ type: "jpeg", quality: CAPTURE_QUALITY })) as Uint8Array

    return { fold: dataUrl(fold), full: dataUrl(full) }
  } finally {
    await page.close().catch(() => undefined)
  }
}

/* One browser for the whole storyboard, one page per URL, each on its own
   budget. Serial on purpose: two Chromes rendering 1920x2160 at once on this
   Mac is how a render turns into a swap storm. */
export async function captureUrls(urls: string[]): Promise<Map<string, Capture | null>> {
  const out = new Map<string, Capture | null>()
  const wanted = Array.from(new Set(urls))
  if (wanted.length === 0) return out

  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: chromeArgs() })
  } catch {
    for (const url of wanted) out.set(url, null)
    return out
  }

  try {
    for (const url of wanted) {
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        const budget = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`capture exceeded ${CAPTURE_BUDGET_MS / 1000}s`)), CAPTURE_BUDGET_MS)
        })
        out.set(url, await Promise.race([captureOne(browser, url), budget]))
      } catch {
        out.set(url, null)
      } finally {
        if (timer) clearTimeout(timer)
      }
    }
  } finally {
    await browser.close().catch(() => undefined)
  }
  return out
}
