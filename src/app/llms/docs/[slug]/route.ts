import { loadBySlug } from "@/lib/docs"

/* The raw markdown behind a docs page, so an agent reading the site never has
   to parse HTML back into prose. Reached at /docs/<slug>.md, which next.config
   rewrites here. */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: RouteContext<"/llms/docs/[slug]">) {
  const { slug } = await params
  const doc = await loadBySlug(slug)
  if (!doc) {
    return new Response("not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  const body = `# ${doc.heading}\n\n> ${doc.page.description}\n> Source: ${doc.page.sourceUrl}\n\n${doc.markdown.trim()}\n`
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  })
}
