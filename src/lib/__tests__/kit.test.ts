import { describe, expect, test } from "bun:test"
import { DEFAULT_ACCENT, KitError, LIMITS, normaliseKit, unescapeNewlines } from "../kit"

const base = { version: "v1.0.0", repo: "s0nderlabs/imaji" }

describe("normaliseKit", () => {
  test("rejects a body that is not an object", () => {
    expect(() => normaliseKit("nope")).toThrow(KitError)
    expect(() => normaliseKit(null)).toThrow(KitError)
  })

  test("requires version and an owner/name repo", () => {
    expect(() => normaliseKit({ repo: "s0nderlabs/imaji" })).toThrow(KitError)
    expect(() => normaliseKit({ version: "v1.0.0" })).toThrow(KitError)
    expect(() => normaliseKit({ version: "v1.0.0", repo: "imaji" })).toThrow(KitError)
    expect(() => normaliseKit({ version: "../../etc/qa", repo: "s0nderlabs/imaji" })).toThrow(KitError)
    expect(() => normaliseKit({ version: "v1.2.3-beta.1+build.7", repo: "s0nderlabs/imaji" })).not.toThrow()
  })

  test("missing outputs means all four, in canonical order", () => {
    const { kit } = normaliseKit(base)
    expect(kit.outputs).toEqual(["x", "linkedin", "card", "film"])
  })

  test("outputs is reduced to a deduped subset and unknown entries warn", () => {
    const { kit, warnings } = normaliseKit({ ...base, outputs: ["film", "card", "card", "tiktok"] })
    expect(kit.outputs).toEqual(["card", "film"])
    expect(warnings.some((w) => w.includes("tiktok"))).toBe(true)
  })

  test("unknown look falls back to editorial with a warning", () => {
    const { kit, warnings } = normaliseKit({ ...base, look: "cinematic" })
    expect(kit.look).toBe("editorial")
    expect(warnings.some((w) => w.includes("cinematic"))).toBe(true)
    expect(normaliseKit({ ...base, look: "Punchy" }).kit.look).toBe("punchy")
  })

  test("brand defaults fill in and a bad accent falls back", () => {
    const { kit, warnings } = normaliseKit({ ...base, brand: { accent: "orange", ground: "sepia" } })
    expect(kit.brand.accent).toBe(DEFAULT_ACCENT)
    expect(kit.brand.ground).toBe("dark")
    expect(kit.brand.type).toBe("grotesque")
    expect(kit.brand.name).toBe("imaji")
    expect(warnings.filter((w) => w.startsWith("brand.")).length).toBe(1)
    expect(warnings.some((w) => w.includes("brand.ground"))).toBe(true)
  })

  test("a three digit hex accent is expanded and uppercased", () => {
    const { kit } = normaliseKit({ ...base, brand: { accent: "#0af" } })
    expect(kit.brand.accent).toBe("#00AAFF")
  })

  test("a non https logoUrl is dropped with a warning", () => {
    const { kit, warnings } = normaliseKit({ ...base, brand: { logoUrl: "http://example.com/logo.png" } })
    expect(kit.brand.logoUrl).toBeUndefined()
    expect(warnings.some((w) => w.includes("logoUrl"))).toBe(true)
  })

  test("accentWord must be a word of the headline", () => {
    const inHeadline = normaliseKit({
      ...base,
      card: { headline: "Every release gets a film", subline: "s", accentWord: "FILM" },
    })
    expect(inHeadline.kit.card.accentWord).toBe("FILM")

    const notInHeadline = normaliseKit({
      ...base,
      card: { headline: "Every release gets a card", subline: "s", accentWord: "film" },
    })
    expect(notInHeadline.kit.card.accentWord).toBeUndefined()
    expect(notInHeadline.warnings.some((w) => w.includes("accentWord"))).toBe(true)
  })

  test("strings are clamped and clamping never throws", () => {
    const { kit, warnings } = normaliseKit({
      ...base,
      tweet: "a".repeat(400),
      card: { headline: "h".repeat(120), subline: "s".repeat(200) },
      film: { lines: ["l".repeat(120)], closing: "c".repeat(200) },
    })
    expect(kit.tweet).toHaveLength(280)
    expect(kit.card.headline).toHaveLength(60)
    expect(kit.card.subline).toHaveLength(100)
    expect(kit.film.lines[0]).toHaveLength(70)
    expect(kit.film.closing).toHaveLength(80)
    expect(warnings.length).toBeGreaterThanOrEqual(5)
  })

  test("literal escaped newlines become real newlines", () => {
    expect(unescapeNewlines("a\\n\\nb")).toBe("a\n\nb")
    const { kit } = normaliseKit({ ...base, linkedin: "one\\n\\ntwo" })
    expect(kit.linkedin).toBe("one\n\ntwo")
  })

  test("a missing card falls back to the version and the repo, never invented copy", () => {
    const { kit, warnings } = normaliseKit({ ...base, outputs: ["card"] })
    expect(kit.card.headline).toBe("v1.0.0")
    expect(kit.card.subline).toBe("s0nderlabs/imaji")
    expect(warnings.some((w) => w.includes("card.headline"))).toBe(true)
  })

  test("film keeps at most three lines and drops blanks", () => {
    const { kit, warnings } = normaliseKit({
      ...base,
      film: { lines: ["one", "", "two", "three", "four"], closing: "done" },
    })
    expect(kit.film.lines).toEqual(["one", "two", "three"])
    expect(warnings.some((w) => w.includes("more than three"))).toBe(true)
  })

  test("a thread is capped at ten parts with a warning", () => {
    const { kit, warnings } = normaliseKit({ ...base, thread: Array.from({ length: 50 }, (_, i) => `part ${i + 1}`) })
    expect(kit.thread.length).toBe(LIMITS.threadParts)
    expect(warnings.some((w) => w.includes("capped"))).toBe(true)
  })

  test("a clamp cuts at a sentence or word boundary, never mid-word", () => {
    const sentence = "First sentence here. " + "word ".repeat(70)
    const kit = normaliseKit({ ...base, thread: [sentence, "x".repeat(10) + " " + "ab ".repeat(120)] }).kit
    expect(kit.thread[0].length).toBeLessThanOrEqual(LIMITS.threadPart)
    expect(kit.thread[0].endsWith("word")).toBe(true)
    expect(kit.thread[1].endsWith("ab")).toBe(true)
    expect(kit.thread[1].length).toBeLessThanOrEqual(LIMITS.threadPart)
  })

  test("thread entries are kept in order and clamped", () => {
    const { kit } = normaliseKit({ ...base, thread: ["one", 5, "  ", "t".repeat(400)] })
    expect(kit.thread).toHaveLength(2)
    expect(kit.thread[0]).toBe("one")
    expect(kit.thread[1]).toHaveLength(280)
  })

  test("an explicitly empty outputs list is honoured as a skip", () => {
    const { kit } = normaliseKit({ ...base, outputs: [] })
    expect(kit.outputs).toEqual([])
  })
})
