import Link from "next/link";

import type { Adjacent } from "@/lib/docs";

/* The docs are meant to be read in order, so the end of a page offers the one
   before and the one after rather than sending the reader back to the rail. */
export default function DocsPrevNext({ prev, next }: Adjacent) {
  if (!prev && !next) return null;
  return (
    <nav className="docs-adj" aria-label="Nearby pages">
      {prev ? (
        <Link href={`/docs/${prev.slug}`} className="prev">
          <div className="dir">Back</div>
          <div className="to">{prev.title}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/docs/${next.slug}`} className="next">
          <div className="dir">Next</div>
          <div className="to">{next.title}</div>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
