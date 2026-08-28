import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { createToken, hasToken, mintToken, readTokens } from "../tokens"

let root = ""

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "imaji-tokens-"))
  process.env.IMAJI_DATA_DIR = root
})

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true })
})

describe("mintToken", () => {
  test("is 24 base62 characters", () => {
    const token = mintToken()
    expect(token).toHaveLength(24)
    expect(/^[0-9A-Za-z]{24}$/.test(token)).toBe(true)
  })

  test("does not repeat itself", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(mintToken())
    expect(seen.size).toBe(200)
  })
})

describe("createToken and hasToken", () => {
  test("a minted token is recognised and an unminted one is not", async () => {
    const token = await createToken()
    expect(await hasToken(token)).toBe(true)
    expect(await hasToken(mintToken())).toBe(false)
  })

  test("rejects malformed candidates without touching disk shape", async () => {
    expect(await hasToken("")).toBe(false)
    expect(await hasToken("short")).toBe(false)
    expect(await hasToken("../../../etc/passwd")).toBe(false)
    expect(await hasToken("!".repeat(24))).toBe(false)
  })

  test("the registry accumulates and records a timestamp", async () => {
    const a = await createToken()
    const b = await createToken()
    const tokens = await readTokens()
    expect(Object.keys(tokens).length).toBeGreaterThanOrEqual(2)
    expect(typeof tokens[a].createdAt).toBe("string")
    expect(Number.isNaN(Date.parse(tokens[b].createdAt))).toBe(false)
  })
})
