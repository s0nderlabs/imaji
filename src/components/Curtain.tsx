"use client";

import { useEffect } from "react";

/* Each page of the front door is pinned as the next one slides over it, and
   while it is being covered it eases back: a little smaller, a little
   dimmer, drifting up slower than the page that covers it. One number per
   page, written on a frame, read by CSS. Reduced motion turns it off. */
export default function Curtain() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pages = Array.from(document.querySelectorAll<HTMLElement>(".fd-page"));
    if (pages.length < 2) return;
    document.documentElement.classList.add("fd-curtain");
    let raf = 0;
    const paint = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const page of pages) {
        if (page.offsetHeight <= vh + 1) page.dataset.pin = "";
        else delete page.dataset.pin;
      }
      for (let i = 0; i < pages.length - 1; i++) {
        const page = pages[i];
        const next = pages[i + 1];
        const cover = next.getBoundingClientRect().top;
        const start = page.getBoundingClientRect().bottom;
        const span = Math.max(1, Math.min(vh, start - cover + vh));
        const p = Math.min(1, Math.max(0, (vh - cover) / span));
        page.style.setProperty("--p", p.toFixed(4));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove("fd-curtain");
    };
  }, []);
  return null;
}
