import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { normaliseKit } from "../kit"
import { fileFor, kitDir, listKits, patchMeta, readKit, readMeta, sanitiseTag, writeKit, writeMeta, type Meta } from "../store"

let root = ""

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "imaji-store-"))
  process.env.IMAJI_DATA_DIR = root
})

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true })
})

function meta(tag: string, receivedAt: string): Meta {
  return {
    repo: "s0nderlabs/imaji",
    tag,
    receivedAt,
    outputs: ["card", "film"],
    status: { card: "done", film: "queued" },
    kitUrl: `https://example.test/k/tok/${tag}`,
    indexUrl: "https://example.test/k/tok",
  }
}

describe("sanitiseTag", () => {
  test("keeps a normal tag untouched", () => {
    expect(sanitiseTag("v0.2.0")).toBe("v0.2.0")
    expect(sanitiseTag("release-2026_08")).toBe("release-2026_08")
  })

  test("neutralises separators and traversal", () => {
    /* no separator survives, so the result is always one path segment */
    expect(sanitiseTag("../../etc/passwd")).toBe("-..-etc-passwd")
    expect(sanitiseTag("..")).toBe("untagged")
    expect(sanitiseTag("feature/beta")).toBe("feature-beta")
    expect(sanitiseTag("")).toBe("untagged")
  })

  test("fileFor never escapes the kit directory", () => {
    const inside = fileFor("tok", "v1", "../../../etc/passwd")
    expect(inside.startsWith(kitDir("tok", "v1"))).toBe(true)
    expect(inside.endsWith("passwd")).toBe(true)
  })
})

describe("kit round trip", () => {
  test("writes and reads a kit and its meta", async () => {
    const { kit } = normaliseKit({ version: "v1.0.0", repo: "s0nderlabs/imaji", tweet: "hello" })
    await writeKit("tok", "v1.0.0", kit)
    await writeMeta("tok", "v1.0.0", meta("v1.0.0", "2026-08-28T01:00:00.000Z"))

    const back = await readKit("tok", "v1.0.0")
    expect(back?.tweet).toBe("hello")
    expect(back?.brand.accent).toBe(kit.brand.accent)

    const backMeta = await readMeta("tok", "v1.0.0")
    expect(backMeta?.status.film).toBe("queued")
  })

  test("missing kits read back as null, not a throw", async () => {
    expect(await readKit("tok", "nope")).toBeNull()
    expect(await readMeta("nope", "nope")).toBeNull()
  })

  test("patchMeta merges status without clobbering the other half", async () => {
    const patched = await patchMeta("tok", "v1.0.0", { status: { film: "done" } })
    expect(patched?.status.film).toBe("done")
    expect(patched?.status.card).toBe("done")
    expect(await patchMeta("tok", "missing", { status: { film: "done" } })).toBeNull()
  })

  test("concurrent patchMeta calls never drop each other's status", async () => {
    await writeMeta("tok-race", "v1.1.0", meta("v1.1.0", "2026-08-28T01:00:00.000Z"))
    await Promise.all([
      patchMeta("tok-race", "v1.1.0", { status: { film: "done" } }),
      patchMeta("tok-race", "v1.1.0", { status: { vertical: "done" } }),
      patchMeta("tok-race", "v1.1.0", { status: { launch: "rendering" } }),
      patchMeta("tok-race", "v1.1.0", { errors: { launch: "slow" } }),
    ])
    const final = await readMeta("tok-race", "v1.1.0")
    expect(final?.status.film).toBe("done")
    expect(final?.status.vertical).toBe("done")
    expect(final?.status.launch).toBe("rendering")
    expect(final?.errors?.launch).toBe("slow")
  })

  test("listKits returns newest first and skips directories without meta", async () => {
    await writeMeta("tok", "v0.9.0", meta("v0.9.0", "2026-08-27T01:00:00.000Z"))
    await writeMeta("tok", "v2.0.0", meta("v2.0.0", "2026-08-29T01:00:00.000Z"))
    await fs.mkdir(kitDir("tok", "v3.0.0"), { recursive: true })

    const kits = await listKits("tok")
    expect(kits.map((m) => m.tag)).toEqual(["v2.0.0", "v1.0.0", "v0.9.0"])
    expect(await listKits("unknown-token")).toEqual([])
  })
})
