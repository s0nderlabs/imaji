/* Public URLs for a kit. IMAJI_BASE_URL wins because the server usually sits
   behind a tunnel and the request origin is then the tunnel's internal host;
   the request origin is the fallback so a bare local run still works.

   Every URL here is addressed by the read id, never by the token: these
   strings end up in a Mind's reply, a job summary and sometimes a public
   commit comment, and the token is a write credential. */
import { readIdFor } from "./readid"
import { sanitiseTag } from "./store"

export function baseUrl(request: Request): string {
  const configured = (process.env.IMAJI_BASE_URL || "").trim()
  if (configured) return configured.replace(/\/+$/, "")
  try {
    return new URL(request.url).origin
  } catch {
    return "http://localhost:3000"
  }
}

export function kitUrls(base: string, token: string, tag: string) {
  const t = readIdFor(token)
  const g = encodeURIComponent(sanitiseTag(tag))
  return {
    indexUrl: `${base}/k/${t}`,
    kitUrl: `${base}/k/${t}/${g}`,
    card: `${base}/api/kits/${t}/${g}/card.png`,
    film: `${base}/api/kits/${t}/${g}/film.mp4`,
    json: `${base}/api/kits/${t}/${g}/kit.json`,
    meta: `${base}/api/kits/${t}/${g}/meta.json`,
  }
}
