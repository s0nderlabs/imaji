import { DOC_PAGES, loadDoc, siteVersion, type DocPage } from "@/lib/docs"
import { baseUrl } from "@/lib/urls"

/* Every documentation page in one file, for a model that would rather read
   once than crawl. The install instructions come first because that is what an
   agent arriving here is usually trying to do; the changelog comes last. */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ORDER = [
  "agents",
  "introduction",
  "using-it",
  "the-job",
  "outputs",
  "workflow",
  "spec",
  "releasing",
  "bazaar",
  "running-it",
  "changelog",
]

function reading(): DocPage[] {
  const bySlug = new Map(DOC_PAGES.map((p) => [p.slug, p]))
  const out: DocPage[] = []
  for (const slug of ORDER) {
    const page = bySlug.get(slug)
    if (page) {
      out.push(page)
      bySlug.delete(slug)
    }
  }
  /* anything added to the manifest and not to ORDER still ships, in its own
     reading order, rather than quietly falling out of this file */
  for (const page of DOC_PAGES) if (bySlug.has(page.slug)) out.push(page)
  return out
}

export async function GET(request: Request) {
  const base = baseUrl(request)
  const version = await siteVersion()
  const pages = reading()

  const loaded = await Promise.all(pages.map(loadDoc))

  const sections = loaded
    .filter((d) => d !== null)
    .map(
      (d) =>
        `## ${d.heading}\n\n> ${d.page.description}\n> Page: ${base}/docs/${d.page.slug}\n> Source: ${d.page.sourceUrl}\n\n${d.markdown.trim()}`,
    )

  const header = `# imaji, the whole documentation

> One release in, a whole launch kit out. A developer tags a GitHub release; that wakes their own Mind (Minds by Animoca Brands), which reads the release, remembers the brand and every release before it, decides what each channel needs, writes every word, and calls imaji's render service for the visuals. Nobody prompts it. imaji is the job description plus the hands; the Mind is the brain, the memory and the judgment. Pull the Mind out and what remains is a template filler with no memory and no taste.

> This file inlines every page of ${base}/docs, separated by horizontal rules. Each page names the repository file it is read from, and the raw markdown for any one page is at ${base}/docs/<slug>.md.

Version ${version || "0"}. Apache-2.0. Source: https://github.com/s0nderlabs/imaji`

  const body = `${[header, ...sections].join("\n\n---\n\n")}\n`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  })
}
