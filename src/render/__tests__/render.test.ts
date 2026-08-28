import { afterEach, describe, expect, test } from "bun:test"
import {
  DEFAULT_FILM_FPS,
  DEFAULT_RENDER_SCALE,
  defaultShards,
  filmFps,
  intFromEnv,
  planRanges,
  renderScale,
  renderShards,
} from "../render"

const KEYS = ["IMAJI_RENDER_FPS", "IMAJI_RENDER_SCALE", "IMAJI_RENDER_SHARDS", "FILM_FPS"] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe("planRanges", () => {
  test("splits contiguously with no gap and no overlap", () => {
    const ranges = planRanges(600, 8)
    expect(ranges.length).toBe(8)
    expect(ranges[0].start).toBe(0)
    expect(ranges[ranges.length - 1].end).toBe(600)
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].start).toBe(ranges[i - 1].end)
    }
    const covered = ranges.reduce((sum, r) => sum + (r.end - r.start), 0)
    expect(covered).toBe(600)
  })

  test("the last range absorbs the remainder", () => {
    const ranges = planRanges(10, 4)
    expect(ranges.map((r) => [r.start, r.end])).toEqual([
      [0, 2],
      [2, 4],
      [4, 6],
      [6, 10],
    ])
  })

  test("indexes the ranges in order", () => {
    expect(planRanges(100, 3).map((r) => r.index)).toEqual([0, 1, 2])
  })

  test("clamps the shard count to the frame count", () => {
    const ranges = planRanges(3, 8)
    expect(ranges.length).toBe(3)
    expect(ranges.every((r) => r.end - r.start === 1)).toBe(true)
  })

  test("one shard takes every frame", () => {
    expect(planRanges(17, 1)).toEqual([{ index: 0, start: 0, end: 17 }])
  })

  test("no frames means no workers", () => {
    expect(planRanges(0, 4)).toEqual([])
    expect(planRanges(-5, 4)).toEqual([])
  })

  test("a nonsense shard count still produces one covering range", () => {
    expect(planRanges(9, 0)).toEqual([{ index: 0, start: 0, end: 9 }])
    expect(planRanges(9, Number.NaN)).toEqual([{ index: 0, start: 0, end: 9 }])
  })
})

describe("intFromEnv", () => {
  test("takes a value inside the range", () => {
    expect(intFromEnv("42", 7, 1, 100)).toBe(42)
  })

  test("falls back on blank, unparseable and out of range", () => {
    expect(intFromEnv(undefined, 7, 1, 100)).toBe(7)
    expect(intFromEnv("", 7, 1, 100)).toBe(7)
    expect(intFromEnv("   ", 7, 1, 100)).toBe(7)
    expect(intFromEnv("many", 7, 1, 100)).toBe(7)
    expect(intFromEnv("0", 7, 1, 100)).toBe(7)
    expect(intFromEnv("101", 7, 1, 100)).toBe(7)
  })

  test("rounds a fractional value", () => {
    expect(intFromEnv("2.4", 7, 1, 100)).toBe(2)
  })
})

describe("the render knobs", () => {
  test("default to 4K 60", () => {
    expect(filmFps()).toBe(DEFAULT_FILM_FPS)
    expect(DEFAULT_FILM_FPS).toBe(60)
    expect(renderScale()).toBe(DEFAULT_RENDER_SCALE)
    expect(DEFAULT_RENDER_SCALE).toBe(2)
  })

  test("IMAJI_RENDER_FPS wins, FILM_FPS is still honoured", () => {
    process.env.FILM_FPS = "30"
    expect(filmFps()).toBe(30)
    process.env.IMAJI_RENDER_FPS = "24"
    expect(filmFps()).toBe(24)
  })

  test("an unusable fps falls back to the default", () => {
    process.env.IMAJI_RENDER_FPS = "0"
    expect(filmFps()).toBe(DEFAULT_FILM_FPS)
    process.env.IMAJI_RENDER_FPS = "1000"
    expect(filmFps()).toBe(DEFAULT_FILM_FPS)
  })

  test("IMAJI_RENDER_SCALE is read and clamped", () => {
    process.env.IMAJI_RENDER_SCALE = "1"
    expect(renderScale()).toBe(1)
    process.env.IMAJI_RENDER_SCALE = "9"
    expect(renderScale()).toBe(DEFAULT_RENDER_SCALE)
  })

  test("shards leave two cores alone and never exceed eight", () => {
    expect(defaultShards(10)).toBe(8)
    expect(defaultShards(8)).toBe(6)
    expect(defaultShards(4)).toBe(2)
    expect(defaultShards(2)).toBe(2)
    expect(defaultShards(64)).toBe(8)
  })

  test("IMAJI_RENDER_SHARDS overrides the core count", () => {
    process.env.IMAJI_RENDER_SHARDS = "3"
    expect(renderShards()).toBe(3)
    process.env.IMAJI_RENDER_SHARDS = "99"
    expect(renderShards()).toBe(defaultShards())
  })
})
