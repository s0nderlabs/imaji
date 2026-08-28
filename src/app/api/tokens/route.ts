/* POST /api/tokens, SPEC section 4.
   No auth, no accounts, no form: the front door presses a button and gets the
   one string that authorises writing kits. It is shown once, and it is a WRITE
   credential only. The reply also carries the derived read id, which is what
   the kit pages are addressed by.

   Because there is no auth, the endpoint carries its own two brakes: a small
   in-memory per-IP limit, and a hard cap on the size of the registry. */
import { createToken, TokenLimitError } from "@/lib/tokens"
import { rememberToken } from "@/lib/readid"
import { baseUrl } from "@/lib/urls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WINDOW_MS = 60 * 60 * 1000
const PER_IP_PER_WINDOW = 10

/* Deliberately in memory: it resets on restart, it is not shared between
   instances, and it is not a security boundary. It exists so a loop against
   the tunnel costs the disk nothing. */
const hits = new Map<string, number[]>()

function clientIp(request: Request): string | null {
  /* the tunnel sets cf-connecting-ip and it cannot be spoofed through it;
     x-forwarded-for is client-controlled, so it is only a last resort */
  const cf = request.headers.get("cf-connecting-ip")
  if (cf && cf.trim()) return cf.trim()
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0].trim()
    if (first) return first
  }
  return null
}

/* Fails open: with no address to attribute a request to there is nothing to
   count, and refusing every anonymous request would break a local run. */
function allowed(ip: string | null): boolean {
  if (!ip) return true
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= PER_IP_PER_WINDOW) {
    hits.set(ip, recent)
    return false
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 10_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
    }
  }
  return true
}

export async function POST(request: Request) {
  if (!allowed(clientIp(request))) {
    return Response.json(
      { ok: false, error: "too many tokens from this address, try again later" },
      { status: 429, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  try {
    const token = await createToken()
    const readId = rememberToken(token)
    const base = baseUrl(request)
    return Response.json(
      { ok: true, token, readId, indexUrl: `${base}/k/${readId}` },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    if (error instanceof TokenLimitError) {
      return Response.json(
        { ok: false, error: "this server is not minting new tokens right now" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      )
    }
    const message = error instanceof Error ? error.message : "could not mint a token"
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
