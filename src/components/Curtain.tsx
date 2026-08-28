"use client";

import { useEffect } from "react";

/* The scroll package. Curtain: the hero stays pinned while everything after
   it slides up over it as one sheet; as it is covered the hero dims and its
   copy lifts, driven by one number (--cover) written on a frame. Smooth: on a
   wheel the page lerps toward a target instead of jumping, time-based so 60
   and 120 Hz feel the same; touch keeps its native momentum. Reduced motion
   turns both off. */
export default function Curtain() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>(".fd-fold");
    if (!hero) return;
    root.classList.add("fd-curtain");

    /* ---- curtain: --cover on the hero ---- */
    let queued = false;
    const tick = () => {
      queued = false;
      const cover = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.9)));
      hero.style.setProperty("--cover", cover.toFixed(3));
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(tick);
      }
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* ---- smooth: wheel deltas move a target, the page lerps toward it ---- */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let target = 0;
    let current = 0;
    let raf: number | null = null;
    let last = 0;
    const maxY = () => root.scrollHeight - window.innerHeight;
    const loop = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      const k = 1 - Math.pow(0.9, dt / 16.7);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        raf = null;
        last = 0;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(loop);
    };
    const go = () => {
      if (raf === null) {
        current = window.scrollY;
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!fine || e.ctrlKey) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (raf === null) target = window.scrollY;
      target = Math.max(0, Math.min(maxY(), target + d));
      go();
    };
    const onNativeScroll = () => {
      if (raf === null) target = current = window.scrollY;
    };
    const onClick = (e: MouseEvent) => {
      if (!fine) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      target = Math.max(0, Math.min(maxY(), el.getBoundingClientRect().top + window.scrollY));
      go();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onNativeScroll);
      document.removeEventListener("click", onClick);
      if (raf !== null) cancelAnimationFrame(raf);
      root.classList.remove("fd-curtain");
    };
  }, []);
  return null;
}
