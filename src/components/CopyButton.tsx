"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Variant = "primary" | "quiet" | "bare" | "link";

function CopyGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-[0.95em]" fill="none" aria-hidden>
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function DoneGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-[0.95em]" fill="none" aria-hidden>
      <path
        d="M3.5 8.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* One action, one label, and a label that flips rather than a toast. Both
   states are laid on top of each other so the button never changes width. */
export default function CopyButton({
  text,
  label = "Copy",
  done = "Copied",
  variant = "quiet",
  icon = true,
  className = "",
}: {
  text: string;
  label?: string;
  done?: string;
  variant?: Variant;
  /** the kit pages want the glyph; the front door's buttons are words */
  icon?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const flash = useCallback((ok: boolean) => {
    setCopied(ok);
    setFailed(!ok);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 1500);
  }, []);

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash(true);
      return;
    } catch {
      // Fall through to the textarea path below.
    }
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      flash(ok);
    } catch {
      flash(false);
    }
  }, [text, flash]);

  const skin =
    variant === "primary"
      ? "btn-primary"
      : variant === "bare"
        ? "btn-bare"
        : variant === "link"
          ? "btn-link"
          : "btn-quiet";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${skin} ${copied ? "is-done" : ""} ${className}`}
      aria-label={label}
    >
      <span className="swap">
        <span className="a">
          {icon ? <CopyGlyph /> : null}
          {failed ? "Copy failed" : label}
        </span>
        <span className="b" aria-hidden={!copied}>
          {icon ? <DoneGlyph /> : null}
          {done}
        </span>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? done : failed ? "Copy failed" : ""}
      </span>
    </button>
  );
}
