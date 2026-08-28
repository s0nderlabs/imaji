"use client";

/* Light or dark, in one word. The word names the theme you would land in,
   and which word shows is decided in CSS from the same three conditions the
   palette uses, so there is nothing to hydrate and nothing to flash: the
   inline script in the layout has already stamped <html> before paint. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const stamped = root.getAttribute("data-theme");
    const current =
      stamped === "dark" || stamped === "light"
        ? stamped
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("imaji-theme", next);
    } catch {
      /* a private window is allowed to forget; the page still turns */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fd-quiet theme-toggle ${className}`}
      aria-label="Switch between the light and dark pages"
    >
      <span className="theme-dark" title="Dark">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path
            d="M13.2 10.4A5.6 5.6 0 0 1 5.6 2.8a5.6 5.6 0 1 0 7.6 7.6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="theme-light" title="Light">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}
