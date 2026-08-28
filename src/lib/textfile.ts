/* Plain-text files served from the repository: the job the Mind takes, the
   instructions a coding agent follows, the workflow template. Read from disk
   on every request so an edit ships without a rebuild. */
import { promises as fs } from "node:fs"
import path from "node:path"

export async function textFileResponse(relativePath: string, contentType: string): Promise<Response> {
  const file = path.join(process.cwd(), relativePath)
  try {
    const text = await fs.readFile(file, "utf8")
    return new Response(text, {
      headers: { "Content-Type": `${contentType}; charset=utf-8`, "Cache-Control": "public, max-age=300" },
    })
  } catch {
    return new Response("not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }
}
