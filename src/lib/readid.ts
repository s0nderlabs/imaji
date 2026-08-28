/* Read ids (SPEC sections 4 and 5).

   A kit token is a WRITE credential: it is the bearer on POST /api/render and
   it lives in the user's repo as IMAJI_KIT_TOKEN. It must never appear in a
   URL that gets pasted into a commit comment, a Slack thread or a demo video.

   So everything readable is addressed by a read id instead:

     readId = sha256(token) as hex, first 24 characters

   The read id is derived, never stored, and cannot be turned back into the
   token by anyone who does not already hold it. Storage on disk stays keyed
   by the token (data/kits/<token>/...), so nothing has to migrate: a read id
   is resolved back to its token by scanning the registry once and caching. */
import { createHash } from "node:crypto"
import { readTokens } from "./tokens"

export const READ_ID_LENGTH = 24

export function readIdFor(token: string): string {
  return createHash("sha256").update(String(token)).digest("hex").slice(0, READ_ID_LENGTH)
}

/* readId -> token. Warmed on mint and on the first scan; a process restart
   just means one more scan of a file that is a few kilobytes. */
const cache = new Map<string, string>()

export function rememberToken(token: string): string {
  const id = readIdFor(token)
  cache.set(id, token)
  return id
}

export function isReadId(value: string): boolean {
  return typeof value === "string" && new RegExp(`^[0-9a-f]{${READ_ID_LENGTH}}$`).test(value)
}

export async function tokenForReadId(readId: string): Promise<string | null> {
  if (!isReadId(readId)) return null
  const hit = cache.get(readId)
  if (hit) return hit
  const tokens = await readTokens()
  let found: string | null = null
  for (const token of Object.keys(tokens)) {
    const id = rememberToken(token)
    if (id === readId) found = token
  }
  return found
}
