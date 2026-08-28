/* The docs site has no content of its own.

   Every page here is a view onto a markdown file that already lives in the
   repository, read from disk at request time. There is exactly one copy of
   every sentence: edit README.md, docs/SPEC.md or job/JOB.md and the site
   changes with the next request, no rebuild and no second source of truth.

   Some pages are a slice of a longer file rather than the whole of it. The
   README is the front of the repository and the front of the docs at once, so
   it is cut by heading: the introduction stops where the instructions begin,
   and the instructions are three named sections lifted out in order. The cut
   is by heading text, which means a rename would silently empty a page, so an
   extractor that finds nothing falls back to the whole file and says so on the
   server rather than serving a blank. */
import { promises as fs } from "node:fs"
import path from "node:path"

const REPO_BASE = "https://github.com/s0nderlabs/imaji/blob/main/"

export interface DocPage {
  slug: string
  title: string
  description: string
  group: string
  order: number
  /** repository-relative path of the markdown this page renders */
  file: string
  /** the same file on GitHub */
  sourceUrl: string
  /** take everything up to (not including) this heading */
  until?: string
  /** take only these `##` sections, in this order */
  sections?: string[]
}

type ManifestEntry = Omit<DocPage, "sourceUrl">

/* The whole site, in reading order. `order` is the position in that order and
   the order the site and prev/next follow (llms-full.txt keeps its own, agents first); `group` is the heading it sits
   under in the sidebar. */
const MANIFEST: ManifestEntry[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description:
      "What imaji is, the loop it runs, and why your own Mind is the employee rather than a model in the middle.",
    group: "Get started",
    order: 1,
    file: "README.md",
    until: "Using it",
  },
  {
    slug: "using-it",
    title: "Using it",
    description:
      "The three steps that put imaji on your repository, and why the rest of the configuration is a conversation with your Mind.",
    group: "Get started",
    order: 2,
    file: "README.md",
    sections: ["Using it", "For Agents", "Configuration"],
  },
  {
    slug: "agents",
    title: "Agent setup",
    description:
      "The whole install as four terminal steps, written for a coding agent handing a developer's own Mind the job.",
    group: "Get started",
    order: 3,
    file: "AGENTS.md",
  },
  {
    slug: "the-job",
    title: "The job",
    description:
      "The job description you hand your Mind once. It reads it, remembers it, and confirms in a sentence. The only prompt anyone writes.",
    group: "Get started",
    order: 4,
    file: "job/JOB.md",
  },
  {
    slug: "outputs",
    title: "Outputs",
    description:
      "The six outputs one at a time: size, duration, what the Mind writes for each, how imaji renders it.",
    group: "Reference",
    order: 5,
    file: "docs/OUTPUTS.md",
  },
  {
    slug: "workflow",
    title: "The workflow",
    description:
      "templates/imaji.yml in use, the one file that wakes your Mind: the onboard job, the release job, standing preferences, and what every failure means.",
    group: "Reference",
    order: 6,
    file: "docs/WORKFLOW.md",
  },
  {
    slug: "spec",
    title: "Spec",
    description:
      "The contract every part of the repository is built against, from the kit JSON the Mind writes to the storage layout.",
    group: "Reference",
    order: 7,
    file: "docs/SPEC.md",
  },
  {
    slug: "releasing",
    title: "Releasing",
    description:
      "How a release is cut here, and why publishing one is the same event that wakes imaji's own Mind.",
    group: "Reference",
    order: 8,
    file: "docs/RELEASING.md",
  },
  {
    slug: "bazaar",
    title: "The Bazaar",
    description:
      "Publishing the Skill to the Minds Bazaar, which is a conversation with your Mind rather than a file you upload. Not published yet.",
    group: "Reference",
    order: 9,
    file: "docs/BAZAAR.md",
  },
  {
    slug: "changelog",
    title: "Changelog",
    description: "Every release, in Keep a Changelog form.",
    group: "Project",
    order: 10,
    file: "CHANGELOG.md",
  },
  {
    slug: "running-it",
    title: "Running it yourself",
    description:
      "Standing imaji up on your own machine: the environment, the repository map, how rendering works, and what a Mind has already done with it.",
    group: "Project",
    order: 11,
    file: "README.md",
    sections: [
      "Running imaji yourself",
      "Repository map",
      "Rendering",
      "It ran, for real",
      "Status",
      "License",
    ],
  },
]

export const DOC_PAGES: DocPage[] = MANIFEST.map((entry) => ({
  ...entry,
  sourceUrl: `${REPO_BASE}${entry.file}`,
})).sort((a, b) => a.order - b.order)

export function findDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((d) => d.slug === slug)
}

export interface NavGroup {
  name: string
  items: DocPage[]
}

export function navGroups(): NavGroup[] {
  const order: string[] = []
  const byGroup = new Map<string, DocPage[]>()
  for (const page of DOC_PAGES) {
    if (!byGroup.has(page.group)) {
      order.push(page.group)
      byGroup.set(page.group, [])
    }
    byGroup.get(page.group)?.push(page)
  }
  return order.map((name) => ({ name, items: byGroup.get(name) ?? [] }))
}

export interface Adjacent {
  prev: DocPage | null
  next: DocPage | null
}

export function adjacent(slug: string): Adjacent {
  const i = DOC_PAGES.findIndex((d) => d.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? DOC_PAGES[i - 1] : null,
    next: i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1] : null,
  }
}

/* ------------------------------------------------------------------ cutting */

const HEADING = /^(#{1,6})\s+(.*)$/

function headingKey(text: string): string {
  return text
    .replace(/[`*_]/g, "")
    .trim()
    .toLowerCase()
}

interface Line {
  raw: string
  level: number | null
  key: string | null
}

/* Fences hold `#` lines that are code, not headings, so the scan tracks them. */
function scan(markdown: string): Line[] {
  const lines: Line[] = []
  let fence: string | null = null
  for (const raw of markdown.split("\n")) {
    const fenceMatch = raw.match(/^\s{0,3}(```+|~~~+)/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fence === null) fence = marker
      else if (fence === marker) fence = null
      lines.push({ raw, level: null, key: null })
      continue
    }
    if (fence !== null) {
      lines.push({ raw, level: null, key: null })
      continue
    }
    const heading = raw.match(HEADING)
    if (heading) {
      lines.push({
        raw,
        level: heading[1].length,
        key: headingKey(heading[2]),
      })
      continue
    }
    lines.push({ raw, level: null, key: null })
  }
  return lines
}

/** Everything before the named heading. */
function cutBefore(markdown: string, heading: string): string | null {
  const want = headingKey(heading)
  const lines = scan(markdown)
  const at = lines.findIndex((l) => l.key === want)
  if (at === -1) return null
  return lines
    .slice(0, at)
    .map((l) => l.raw)
    .join("\n")
    .trimEnd()
}

/** The named `##` sections, heading included, in the order asked for. */
function cutSections(markdown: string, headings: string[]): string | null {
  const lines = scan(markdown)
  const chunks: string[] = []
  for (const heading of headings) {
    const want = headingKey(heading)
    const start = lines.findIndex((l) => l.key === want)
    if (start === -1) continue
    const level = lines[start].level ?? 2
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
      const l = lines[i]
      if (l.level !== null && l.level <= level) {
        end = i
        break
      }
    }
    chunks.push(
      lines
        .slice(start, end)
        .map((l) => l.raw)
        .join("\n")
        .trimEnd(),
    )
  }
  if (chunks.length === 0) return null
  return chunks.join("\n\n")
}

/* The README opens with a centred HTML title block that react-markdown drops
   anyway; removing it here keeps the page from starting with a gap. */
function stripLeadingHtml(markdown: string): string {
  let body = markdown.replace(/^\s+/, "")
  for (;;) {
    const open = body.match(/^<([a-zA-Z][\w-]*)\b[^>]*>/)
    if (!open) break
    const close = `</${open[1].toLowerCase()}>`
    const at = body.toLowerCase().indexOf(close)
    if (at === -1) break
    body = body.slice(at + close.length).replace(/^\s+/, "")
  }
  return body
}

/* A page's heading is the file's own first heading, lifted out of the body so
   the page carries exactly one h1 and never says its title twice. Where a file
   or a slice of one opens without a heading, the manifest title stands in. */
function takeHeading(markdown: string): {
  heading: string | null
  body: string
} {
  const first = markdown.match(/^(#{1,2})\s+(.+?)\s*#*\s*(?:\n|$)/)
  if (!first) return { heading: null, body: markdown }
  return {
    heading: first[2].trim(),
    body: markdown.slice(first[0].length).replace(/^\s+/, ""),
  }
}

/* ------------------------------------------------------------------ reading */

export interface LoadedDoc {
  page: DocPage
  /** the heading the page shows, the file's own where it has one */
  heading: string
  markdown: string
}

export async function loadDoc(page: DocPage): Promise<LoadedDoc | null> {
  const file = path.join(process.cwd(), page.file)
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    console.warn(`[docs] ${page.slug}: cannot read ${page.file}`)
    return null
  }

  let body: string | null = raw
  if (page.until) {
    body = cutBefore(raw, page.until)
    if (body === null) {
      console.warn(
        `[docs] ${page.slug}: heading "${page.until}" not found in ${page.file}, serving the whole file`,
      )
      body = raw
    }
  } else if (page.sections) {
    body = cutSections(raw, page.sections)
    if (body === null) {
      console.warn(
        `[docs] ${page.slug}: none of [${page.sections.join(", ")}] found in ${page.file}, serving the whole file`,
      )
      body = raw
    }
  }

  const { heading, body: rest } = takeHeading(stripLeadingHtml(body))
  return { page, heading: heading ?? page.title, markdown: rest.trimEnd() }
}

export async function loadBySlug(slug: string): Promise<LoadedDoc | null> {
  const page = findDoc(slug)
  if (!page) return null
  return loadDoc(page)
}

/** imaji's own version, read from package.json rather than repeated here. */
export async function siteVersion(): Promise<string> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "package.json"),
      "utf8",
    )
    const parsed = JSON.parse(raw) as { version?: unknown }
    return typeof parsed.version === "string" ? parsed.version : ""
  } catch {
    return ""
  }
}

export async function loadAll(): Promise<LoadedDoc[]> {
  const loaded = await Promise.all(DOC_PAGES.map(loadDoc))
  return loaded.filter((d): d is LoadedDoc => d !== null)
}
