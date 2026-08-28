/* Reconcile kits that a restart left mid-render.

   A film render lives in one process. If that process goes away between
   "queued" and "done" nothing on disk ever moves again: the kit page polls
   for six minutes and then tells the user to reload, which changes nothing.

   So on the first request after start, every meta.json still claiming any of
   the three video renders in flight is marked failed with "interrupted". It
   runs once, lazily,
   because there is no start-up hook in the App Router that is guaranteed to
   run before the first request. */
import { promises as fs } from "node:fs"
import path from "node:path"
import { kitsRoot, readMeta, writeMeta, VIDEO_KINDS, type Meta } from "./store"

async function sweep(): Promise<void> {
  const root = kitsRoot()
  let tokens: string[]
  try {
    tokens = await fs.readdir(root)
  } catch {
    return
  }
  for (const token of tokens) {
    let tags: string[]
    try {
      tags = await fs.readdir(path.join(root, token))
    } catch {
      continue
    }
    for (const tag of tags) {
      try {
        const meta = await readMeta(token, tag)
        if (!meta) continue
        const status: Meta["status"] = { ...meta.status }
        const errors: NonNullable<Meta["errors"]> = { ...(meta.errors ?? {}) }
        let touched = false
        for (const kind of VIDEO_KINDS) {
          const current = status[kind]
          if (current !== "queued" && current !== "rendering") continue
          status[kind] = "failed"
          errors[kind] = "interrupted"
          touched = true
        }
        if (!touched) continue
        await writeMeta(token, tag, { ...meta, status, errors, error: "interrupted" })
      } catch {
        /* one unreadable kit is not worth failing the sweep over */
      }
    }
  }
}

let once: Promise<void> | null = null

export function sweepInterrupted(): Promise<void> {
  if (!once) once = sweep().catch(() => undefined)
  return once
}
