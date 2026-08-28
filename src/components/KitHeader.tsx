import Link from "next/link";

import ThemeToggle from "./ThemeToggle";
import Wordmark from "./Wordmark";

/* Quiet chrome: the mark, the repo these kits came from, and the theme
   toggle, so a visitor landing on a shared kit link can switch too. */
export default function KitHeader({ repo }: { repo?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Link href="/" aria-label="imaji" className="mark">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-5">
        {repo ? <span className="t-sm text-ink-2">{repo}</span> : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
