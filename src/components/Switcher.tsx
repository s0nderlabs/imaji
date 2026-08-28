"use client";

import { useEffect, useId, useRef, useState } from "react";

/* One panel at a time. The tabs are words in a row with one indicator that
   glides under the chosen one; the panel fades in over 220 ms. Arrow keys
   move between tabs, so it is a real tablist and not a row of buttons. */
export default function Switcher({
  tabs,
  initial = 0,
}: {
  tabs: Array<{ key: string; label: string; node: React.ReactNode }>;
  initial?: number;
}) {
  const base = useId();
  const [active, setActive] = useState(initial);
  const list = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ x: number; w: number; y: number } | null>(null);

  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!el) return;
    setMark({ x: el.offsetLeft, w: el.offsetWidth, y: el.offsetTop + el.offsetHeight + 4 });
  }, [active, tabs.length]);

  useEffect(() => {
    function onResize() {
      const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
      if (el) setMark({ x: el.offsetLeft, w: el.offsetWidth, y: el.offsetTop + el.offsetHeight + 4 });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    list.current?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus();
  }

  const current = tabs[active] ?? tabs[0];

  return (
    <div className="fd-switch">
      <div
        className="fd-tabs"
        role="tablist"
        aria-label="The pieces of the kit"
        ref={list}
        onKeyDown={onKey}
        style={
          mark
            ? ({ "--mx": `${mark.x}px`, "--mw": `${mark.w}px`, "--my": `${mark.y}px` } as React.CSSProperties)
            : undefined
        }
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            data-i={i}
            id={`${base}-t${i}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? "is-on" : undefined}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
        <span className="fd-tabmark" aria-hidden data-ready={mark ? "" : undefined} />
      </div>
      <div
        className="fd-panel"
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-t${active}`}
        key={current.key}
      >
        {current.node}
      </div>
    </div>
  );
}
