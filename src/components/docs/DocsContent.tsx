"use client";

import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import CopyButton from "@/components/CopyButton";

/* The markdown in this repository, rendered as the docs page. Nothing is
   transformed on the way in: the file on disk is the page, so a table stays a
   table and a fenced block stays a block you can copy. Raw HTML is dropped
   (rehype-sanitize), which is why the README's centred title block never
   reaches the page. */

function flatten(node: ReactNode): string {
  if (node === null || node === undefined || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return flatten(props.children);
  }
  return "";
}

/* GitHub's own heading ids, so a link copied out of a file still lands. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isExternal(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:");
}

/* A link written for GitHub (`docs/SPEC.md`, `../README.md`, `job/JOB.md`)
   points at a file, not a page. Where the docs site holds that same file, the
   link is bent to the page; where it does not, it is sent to GitHub so it
   never dead-ends. */
const FILE_TO_SLUG: Record<string, string> = {
  "README.md": "introduction",
  "AGENTS.md": "agents",
  "CHANGELOG.md": "changelog",
  "job/JOB.md": "the-job",
  "docs/OUTPUTS.md": "outputs",
  "docs/WORKFLOW.md": "workflow",
  "docs/SPEC.md": "spec",
  "docs/RELEASING.md": "releasing",
  "docs/BAZAAR.md": "bazaar",
};

const REPO_BASE = "https://github.com/s0nderlabs/imaji/blob/main/";

function resolveHref(href: string | undefined): string | undefined {
  if (!href || isExternal(href) || href.startsWith("#") || href.startsWith("/"))
    return href;

  const [rawPath, hash] = href.split("#");
  /* the docs pages are served from /docs/<slug>, and a relative link inside
     docs/ ("SPEC.md") means the same thing as "docs/SPEC.md" */
  const cleaned = rawPath.replace(/^\.\//, "").replace(/^\.\.\//, "");
  const candidates = [cleaned, `docs/${cleaned}`];
  for (const candidate of candidates) {
    const slug = FILE_TO_SLUG[candidate];
    if (slug) return `/docs/${slug}${hash ? `#${hash}` : ""}`;
  }
  return `${REPO_BASE}${cleaned}${hash ? `#${hash}` : ""}`;
}

function Heading({
  level,
  children,
}: {
  level: 2 | 3;
  children: ReactNode;
}) {
  const id = slugify(flatten(children));
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag id={id}>
      {children}
      <a href={`#${id}`} className="h-anchor" aria-label="Link to this section">
        #
      </a>
    </Tag>
  );
}

const components: Components = {
  h1: ({ children }) => <h1 id={slugify(flatten(children))}>{children}</h1>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  a: ({ href, children }) => {
    const to = resolveHref(href);
    if (isExternal(to)) {
      return (
        <a href={to} target="_blank" rel="noreferrer">
          {children}
          <span className="out" aria-hidden>
            &#8599;
          </span>
        </a>
      );
    }
    return <a href={to}>{children}</a>;
  },
  table: ({ children }) => (
    <div className="docs-table-wrap" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }) => {
    const text = flatten(children).replace(/\n+$/, "");
    return (
      <div className="docs-code">
        <pre>{children}</pre>
        <CopyButton
          text={text}
          variant="quiet"
          label="Copy"
          className="docs-copy"
        />
      </div>
    );
  },
};

export default function DocsContent({
  heading,
  markdown,
}: {
  heading: string;
  markdown: string;
}) {
  return (
    <div className="prose">
      <h1>{heading}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
