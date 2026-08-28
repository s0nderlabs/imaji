"use client";

import { useEffect } from "react";

/* Sections below the fold rise the first time they are reached.

   The reveal never gates visibility: the veil class is added by script, only
   to things that actually start below the fold, and a timer un-veils
   everything whatever happens. With no JavaScript, a reduced-motion setting
   or a dead observer, the page is simply already there. */
export default function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const all = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const below = all.filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );
    if (below.length === 0) return;

    below.forEach((el) => el.classList.add("fd-veil"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    below.forEach((el) => io.observe(el));

    const safety = setTimeout(() => {
      below.forEach((el) => el.classList.add("in"));
    }, 1800);

    return () => {
      io.disconnect();
      clearTimeout(safety);
      below.forEach((el) => el.classList.add("in"));
    };
  }, []);

  return null;
}
