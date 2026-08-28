/* Kit tokens (SPEC section 4, POST /api/tokens).
   A token is the only credential in imaji: it authorises WRITING a kit. It is
   never the address of a page; pages are addressed by the derived read id in
   ./readid.ts. No accounts, no sessions, nothing to reset. The registry is one
   JSON file, written atomically and mutated one caller at a time. */
import { randomBytes } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import { dataDir } from "./store"

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const TOKEN_LENGTH = 24

/* One registry file, one process: a hard ceiling keeps an unauthenticated
   mint endpoint from growing it without bound. */
export const MAX_TOKENS = 5000

export class TokenLimitError extends Error {
  constructor(message = "the token registry is full") {
    super(message)
    this.name = "TokenLimitError"
  }
}

export type TokenRecord = { createdAt: string }
export type TokenFile = Record<string, TokenRecord>

export function tokensFile(): string {
  return path.join(dataDir(), "tokens.json")
}

/* Rejection sampling: 62 does not divide 256, so bytes at or above 248 are
   thrown away rather than folded in and skewing the first six characters. */
export function mintToken(): string {
  let out = ""
  while (out.length < TOKEN_LENGTH) {
    for (const byte of randomBytes(TOKEN_LENGTH)) {
      if (byte >= 248) continue
      out += ALPHABET[byte % 62]
      if (out.length === TOKEN_LENGTH) break
    }
  }
  return out
}

export async function readTokens(): Promise<TokenFile> {
  try {
    const parsed = JSON.parse(await fs.readFile(tokensFile(), "utf8")) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as TokenFile
    return {}
  } catch {
    return {}
  }
}

/* Write to a sibling temp file and rename onto the real one. rename is atomic
   on the same filesystem, so a crash mid-write can never leave a truncated
   registry behind (which readTokens would read as "no tokens exist" and turn
   every kit page into a 404 and every render into a 401). */
async function writeTokens(tokens: TokenFile): Promise<void> {
  const file = tokensFile()
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  try {
    await fs.writeFile(tmp, JSON.stringify(tokens, null, 2) + "\n", "utf8")
    await fs.rename(tmp, file)
  } catch (error) {
    await fs.rm(tmp, { force: true }).catch(() => undefined)
    throw error
  }
}

/* Mints are serialised through one promise chain. The registry is a
   read-modify-write of a whole file, so two mints in the same event-loop tick
   would otherwise clobber each other and hand a caller a token that is not in
   the file. */
let queue: Promise<unknown> = Promise.resolve()

function serialise<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function createToken(): Promise<string> {
  return serialise(async () => {
    const tokens = await readTokens()
    if (Object.keys(tokens).length >= MAX_TOKENS) throw new TokenLimitError()
    const token = mintToken()
    tokens[token] = { createdAt: new Date().toISOString() }
    await writeTokens(tokens)
    return token
  })
}

export async function hasToken(token: string): Promise<boolean> {
  if (typeof token !== "string" || token.length !== TOKEN_LENGTH) return false
  if (!/^[0-9A-Za-z]+$/.test(token)) return false
  const tokens = await readTokens()
  return Object.prototype.hasOwnProperty.call(tokens, token)
}
