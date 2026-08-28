/* GET /api/kits/[readId]/[tag]/[file], SPEC section 4.
   Serves the files a kit page needs: the card, the three video cuts, and the
   two JSON documents. Kits are private: an unknown read id
   is a 404 (not a 401, which would confirm the tag exists) and nothing here is
   cacheable. The path carries the READ id, never the token: the token is the
   write credential and these URLs end up in pages and in <video> sources. The
   mp4 answers byte-range requests, which Safari requires before it will play a
   <video> at all. */
import { promises as fs } from "node:fs"
import { tokenForReadId } from "@/lib/readid"
import { fileExists, fileFor } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TYPES: Record<string, string> = {
  "card.png": "image/png",
  "film.mp4": "video/mp4",
  "film-vertical.mp4": "video/mp4",
  "launch.mp4": "video/mp4",
  "kit.json": "application/json; charset=utf-8",
  "meta.json": "application/json; charset=utf-8",
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
}

function notFound() {
  return Response.json({ ok: false, error: "not found" }, { status: 404, headers: PRIVATE_HEADERS })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ readId: string; tag: string; file: string }> },
) {
  const { readId, tag, file } = await params

  /* a plain object literal, so "constructor" and "__proto__" would otherwise
     come back truthy off the prototype and get past the guard below */
  if (!Object.hasOwn(TYPES, file)) return notFound()
  const contentType = TYPES[file]
  const token = await tokenForReadId(readId)
  if (!token) return notFound()

  const target = fileFor(token, tag, file)
  if (!(await fileExists(target))) return notFound()

  const stat = await fs.stat(target)
  const range = request.headers.get("range")

  if (range && contentType === "video/mp4") {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
    if (match) {
      const size = stat.size
      const hasStart = match[1] !== ""
      const start = hasStart ? Number(match[1]) : Math.max(0, size - Number(match[2] || 0))
      const end = hasStart ? (match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1)) : size - 1
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
        const handle = await fs.open(target, "r")
        try {
          const length = end - start + 1
          const buffer = Buffer.alloc(length)
          await handle.read(buffer, 0, length, start)
          return new Response(new Uint8Array(buffer), {
            status: 206,
            headers: {
              ...PRIVATE_HEADERS,
              "Content-Type": contentType,
              "Content-Length": String(length),
              "Content-Range": `bytes ${start}-${end}/${size}`,
              "Accept-Ranges": "bytes",
            },
          })
        } finally {
          await handle.close()
        }
      }
      return new Response(null, {
        status: 416,
        headers: { ...PRIVATE_HEADERS, "Content-Range": `bytes */${stat.size}` },
      })
    }
  }

  const body = await fs.readFile(target)
  return new Response(new Uint8Array(body), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  })
}
