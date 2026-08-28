"use client";

import { useEffect, useRef, useState } from "react";

/* A silent film that plays itself, and parks at a still when the reader has
   asked for less motion. The optional offset keeps the specimen in the kit a
   few seconds out of phase with the poster behind the fold, so the same ten
   seconds are never showing the same frame twice on one screen. */
export default function FilmPlayer({
  src,
  poster,
  label,
  offset = 0,
  className = "",
}: {
  src: string;
  poster?: string;
  label: string;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    /* the still on top goes when there is a real frame underneath it, so
       the frame arrives as a fade rather than a black flash */
    const reveal = () => setReady(true);
    if (video.readyState >= 2) reveal();
    else {
      video.addEventListener("loadeddata", reveal, { once: true });
      video.addEventListener("playing", reveal, { once: true });
    }

    const park = () => {
      try {
        video.currentTime = offset;
      } catch {
        /* the metadata is not in yet; the listener below does it */
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      if (video.readyState >= 1) park();
      else video.addEventListener("loadedmetadata", park, { once: true });
      return;
    }

    const seek = () => {
      if (video.currentTime < 0.2) park();
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });

    const playing = video.play();
    if (playing && typeof playing.catch === "function") {
      playing.catch(() => {
        /* a browser that refuses to autoplay shows the poster, which is the
           same film's first frame */
      });
    }
  }, [offset, src]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={label}
      />
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="fd-still"
          src={poster}
          alt=""
          aria-hidden
          data-gone={ready ? "" : undefined}
        />
      ) : null}
    </>
  );
}
