"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavGroup } from "@/lib/docs";

/* One list of links, used twice: sticky in the rail on a desktop, folded into
   a disclosure at the top of the column on a phone. The current page is the
   only thing on either that carries the accent. */
export default function DocsNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = pathname?.match(/^\/docs\/([^/]+)/)?.[1] ?? null;

  return (
    <nav className="docs-nav" aria-label="Documentation">
      <Link
        href="/docs"
        className="docs-nav-all"
        aria-current={pathname === "/docs" ? "page" : undefined}
        onClick={onNavigate}
      >
        All pages
      </Link>
      {groups.map((group) => (
        <div key={group.name} className="docs-nav-group">
          <div className="docs-nav-name">{group.name}</div>
          <ul>
            {group.items.map((item) => {
              const here = item.slug === current;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/docs/${item.slug}`}
                    aria-current={here ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
