import Link from "next/link";

import DocsNav from "@/components/docs/DocsNav";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import { navGroups, siteVersion } from "@/lib/docs";

import "./docs.css";

/* The docs sit on the same paper as the rest of imaji and borrow every colour
   from globals.css, so whatever the theme does there happens here too. The bar
   carries the mark, where you are, and the version; the rail carries the
   reading order. */

export const metadata = {
  title: "Docs",
  description:
    "Documentation for imaji, one release in, a whole launch kit out.",
};

export default async function DocsLayout({ children }: LayoutProps<"/docs">) {
  const groups = navGroups();
  const version = await siteVersion();

  return (
    <div className="docs">
      <header className="docs-bar">
        <div className="docs-bar-in">
          <div className="docs-brand">
            <Link href="/" className="mark" aria-label="imaji, home">
              <Wordmark />
            </Link>
            <Link href="/docs" className="docs-brand-here">
              Docs
            </Link>
            {version ? <span className="ver">v{version}</span> : null}
          </div>
          <div className="docs-bar-right">
            <ThemeToggle />
            <a
              href="https://github.com/s0nderlabs/imaji"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="docs-shell">
        <aside className="docs-rail">
          <div className="docs-rail-in">
            <DocsNav groups={groups} />
          </div>
        </aside>
        {/* Cloudflare rewrites anything that looks like an email address, and
           "minds-cli@0.1.4" does. These markers tell it to leave the docs alone. */}
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }}
        />
        <div className="docs-col">{children}</div>
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }}
        />
      </div>

      <footer className="docs-foot">
        <div className="docs-foot-in">
          <span>imaji, Apache-2.0</span>
          <nav>
            <a href="/llms.txt">llms.txt</a>
            <a href="/llms-full.txt">llms-full.txt</a>
            <a href="/agents.md">agents.md</a>
            <a href="/job.md">job.md</a>
            <a href="/imaji.yml">imaji.yml</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
