import { DOC_PAGES, siteVersion } from "@/lib/docs"
import { baseUrl } from "@/lib/urls"

/* The index an agent lands on: what imaji is in one line, then every page of
   the documentation with the address of its raw markdown, and the three files
   an agent actually needs to install it. The whole thing in one file is at
   /llms-full.txt. */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const base = baseUrl(request)
  const version = await siteVersion()

  const pages = DOC_PAGES.map(
    (p) => `- [${p.title}](${base}/docs/${p.slug}.md): ${p.description}`,
  ).join("\n")

  const body = `# imaji

> One release in, a whole launch kit out. A developer tags a GitHub release; that wakes their own Mind (Minds by Animoca Brands), which reads the release, remembers the brand and every release before it, decides what the release earns, writes the tweet, the thread, the LinkedIn post and the words for the visuals, and calls imaji's render service, which turns HTML into a 1200 x 630 card, a ten-second film, a vertical cut of it and, when the release is a launch, a 30 to 45 second launch video. Nobody prompts the Mind. imaji has no memory, no taste and no judgment; the Mind has all three. Nothing is posted anywhere: the kit lands on a private page.

Version ${version || "0"}. Apache-2.0. Source: https://github.com/s0nderlabs/imaji

## Setting it up

Read ${base}/agents.md first if you are an agent installing imaji for someone: it is the whole install as four terminal steps. The Mind you are setting up is the developer's own, never a shared one. You need two secrets from the developer, MINDS_API_KEY and MIND_ID, and a kit token you mint at ${base}/api/tokens.

- ${base}/agents.md: the terminal install, written for a coding agent
- ${base}/job.md: the job description the Mind is handed once, the only prompt anyone writes
- ${base}/imaji.yml: the GitHub Actions workflow to copy into .github/workflows/

## Docs

${pages}

## Everything at once

- ${base}/llms-full.txt: every page above, concatenated
- ${base}/docs: the same pages as a website
- Per-page raw markdown: ${base}/docs/<slug>.md
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  })
}
