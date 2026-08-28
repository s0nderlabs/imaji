// Minimal fal.ai queue client for the rebrand A/B. No SDK: plain fetch so we
// control every header (x-app-fal-disable-fallback must be on every request:
// fal reroutes to "equivalent" endpoints after retries by default, which would
// silently poison an A/B).
import { mkdirSync, appendFileSync } from "node:fs"
import { dirname } from "node:path"

export const OUT = new URL("./out/", import.meta.url).pathname

let _key: string | null = null
export function getKey(): string {
  if (_key) return _key
  if (process.env.FAL_KEY) return (_key = process.env.FAL_KEY)
  const p = Bun.spawnSync(["security", "find-generic-password", "-a", "fal", "-s", "fal.api-key", "-w"])
  const k = p.stdout.toString().trim()
  if (!k) throw new Error("fal key not found: keychain item fal.api-key missing and FAL_KEY unset")
  return (_key = k)
}

const authHeaders = () => ({
  Authorization: `Key ${getKey()}`,
  "Content-Type": "application/json",
  "x-app-fal-disable-fallback": "true",
})

export async function pricing(endpointId: string): Promise<any | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await fetch(`https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(endpointId)}`, {
      headers: { Authorization: `Key ${getKey()}` },
    })
    if (r.status === 429) { await Bun.sleep(6000 + attempt * 3000); continue }
    if (!r.ok) return null
    const j = await r.json()
    return j?.prices?.length ? j : null
  }
  throw new Error(`pricing(${endpointId}): still 429 after retries - do not treat as missing`)
}

export async function openapi(endpointId: string): Promise<any | null> {
  const r = await fetch(`https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${encodeURIComponent(endpointId)}`)
  if (!r.ok) return null
  try { return await r.json() } catch { return null }
}

// Input schema properties for an endpoint, resolved from its OpenAPI doc.
export function inputProps(doc: any): Record<string, any> | null {
  if (!doc?.paths) return null
  for (const p of Object.values<any>(doc.paths)) {
    const ref = p?.post?.requestBody?.content?.["application/json"]?.schema?.$ref
    if (ref) {
      const name = ref.split("/").pop()
      const schema = doc.components?.schemas?.[name]
      if (schema?.properties) return schema.properties
    }
  }
  const inp = Object.entries<any>(doc.components?.schemas ?? {}).find(([n]) => /Input$/i.test(n))
  return inp?.[1]?.properties ?? null
}

export interface Submitted { request_id: string; status_url: string; response_url: string }

export async function submit(endpointId: string, input: any): Promise<Submitted> {
  const r = await fetch(`https://queue.fal.run/${endpointId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`submit ${endpointId} -> HTTP ${r.status}: ${JSON.stringify(body).slice(0, 400)}`)
  return body as Submitted
}

export async function awaitResult(sub: Submitted, timeoutMs = 20 * 60_000): Promise<any> {
  const start = Date.now()
  let wait = 2000
  for (;;) {
    if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${sub.request_id}`)
    const s = await fetch(sub.status_url, { headers: { Authorization: `Key ${getKey()}` } })
    const st = await s.json().catch(() => ({}))
    if (st.status === "COMPLETED") break
    if (s.status >= 400 && s.status !== 429) throw new Error(`status ${sub.request_id} -> HTTP ${s.status}: ${JSON.stringify(st).slice(0, 300)}`)
    await Bun.sleep(wait)
    wait = Math.min(wait * 1.4, 15_000)
  }
  const r = await fetch(sub.response_url, { headers: { Authorization: `Key ${getKey()}` } })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`result ${sub.request_id} -> HTTP ${r.status}: ${JSON.stringify(body).slice(0, 400)}`)
  return body
}

// Collect downloadable media URLs from any fal result shape.
export function mediaUrls(result: any): string[] {
  const urls: string[] = []
  const walk = (v: any) => {
    if (!v) return
    if (typeof v === "string") {
      if (/^https?:\/\/.*(fal\.media|fal\.ai|\.png|\.jpg|\.jpeg|\.webp|\.svg|\.mp4|\.webm)/i.test(v)) urls.push(v)
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (typeof v === "object") {
      if (typeof v.url === "string") urls.push(v.url)
      else Object.values(v).forEach(walk)
    }
  }
  walk(result)
  return [...new Set(urls)]
}

export async function download(url: string, dest: string): Promise<number> {
  mkdirSync(dirname(dest), { recursive: true })
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download HTTP ${r.status}: ${url.slice(0, 120)}`)
  const buf = await r.arrayBuffer()
  await Bun.write(dest, buf)
  return buf.byteLength
}

export function logCost(entry: Record<string, any>) {
  mkdirSync(OUT, { recursive: true })
  appendFileSync(`${OUT}/costlog.jsonl`, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n")
}

export interface Job {
  id: string            // unique job id -> output file stem
  endpoint: string
  input: any
  fallbackInput?: any   // retried once if the primary input 422s (no published schema)
  estUsd?: number
  outDir: string        // relative to OUT, e.g. "stills"
}

// Submit everything up front (fal's queue never drops work; account concurrency
// gates execution), then poll and download as each completes.
export async function runJobs(jobs: Job[], budgetUsd: number): Promise<{ ok: any[]; failed: any[] }> {
  const est = jobs.reduce((s, j) => s + (j.estUsd ?? 0), 0)
  if (est > budgetUsd) throw new Error(`projected spend $${est.toFixed(2)} exceeds budget $${budgetUsd} - refusing`)
  console.log(`submitting ${jobs.length} jobs, projected ~$${est.toFixed(2)} (budget $${budgetUsd})`)
  const live: { job: Job; sub: Submitted; t0: number }[] = []
  const failed: any[] = []
  for (const job of jobs) {
    try {
      let sub: Submitted
      try {
        sub = await submit(job.endpoint, job.input)
      } catch (e: any) {
        if (job.fallbackInput && /HTTP 4\d\d/.test(e.message)) {
          console.log(`  ${job.id}: primary input rejected, retrying with fallback`)
          sub = await submit(job.endpoint, job.fallbackInput)
        } else throw e
      }
      live.push({ job, sub, t0: Date.now() })
      console.log(`  queued ${job.id} (${job.endpoint}) -> ${sub.request_id}`)
    } catch (e: any) {
      console.error(`  SUBMIT FAIL ${job.id}: ${e.message}`)
      failed.push({ id: job.id, endpoint: job.endpoint, error: e.message })
      logCost({ kind: "submit_fail", id: job.id, endpoint: job.endpoint, error: e.message })
    }
    await Bun.sleep(300)
  }
  const ok: any[] = []
  await Promise.all(live.map(async ({ job, sub, t0 }) => {
    try {
      const result = await awaitResult(sub)
      const urls = mediaUrls(result)
      const files: string[] = []
      for (let i = 0; i < urls.length; i++) {
        const ext = (urls[i].split("?")[0].match(/\.(png|jpe?g|webp|svg|mp4|webm)$/i)?.[1] ?? "bin").toLowerCase()
        const dest = `${OUT}${job.outDir}/${job.id}${urls.length > 1 ? `_${i}` : ""}.${ext}`
        await download(urls[i], dest)
        files.push(dest)
      }
      const ms = Date.now() - t0
      console.log(`  DONE ${job.id} in ${(ms / 1000).toFixed(0)}s -> ${files.map(f => f.split("/out/")[1]).join(", ")}`)
      logCost({ kind: "done", id: job.id, endpoint: job.endpoint, request_id: sub.request_id, estUsd: job.estUsd, ms, files, input: { ...job.input, image_url: undefined, first_frame_url: undefined, last_frame_url: undefined, end_image_url: undefined } })
      ok.push({ id: job.id, endpoint: job.endpoint, files, result })
    } catch (e: any) {
      console.error(`  FAIL ${job.id}: ${e.message}`)
      failed.push({ id: job.id, endpoint: job.endpoint, error: e.message })
      logCost({ kind: "fail", id: job.id, endpoint: job.endpoint, request_id: sub.request_id, error: e.message })
    }
  }))
  return { ok, failed }
}
