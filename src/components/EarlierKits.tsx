"use client";

import Link from "next/link";
import { useState } from "react";

export type EarlierKit = {
  tag: string;
  href: string;
  headline: string;
  date: string;
  onboarding: boolean;
};

function summarise(items: EarlierKit[]): string {
  const names = items.map((k) =>
    k.onboarding ? "the onboarding sample" : k.tag,
  );
  if (names.length === 1) return names[0];
  if (names.length <= 3)
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

function Row({ kit }: { kit: EarlierKit }) {
  return (
    <Link href={kit.href} className="release">
      <span className="l">
        <b>{kit.headline}</b>
        {kit.onboarding ? (
          <span>The sample your Mind proposed before the first release.</span>
        ) : null}
      </span>
      <span className="r">
        <span className="ver num">{kit.tag}</span>
        <span className="num">{kit.date}</span>
      </span>
    </Link>
  );
}

/* Everything your Mind made before this one, tidied into a stack so the newest
   kit keeps the room. One click puts them back on the desk. */
export default function EarlierKits({ items }: { items: EarlierKit[] }) {
  const [open, setOpen] = useState(items.length === 1);
  if (items.length === 0) return null;

  if (!open) {
    const layers = Math.min(items.length, 3);
    return (
      <button
        type="button"
        className="stack"
        onClick={() => setOpen(true)}
        aria-expanded={false}
      >
        {Array.from({ length: layers }, (_, i) => (
          <i key={i} aria-hidden />
        ))}
        <span className="lbl">
          <span>
            {items.length} earlier {items.length === 1 ? "kit" : "kits"}
          </span>
          <span>{summarise(items)}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((kit) => (
        <Row key={kit.tag} kit={kit} />
      ))}
      {items.length > 1 ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="quiet-link py-2 text-center t-sm"
        >
          Tuck them away
        </button>
      ) : null}
    </div>
  );
}
