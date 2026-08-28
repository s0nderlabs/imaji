import CopyButton from "./CopyButton";

/* What a copy button copies, shown next to the button that copies it.

   A sheet has a title bar (the file it becomes, one fact about it, and the
   action) and a body that holds the real text: prose for the job, code for
   the workflow, a quote for the prompt. The body is bounded and scrolls
   inside itself, so the page stays a page while nothing is hidden. */
export default function CopySheet({
  file,
  fact,
  text,
  label,
  kind,
  disabled = false,
}: {
  /** the name the text takes once it is pasted, e.g. .github/workflows/imaji.yml */
  file: string;
  /** one true thing about it, e.g. "145 lines" */
  fact?: string;
  text: string;
  label: string;
  kind: "prose" | "code" | "quote";
  disabled?: boolean;
}) {
  return (
    <div className={`sheet sheet-${kind}${disabled ? " is-off" : ""}`}>
      <div className="sheet-bar">
        <span className="sheet-file">
          <svg viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4 1.5h5.2L13 5.3V13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13V3A1.5 1.5 0 0 1 4.5 1.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M9 1.5V5.5h4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <code>{file}</code>
          {fact ? <span className="sheet-fact">{fact}</span> : null}
        </span>
        <CopyButton
          text={text}
          label={label}
          variant="primary"
          icon={false}
          className={disabled ? "pointer-events-none opacity-40" : ""}
        />
      </div>
      <div className="sheet-body" tabIndex={0}>
        {kind === "code" ? (
          <pre>
            <code>{text}</code>
          </pre>
        ) : kind === "quote" ? (
          <blockquote>{text}</blockquote>
        ) : (
          <div className="sheet-prose">{text}</div>
        )}
      </div>
    </div>
  );
}
