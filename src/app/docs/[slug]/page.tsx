import { notFound } from "next/navigation";

import DocsContent from "@/components/docs/DocsContent";
import DocsPick from "@/components/docs/DocsPick";
import DocsPrevNext from "@/components/docs/DocsPrevNext";
import { adjacent, findDoc, loadBySlug, navGroups } from "@/lib/docs";

/* One page, which is one markdown file (or one slice of one) read from disk on
   every request. The raw markdown for the same page is at /docs/<slug>.md. */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const page = findDoc(slug);
  if (!page) return { title: "Docs" };
  return { title: `${page.title} · imaji docs`, description: page.description };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = await loadBySlug(slug);
  if (!doc) notFound();

  const { page, heading, markdown } = doc;
  const groups = navGroups();
  const near = adjacent(slug);

  return (
    <>
      <DocsPick groups={groups} here={page.title} />

      <DocsContent heading={heading} markdown={markdown} />

      <p className="docs-source">
        <span>
          Source:{" "}
          <a href={page.sourceUrl} target="_blank" rel="noreferrer">
            {page.file}
          </a>
          <span aria-hidden> &#8599;</span>
        </span>
        <a href={`/docs/${page.slug}.md`} className="docs-raw">
          Read it as markdown
        </a>
      </p>

      <DocsPrevNext prev={near.prev} next={near.next} />
    </>
  );
}
