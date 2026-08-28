import {
  WORDMARK_DOTS,
  WORDMARK_INK,
  WORDMARK_TRANSFORM,
  WORDMARK_VIEWBOX,
} from "./wordmark-paths";

/* The hand lettered mark, inline rather than an <img> so `color` drives the
   ink and the two dots stay Tigerlily wherever it lands. Size it with
   font-size on the wrapper (`.mark`) or with a height class. */
export default function Wordmark({
  className = "",
  title = "imaji",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={`${className} w-auto`}
      role="img"
      aria-label={title}
    >
      <g transform={WORDMARK_TRANSFORM}>
        <path d={WORDMARK_INK} fill="currentColor" fillRule="evenodd" />
      </g>
      <g transform={WORDMARK_TRANSFORM}>
        <path d={WORDMARK_DOTS} fill="var(--accent)" fillRule="evenodd" />
      </g>
    </svg>
  );
}
