import type { Meta } from "@/lib/store";

/** The Mind is asked for literal \n escapes inside JSON strings, so kit copy
 *  arrives with backslash-n rather than a real newline. src/lib/kit.ts already
 *  undoes that ONCE on the way in, before the kit is stored, so this is a
 *  pass-through: a second pass would eat a genuine backslash-n that survived
 *  the first, for example inside a code sample in a tweet. */
export function unescapeCopy(input: string): string {
  return input;
}

export function paragraphs(input: string): string[] {
  return unescapeCopy(input)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Day and month only, for a row that already sits under a dated heading. */
export function dayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function isOnboarding(tag: string): boolean {
  return tag.toLowerCase() === "onboarding";
}

/** "the card, the film and the vertical cut", from what actually rendered. */
const RENDERED_NOUN: Record<string, string> = {
  card: "the card",
  film: "the film",
  vertical: "the vertical cut",
  launch: "the launch video",
};

function sentenceList(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** How this kit came to exist, in one warm sentence, built only from what
 *  the store actually knows. Nothing here is invented: no number appears
 *  unless it is on disk, and the earlier version is named only when there
 *  really is an earlier kit. */
export function madeSentence(meta: Meta | null, previousTag?: string): string {
  const when = meta ? ` on ${shortDate(meta.receivedAt)}` : "";

  if (meta && isOnboarding(meta.tag)) {
    return `Your Mind read the repo and proposed this brand${when}. It is the sample to correct, not a release.`;
  }

  const read = previousTag
    ? `Your Mind read the release, remembered ${previousTag}, and wrote this kit${when}.`
    : `Your Mind read the release and wrote this kit${when}.`;

  if (!meta) return read;

  const done = (["card", "film", "vertical", "launch"] as const)
    .filter((k) => (k === "card" ? meta.status.card : meta.status[k]) === "done")
    .map((k) => RENDERED_NOUN[k]);

  if (done.length === 0) return read;
  return `${read} imaji rendered ${sentenceList(done)}.`;
}

/** The headline with one word in the accent, exactly as the Mind asked for.
 *  Returns the three pieces so the caller can wrap the middle one; the word
 *  has already been checked against the headline by src/lib/kit.ts. */
export function splitAccentWord(
  headline: string,
  accentWord?: string,
): [string, string, string] | null {
  if (!accentWord) return null;
  const at = headline.toLowerCase().indexOf(accentWord.toLowerCase());
  if (at < 0) return null;
  return [
    headline.slice(0, at),
    headline.slice(at, at + accentWord.length),
    headline.slice(at + accentWord.length),
  ];
}

/** A fragment the Mind wrote as a bullet, read back as a sentence. */
export function asSentence(input: string): string {
  const text = unescapeCopy(input).trim();
  if (!text) return text;
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
