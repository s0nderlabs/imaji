import Link from "next/link";

import DocsPick from "@/components/docs/DocsPick";
import { navGroups, siteVersion } from "@/lib/docs";

/* The front of the docs: every page there is, in the order they are meant to
   be read, with the line that says what each one covers. */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Docs",
  description:
    "Documentation for imaji, one release in, a whole launch kit out.",
};

export default async function DocsIndex() {
  const groups = navGroups();
  const version = await siteVersion();

  return (
    <>
      <DocsPick groups={groups} here="All pages" />

      <div className="docs-lead">
        <h1>Documentation</h1>
        <p>
          Documentation for imaji, one release in, a whole launch kit out. Every
          page here is a file in the repository, read as it is on disk, so what
          you are reading and what ships are the same words.
        </p>
        {version ? (
          <p className="docs-lead-ver">
            <span className="ver">v{version}</span>
          </p>
        ) : null}
      </div>

      <div className="docs-index">
        {groups.map((group) => (
          <section key={group.name}>
            <h2>{group.name}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link href={`/docs/${item.slug}`}>
                    <b>{item.title}</b>
                    <span>{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
