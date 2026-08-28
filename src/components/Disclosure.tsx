"use client";

import { useId, useState } from "react";

/* A list of claims that open into their explanation. The claim is the row;
   the paragraph unfolds under it (a grid-row animation, so the page never
   jumps) and folds back when tapped again. Several can be open at once;
   nothing is open by default, so the page stays short until a reader asks. */
export default function Disclosure({
  items,
}: {
  items: Array<{ say: string; body: string }>;
}) {
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <ol className="fd-beats">
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const panel = `${base}-p${i}`;
        return (
          <li key={item.say} className={isOpen ? "is-open" : undefined}>
            <button
              type="button"
              className="fd-beat"
              aria-expanded={isOpen}
              aria-controls={panel}
              onClick={() => toggle(i)}
            >
              <span className="fd-say">{item.say}</span>
              <span className="fd-plus" aria-hidden>
                <svg viewBox="0 0 12 12" width="12" height="12">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div className="fd-unfold" id={panel} role="region" aria-hidden={!isOpen}>
              <div className="fd-unfold-in">
                <p>{item.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
