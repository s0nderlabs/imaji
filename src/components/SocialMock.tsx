/* The copy the Mind wrote, shown the way it will look where it is going.

   These are faithful mocks of an X post, an X thread and a LinkedIn post:
   the platforms' own type stacks, colours, radii and action rows, with the
   kit's own copy and card dropped in. Nothing is invented: no counts, no
   reactions, no followers. A post that has just been written has none. */

import type { ReactNode } from "react";

/* ------------------------------------------------------------------ logos */
export function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LinkedInLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ text */
const URL_RE = /((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s,)]*)?)/gi;

/** URLs and bare domains become links, the way both feeds render them. */
function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const raw = m[0];
    const trimmed = raw.replace(/[.,]+$/, "");
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    out.push(
      <a key={`${at}-${trimmed}`} href={href} target="_blank" rel="noreferrer noopener">
        {trimmed.replace(/^https?:\/\//i, "")}
      </a>,
    );
    if (trimmed.length < raw.length) out.push(raw.slice(trimmed.length));
    last = at + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Avatar({ src, name, ground, shape }: { src: string | null; name: string; ground: "dark" | "light"; shape: "round" | "square" }) {
  return (
    <span className={`sm-avatar sm-avatar-${shape} sm-avatar-${ground}`} aria-hidden>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <b>{name.slice(0, 1).toUpperCase()}</b>
      )}
    </span>
  );
}

/** "Aug 28", the way X dates a post older than a day. */
export function xDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

/** "3h" or "2d", the way LinkedIn ages a post. */
export function liAge(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const hours = Math.max(0, Math.floor((Date.now() - then) / 3_600_000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export type Author = {
  name: string;
  handle: string;
  logo: string | null;
  ground: "dark" | "light";
  /** the repo, for LinkedIn's second line */
  sub: string;
};

/* --------------------------------------------------------------------- X */
function XActions() {
  return (
    <div className="x-actions" aria-hidden>
      <span className="x-act">
        <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" /></svg>
      </span>
      <span className="x-act">
        <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
      </span>
      <span className="x-act">
        <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>
      </span>
      <span className="x-act">
        <svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" /></svg>
      </span>
      <span className="x-act x-act-end">
        <svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z" /></svg>
        <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" /></svg>
      </span>
    </div>
  );
}

function XHead({ author, when }: { author: Author; when: string | null }) {
  return (
    <div className="x-head">
      <span className="x-name">{author.name}</span>
      <span className="x-handle">
        @{author.handle}
        {when ? (
          <>
            <span className="x-dot">·</span>
            {when}
          </>
        ) : null}
      </span>
      <span className="x-more" aria-hidden>
        <svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
      </span>
    </div>
  );
}

/** One X post, the card as its attached media. */
export function XPost({
  author,
  text,
  when,
  media,
  mediaAlt,
}: {
  author: Author;
  text: string;
  when: string | null;
  media?: string | null;
  mediaAlt?: string;
}) {
  return (
    <article className="sm x-post" aria-label="The tweet, as it will look on X">
      <div className="x-row">
        <Avatar src={author.logo} name={author.name} ground={author.ground} shape="round" />
        <div className="x-main">
          <XHead author={author} when={when} />
          <p className="x-text">{linkify(text)}</p>
          {media ? (
            <div className="x-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media} alt={mediaAlt ?? ""} width={1200} height={630} />
            </div>
          ) : null}
          <XActions />
        </div>
      </div>
    </article>
  );
}

/** A thread: each part is a post of its own, joined by the line X draws
 *  between an author's consecutive posts. */
export function XThread({
  author,
  parts,
  when,
  media,
  mediaAlt,
}: {
  author: Author;
  parts: string[];
  when: string | null;
  media?: string | null;
  mediaAlt?: string;
}) {
  return (
    <div className="sm x-thread" role="group" aria-label="The thread, as it will look on X">
      {parts.map((part, i) => {
        const last = i === parts.length - 1;
        return (
          <article className={`x-post${last ? "" : " x-joined"}`} key={i}>
            <div className="x-row">
              <span className="x-rail">
                <Avatar src={author.logo} name={author.name} ground={author.ground} shape="round" />
                {last ? null : <i className="x-line" aria-hidden />}
              </span>
              <div className="x-main">
                <XHead author={author} when={when} />
                <p className="x-text">{linkify(part)}</p>
                {i === 0 && media ? (
                  <div className="x-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media} alt={mediaAlt ?? ""} width={1200} height={630} />
                  </div>
                ) : null}
                <XActions />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- LinkedIn */
function LiActions() {
  return (
    <div className="li-actions" aria-hidden>
      <span className="li-act">
        <svg viewBox="0 0 24 24"><path d="M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74l-.49-1.47A2.76 2.76 0 0010.76 1 2.75 2.75 0 008 3.74v1.12a9.19 9.19 0 00.46 2.85L8.89 9H4.12A2.12 2.12 0 002 11.12a2.16 2.16 0 00.92 1.76A2.11 2.11 0 002 14.62a2.14 2.14 0 001.28 2 2 2 0 00-.28 1 2.12 2.12 0 002.12 2.12h1.7a2.1 2.1 0 001.1 1.24 2.1 2.1 0 00.89.2l.06-.01A2.13 2.13 0 0010 21h4.34a2.13 2.13 0 002.12-2.12V11h3zm-5 7.88a.13.13 0 01-.12.12H10a.13.13 0 01-.12-.12V11.2l.04-.04a5.21 5.21 0 00.95-1.46l.44-1.32A7.13 7.13 0 0010 4.86V3.74a.75.75 0 011.5 0l.49 1.47a9.06 9.06 0 002.18 3.53L16.46 11h.04v7.88z" /></svg>
        Like
      </span>
      <span className="li-act">
        <svg viewBox="0 0 24 24"><path d="M7 9h10v1H7zm0 4h7v-1H7zm16-2a6.78 6.78 0 01-2.84 5.61L12 20v-4H8A7 7 0 018 2h8a7 7 0 017 7zm-2 0a5 5 0 00-5-5H8a5 5 0 000 10h6v2.28L19 15a4.79 4.79 0 002-4z" /></svg>
        Comment
      </span>
      <span className="li-act">
        <svg viewBox="0 0 24 24"><path d="M13.96 5H6c-.55 0-1 .45-1 1v10H3V6c0-1.66 1.34-3 3-3h7.96L12 0h2.37L17 4l-2.63 4H12l1.96-3zm5.54 3H21v10c0 1.66-1.34 3-3 3h-7.96L12 24H9.63L7 20l2.63-4H12l-1.96 3H18c.55 0 1-.45 1-1V8h.5z" /></svg>
        Repost
      </span>
      <span className="li-act">
        <svg viewBox="0 0 24 24"><path d="M21 3L0 10l15.7 5.3L21 3zm-3.26 3.55l-8.6 6.74-6.13-2.07 14.73-4.67zM13.1 16.6L21 3l2.99 15.5L13.1 16.6z" /></svg>
        Send
      </span>
    </div>
  );
}

function GlobeGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="li-globe">
      <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 01.88-2.83A3 3 0 006 7v1a2 2 0 002 2v2.73A5 5 0 013 8zm7 4.51V11a1 1 0 00-1-1H6a1 1 0 01-1-1V8a1 1 0 011-1h1a1 1 0 001-1V4.16A5 5 0 0113 8a5 5 0 01-3 4.51z" />
    </svg>
  );
}

/** One LinkedIn post. Collapsed the way the feed shows it, with the
 *  platform's own "…more" that opens the rest in place. */
export function LinkedInPost({
  author,
  paragraphs,
  when,
  media,
  mediaAlt,
}: {
  author: Author;
  paragraphs: string[];
  when: string | null;
  media?: string | null;
  mediaAlt?: string;
}) {
  const lead = paragraphs.slice(0, 1);
  const rest = paragraphs.slice(1);
  return (
    <article className="sm li-post" aria-label="The LinkedIn post, as it will look on LinkedIn">
      <div className="li-head">
        <Avatar src={author.logo} name={author.name} ground={author.ground} shape="square" />
        <div className="li-who">
          <span className="li-name">{author.name}</span>
          <span className="li-sub">{author.sub}</span>
          <span className="li-when">
            {when ?? "Just now"}
            <span className="li-dot">•</span>
            <GlobeGlyph />
          </span>
        </div>
        <span className="li-follow" aria-hidden>
          <svg viewBox="0 0 16 16"><path d="M14 9H9v5H7V9H2V7h5V2h2v5h5z" /></svg>
          Follow
        </span>
      </div>
      <div className="li-body">
        {lead.map((p, i) => (
          <p key={`l${i}`}>{linkify(p)}</p>
        ))}
        {rest.length > 0 ? (
          <details className="li-more">
            <summary>
              <span className="li-ellipsis">…</span>more
            </summary>
            {rest.map((p, i) => (
              <p key={`r${i}`}>{linkify(p)}</p>
            ))}
          </details>
        ) : null}
      </div>
      {media ? (
        <div className="li-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media} alt={mediaAlt ?? ""} width={1200} height={630} />
        </div>
      ) : null}
      <LiActions />
    </article>
  );
}
