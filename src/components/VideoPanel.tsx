"use client";

import { useEffect, useRef, useState } from "react";
import type { FilmStatus, VideoKind } from "@/lib/store";

import LoopCut from "./LoopCut";

const POLL_MS = 5000;
const MAX_POLLS = 72; // six minutes, then stop asking

function isPending(s: FilmStatus) {
  return s === "queued" || s === "rendering";
}

type MetaShape = {
  status?: Partial<Record<VideoKind, FilmStatus>>;
  errors?: Partial<Record<VideoKind, string>>;
  error?: string;
};

/* One video cut on the kit page: the film, its vertical twin, or the launch
   video. All three render in the background and report through the same
   meta.json, so the only things that change per cut are which status field to
   watch, what to call it, and what shape the frame is.

   The whole figure lives here rather than only the frame, because the caption
   has to tell the same story as the frame while the render is still running. */
export default function VideoPanel({
  kind,
  noun,
  metaHref,
  videoHref,
  posterHref,
  initialStatus,
  initialError,
  aspect = "video",
  note,
  wide = false,
  mode = "loop",
}: {
  kind: VideoKind;
  noun: string;
  metaHref: string;
  videoHref: string;
  posterHref?: string | null;
  initialStatus: FilmStatus;
  initialError?: string;
  aspect?: "video" | "portrait";
  note?: string;
  wide?: boolean;
  /** "loop": a short cut that plays itself, silent, no chrome.
      "cue": a longer film that waits behind its first frame until asked. */
  mode?: "loop" | "cue";
}) {
  const [status, setStatus] = useState<FilmStatus>(initialStatus);
  const [error, setError] = useState<string | undefined>(initialError);
  const [gaveUp, setGaveUp] = useState(false);
  const [started, setStarted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  /* the effect re-runs when the status moves queued -> rendering, so the
     count has to live outside it or the six-minute give-up becomes twelve */
  const polls = useRef(0);

  useEffect(() => {
    if (!isPending(status)) return;
    let alive = true;
    const id = setInterval(async () => {
      polls.current += 1;
      if (polls.current > MAX_POLLS) {
        clearInterval(id);
        if (alive) setGaveUp(true);
        return;
      }
      try {
        const res = await fetch(`${metaHref}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!alive || !data || typeof data !== "object") return;
        const meta = data as MetaShape;
        const next = meta.status?.[kind];
        const err = meta.errors?.[kind] ?? meta.error;
        if (next) setStatus(next);
        if (err) setError(err);
      } catch {
        // A missed poll is not worth showing. The next one will do.
      }
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [status, metaHref, kind]);

  if (status === "none") return null;

  const frame = `frame ${aspect === "portrait" ? "frame-tall" : "frame-wide"}${
    status === "failed" ? " is-failed" : ""
  }`;
  const caption =
    status === "done"
      ? note
        ? `The ${noun}, ${note}`
        : `The ${noun}`
      : status === "failed"
        ? `The ${noun} did not render`
        : `The ${noun}, rendering`;

  return (
    <figure
      className={
        [wide ? "wide" : "", aspect === "portrait" ? "tall" : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      <div className={frame}>
        {status === "done" ? (
          mode === "cue" ? (
            <>
              <video
                ref={video}
                controls={started}
                muted
                playsInline
                preload="metadata"
                poster={posterHref ?? undefined}
                src={videoHref}
                onPlay={() => setStarted(true)}
              />
              {started ? null : (
                <button
                  type="button"
                  className="frame-cue"
                  onClick={() => {
                    setStarted(true);
                    void video.current?.play();
                  }}
                >
                  <b>
                    <i aria-hidden />
                    Play the {noun}
                  </b>
                </button>
              )}
            </>
          ) : (
            <LoopCut
              src={videoHref}
              poster={posterHref ?? undefined}
              label={`The ${noun}`}
            />
          )
        ) : status === "failed" ? (
          /* the caption already names what failed, so this says only why */
          <div className="frame-hold">
            <p>{error ?? "Everything else in this kit is ready."}</p>
          </div>
        ) : (
          <div className="frame-hold">
            <span className="px" aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <b>
              {gaveUp ? `Still rendering the ${noun}` : `Rendering the ${noun}`}
            </b>
            <p>
              {gaveUp
                ? "Longer than expected. Reload the page to check again."
                : "A couple of minutes. It appears here on its own."}
            </p>
          </div>
        )}
      </div>
      <figcaption>
        <span>{caption}</span>
        {status === "done" ? (
          <a
            href={videoHref}
            target="_blank"
            rel="noreferrer noopener"
            className="quiet-link"
          >
            Open
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
