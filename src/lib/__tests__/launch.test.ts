import { describe, expect, test } from "bun:test"
import {
  KitError,
  LAUNCH_DURATIONS,
  LAUNCH_MAX_SECONDS,
  launchDuration,
  normaliseKit,
  type LaunchBeat,
} from "../kit"

const base = { version: "v1.0.0", repo: "s0nderlabs/imaji" }
const SHOT = "https://raw.githubusercontent.com/s0nderlabs/imaji/main/docs/shot.png"

/* a storyboard that needs no repair: opens on text, closes on a signoff */
function storyboard(middle: unknown[] = [{ type: "lines", lines: ["one", "two"] }]) {
  return {
    beats: [
      { type: "text", headline: "One release in, a whole kit out", accentWord: "kit" },
      ...middle,
      { type: "signoff", closing: "imaji v1.0.0, on GitHub" },
    ],
  }
}

function withLaunch(launch: unknown, extra: Record<string, unknown> = {}) {
  return normaliseKit({ ...base, outputs: ["card", "launch"], launch, ...extra })
}

describe("outputs", () => {
  test("vertical and launch are accepted but never a default", () => {
    expect(normaliseKit(base).kit.outputs).toEqual(["x", "linkedin", "card", "film"])
    const { kit } = normaliseKit({ ...base, outputs: ["launch", "vertical", "film"], launch: storyboard() })
    expect(kit.outputs).toEqual(["film", "vertical", "launch"])
  })
})

describe("launch beats", () => {
  test("a launch is optional and ignored when it is not an object", () => {
    expect(normaliseKit(base).kit.launch).toBeUndefined()
    const { kit, warnings } = normaliseKit({ ...base, outputs: ["card"], launch: "soon" })
    expect(kit.launch).toBeUndefined()
    expect(warnings.some((w) => w.includes("launch was not an object"))).toBe(true)
  })

  test("outputs with launch and no beats is a hard error", () => {
    expect(() => normaliseKit({ ...base, outputs: ["launch"] })).toThrow(KitError)
    expect(() =>
      normaliseKit({ ...base, outputs: ["launch"], launch: { beats: [{ type: "text", headline: "hi" }] } }),
    ).toThrow(KitError)
  })

  test("a full storyboard survives with every beat type", () => {
    const { kit, warnings } = withLaunch(
      storyboard([
        { type: "image", src: SHOT, caption: "The kit page" },
        { type: "capture", url: "https://imaji.s0nderlabs.xyz", caption: "Live" },
        { type: "lines", lines: ["a", "b", "c"] },
      ]),
    )
    expect(kit.launch?.beats.map((b) => b.type)).toEqual(["text", "image", "capture", "lines", "signoff"])
    expect(warnings.filter((w) => w.startsWith("launch"))).toEqual([])
  })

  test("an unknown beat type is dropped with a warning", () => {
    const { kit, warnings } = withLaunch(storyboard([{ type: "montage" }, { type: "lines", lines: ["a"] }]))
    expect(kit.launch?.beats.map((b) => b.type)).toEqual(["text", "lines", "signoff"])
    expect(warnings.some((w) => w.includes("montage"))).toBe(true)
  })

  test("each beat type keeps only what it can be rendered from", () => {
    const { kit, warnings } = withLaunch(
      storyboard([
        { type: "text", sub: "no headline here" },
        { type: "image", src: "http://insecure.example/shot.png" },
        { type: "capture", url: "notaurl" },
        { type: "lines", lines: [] },
        { type: "signoff" },
        { type: "lines", lines: ["kept"] },
      ]),
    )
    expect(kit.launch?.beats.map((b) => b.type)).toEqual(["text", "lines", "signoff"])
    expect(warnings.some((w) => w.includes("text beat with no headline"))).toBe(true)
    expect(warnings.some((w) => w.includes("image beat without an https src"))).toBe(true)
    expect(warnings.some((w) => w.includes("capture beat without an https url"))).toBe(true)
    expect(warnings.some((w) => w.includes("lines beat with no lines"))).toBe(true)
    expect(warnings.some((w) => w.includes("signoff beat with no closing"))).toBe(true)
  })

  test("a lines beat takes at most four lines", () => {
    const { kit, warnings } = withLaunch(storyboard([{ type: "lines", lines: ["a", "b", "c", "d", "e"] }]))
    const beat = kit.launch?.beats[1] as Extract<LaunchBeat, { type: "lines" }>
    expect(beat.lines).toEqual(["a", "b", "c", "d"])
    expect(warnings.some((w) => w.includes("more than 4 lines"))).toBe(true)
  })

  test("strings are clamped and an accentWord outside its headline is dropped", () => {
    const long = "x".repeat(400)
    const { kit, warnings } = withLaunch(
      storyboard([
        { type: "text", headline: long, accentWord: "nowhere", sub: long },
        { type: "image", src: SHOT, caption: long },
      ]),
    )
    const text = kit.launch?.beats[1] as Extract<LaunchBeat, { type: "text" }>
    const image = kit.launch?.beats[2] as Extract<LaunchBeat, { type: "image" }>
    expect(text.headline.length).toBe(60)
    expect(text.sub?.length).toBe(100)
    expect(text.accentWord).toBeUndefined()
    expect(image.caption?.length).toBe(80)
    expect(warnings.some((w) => w.includes("is not a word of its headline"))).toBe(true)
  })

  test("more than ten beats are dropped from the end", () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ type: "lines", lines: [`line ${i}`] }))
    const { kit, warnings } = withLaunch({ beats: many })
    expect(kit.launch?.beats.length).toBeLessThanOrEqual(12)
    expect(warnings.some((w) => w.includes("more than 10 beats"))).toBe(true)
  })
})

describe("the two structural beats", () => {
  test("a launch that does not open on text gets one from the card headline", () => {
    const { kit, warnings } = withLaunch(
      { beats: [{ type: "lines", lines: ["a"] }, { type: "lines", lines: ["b"] }, { type: "lines", lines: ["c"] }] },
      { card: { headline: "Ship the release, not the thread", accentWord: "release" } },
    )
    const first = kit.launch?.beats[0] as Extract<LaunchBeat, { type: "text" }>
    expect(first.type).toBe("text")
    expect(first.headline).toBe("Ship the release, not the thread")
    expect(first.accentWord).toBe("release")
    expect(warnings.some((w) => w.includes("opens on what it is"))).toBe(true)
  })

  test("a launch that does not close on a signoff gets one from film.closing", () => {
    const { kit } = withLaunch(
      { beats: [{ type: "text", headline: "a" }, { type: "lines", lines: ["b"] }, { type: "lines", lines: ["c"] }] },
      { film: { closing: "v1.0.0, on npm" } },
    )
    const last = kit.launch?.beats.at(-1) as Extract<LaunchBeat, { type: "signoff" }>
    expect(last).toEqual({ type: "signoff", closing: "v1.0.0, on npm" })
  })

  test("with no film.closing the signoff falls back to the brand and the version", () => {
    const { kit } = withLaunch(
      { beats: [{ type: "text", headline: "a" }, { type: "lines", lines: ["b"] }, { type: "lines", lines: ["c"] }] },
      { brand: { name: "imaji" } },
    )
    const last = kit.launch?.beats.at(-1) as Extract<LaunchBeat, { type: "signoff" }>
    expect(last.closing).toBe("imaji v1.0.0")
  })

  test("a storyboard that already opens and closes right is left alone", () => {
    const { kit } = withLaunch(storyboard())
    expect(kit.launch?.beats.length).toBe(3)
  })
})

describe("duration", () => {
  test("the wordmark is counted once, before beat one", () => {
    const beats: LaunchBeat[] = [
      { type: "text", headline: "a" },
      { type: "image", src: SHOT },
      { type: "capture", url: "https://example.com" },
      { type: "lines", lines: ["a", "b", "c"] },
      { type: "signoff", closing: "z" },
    ]
    const expected =
      LAUNCH_DURATIONS.mark +
      LAUNCH_DURATIONS.text +
      LAUNCH_DURATIONS.image +
      LAUNCH_DURATIONS.capture +
      (LAUNCH_DURATIONS.linesBase + LAUNCH_DURATIONS.linePer * 3) +
      LAUNCH_DURATIONS.signoff
    expect(launchDuration(beats)).toBeCloseTo(expected, 6)
    expect(expected).toBeCloseTo(2.5 + 4 + 4.5 + 5 + 5.4 + 3.5, 6)
  })

  test("a storyboard past the ceiling loses middle beats, never its open or its close", () => {
    const middle = Array.from({ length: 8 }, () => ({ type: "capture", url: "https://example.com/page" }))
    const { kit, warnings } = withLaunch({
      beats: [{ type: "text", headline: "Opening line" }, ...middle, { type: "signoff", closing: "the end" }],
    })
    const beats = kit.launch?.beats ?? []
    expect(beats[0].type).toBe("text")
    expect(beats.at(-1)).toEqual({ type: "signoff", closing: "the end" })
    expect(launchDuration(beats)).toBeLessThanOrEqual(LAUNCH_MAX_SECONDS)
    expect(warnings.some((w) => w.includes("past 45 seconds"))).toBe(true)
  })
})
