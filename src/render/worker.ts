#!/usr/bin/env bun
/* One shard of a film render, as its own process.

   The parent (renderFilm in render.ts) works out the frame ranges and spawns
   one of these per range. Each holds its own Chrome and its own ffmpeg and
   writes one keyframe-aligned segment, which the parent then concat-copies.
   Frame counts go back to the parent on stdout, one line per report. */
import { renderShard } from "./render"

function option(name: string): string | undefined {
  const at = process.argv.indexOf(name)
  return at >= 0 ? process.argv[at + 1] : undefined
}

function integer(name: string): number {
  const value = Number(option(name))
  if (!Number.isFinite(value)) throw new Error(`worker: ${name} is missing or not a number`)
  return Math.round(value)
}

async function main(): Promise<void> {
  const entry = option("--entry")
  const segment = option("--segment")
  if (!entry || !segment) throw new Error("worker: --entry and --segment are required")
  const shard = integer("--shard")
  const start = integer("--start")
  const end = integer("--end")
  if (end <= start) throw new Error(`worker: empty range ${start}..${end}`)

  let reported = 0
  await renderShard({
    entry,
    segment,
    start,
    end,
    fps: integer("--fps"),
    scale: integer("--scale"),
    onFrame: (frames) => {
      /* every thirtieth frame, and always the last one: enough for a progress
         line, not enough to flood the pipe */
      if (frames - reported < 30 && frames < end - start) return
      reported = frames
      process.stdout.write(`imaji-shard ${shard} ${frames}\n`)
    },
  })
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error("imaji worker:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  },
)
