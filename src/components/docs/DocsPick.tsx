"use client";

import { useRef } from "react";

import DocsNav from "./DocsNav";
import type { NavGroup } from "@/lib/docs";

/* The phone's nav: the page you are on, and every other page one tap away.
   A plain <details>, so it works before hydration and closes itself once a
   link has been followed. */
export default function DocsPick({
  groups,
  here,
}: {
  groups: NavGroup[];
  here: string;
}) {
  const box = useRef<HTMLDetailsElement>(null);

  return (
    <details className="docs-pick" ref={box}>
      <summary>
        <span>{here}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 6.5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="docs-pick-body">
        <DocsNav
          groups={groups}
          onNavigate={() => {
            if (box.current) box.current.open = false;
          }}
        />
      </div>
    </details>
  );
}
