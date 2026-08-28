"use client";

import { useEffect, useRef, useState } from "react";

/* A short silent cut that plays itself inside a kit frame: no browser chrome,
   no controls, the same treatment the front door gives its film. The still on
   top goes only once there is a real frame underneath, so the cut arrives as a
   fade instead of a black flash, and a reader who asked for less motion gets a
   parked frame instead of a loop. */
export default function LoopCut({
  src,
  poster,
  label,
}: {
  src: string;
  poster?: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reveal = () => setReady(true);
    if (video.readyState >= 2) reveal();
    else {
      video.addEventListener("loadeddata", reveal, { once: true });
      video.addEventListener("playing", reveal, { once: true });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    const playing = video.play();
    if (playing && typeof playing.catch === "function") {
      playing.catch(() => {
        /* a browser that refuses to autoplay parks on the first frame, which
           is the same picture the loop opens on */
      });
    }
  }, [src]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
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
          className="frame-still"
          src={poster}
          alt=""
          aria-hidden
          data-gone={ready ? "" : undefined}
        />
      ) : null}
    </>
  );
}
