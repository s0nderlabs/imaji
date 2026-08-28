# The six outputs

A kit has up to six outputs. The Mind picks which ones a release earns and
writes every word in each; imaji renders and stores what it is given. Nothing
here is a setting the renderer decides on its own: every value below arrives in
the kit JSON the Mind wrote ([SPEC](SPEC.md) section 3) or has a documented
default.

`outputs` in the kit JSON is the list the Mind chose. Missing means the
original four (`x`, `linkedin`, `card`, `film`); the two video cuts are opt-in
per release, never a default. A release that earns nothing is a valid kit: the
Mind says so in `skipped`, in the user's voice, and the workflow succeeds.

| Output | Shape | Rendered how | What the Mind writes |
| --- | --- | --- | --- |
| `x` | one tweet under 280 characters, plus a three-part thread | not rendered, it is text on the kit page with copy buttons | `tweet`, `thread` |
| `linkedin` | one post, a few short paragraphs | not rendered, text with a copy button | `linkedin` |
| `card` | 1200 x 630 PNG | one still frame, screenshotted from HTML | `card.headline` (under 8 words), `card.subline` (under 14), `card.accentWord` (one word of the headline) |
| `film` | 3840x2160 MP4, 10.000 s, 60 fps | frame by frame from HTML into ffmpeg | `film.lines` (three short lines about what changed), `film.closing` (version and where to get it) |
| `vertical` | 2160x3840 MP4, 10.000 s, 60 fps | the film composition again, `orientation: "portrait"` | nothing beyond the word `vertical` in `outputs` |
| `launch` | 3840x2160 MP4, up to 45 s, 60 fps | one scene per storyboard beat, from HTML | `launch.beats`, the storyboard (below) |

## How a video is made

A composition is one HTML file with one paused GSAP timeline registered as
`window.__timelines.main`. The renderer pins the viewport to the stage, takes
the timeline's duration and splits `ceil(duration * fps)` frames into
contiguous ranges, one per worker process. Each worker drives its own Chrome
at `deviceScaleFactor` 2, which is what makes a 1920x1080 stage come out at
3840x2160, seeks `t = frame / fps`, screenshots every frame in its range and
pipes the PNGs into its own ffmpeg (`libx264`, `crf 18`, `yuv420p`, one
keyframe a second). The parent concat-copies the segments and writes the
finished mp4 with `+faststart`, so no frame is ever staged as a PNG on disk
and the wall clock divides by the number of workers. Defaults: scale 2,
60 fps, cores minus two workers capped at eight, all three settable through
`IMAJI_RENDER_SCALE`, `IMAJI_RENDER_FPS` and `IMAJI_RENDER_SHARDS`.

Nothing inside a composition may call `Date.now`, `Math.random` or the
network, so two renders of the same kit look the same frame for frame. GSAP
and the fonts are vendored.

The card is the same machinery stopped at the rest frame: load, wait for
`document.fonts.ready`, screenshot the stage at `deviceScaleFactor: 1`. It
stays 1200 x 630, the size every social preview asks for.

The card renders synchronously, so `POST /api/render` answers with a real
image. Each video renders in the background with its own in-flight slot per
tag, reporting through `meta.json.status.{film,vertical,launch}` as
`queued -> rendering -> done | failed`. The kit page polls that file every
five seconds, so a video appears without a reload.

## The launch storyboard

`launch` is the only output that needs a shape rather than a sentence. It is a
30 to 45 second video, and the Mind directs it: it writes `launch.beats`, three
to ten of them, choosing the order, the pictures and every line. Five beat types, each with a fixed length (`LAUNCH_DURATIONS` in
`src/lib/kit.ts`, which the composition has to agree with or the mp4 comes out
short):

| Beat | Length | Needs | What it looks like |
| --- | --- | --- | --- |
| wordmark | 2.5 s | nothing, it is always inserted first | the brand mark or name, rising |
| `text` | 4 s | `headline` (under 10 words), optional `accentWord` from that headline, optional `sub` (under 14 words) | one line held on the stage, one word in the accent |
| `image` | 4.5 s | an https `src`, optional `caption` (under 12 words) | a picture from the repository, slowly scaled |
| `capture` | 5 s | an https `url`, optional `caption` | a live screenshot of that page, panned |
| `lines` | 1.8 s plus 1.2 s a line, 4 lines max | `lines` | what changed, one line rising after another |
| `signoff` | 3.5 s | `closing` | the closing line, the version, the URL, the mark |

Three rules the renderer applies so a launch video always has a shape. They
are the only decisions on this page that are not the Mind's, and each one is a
fallback rather than a choice:

- A launch opens on identity and closes on where to get it. If the first beat
  is not `text`, one is inserted from `card.headline`; if the last is not
  `signoff`, one is appended from `film.closing`, or the brand name plus the
  version.
- Past 45 s, the beats just before the sign-off are dropped, with a warning.
- An unknown beat type, or a beat missing what it needs, is dropped with a
  warning rather than failing the video.

## Pictures reach the composition as data URLs

The composition never fetches anything. Before Chrome opens, `image` and
`capture` beats are resolved into data URLs:

- an `image` beat goes through the same public-address guard as
  `brand.logoUrl`: png, jpeg, webp or svg, three redirects, 10 s, 6 MB, and
  private, loopback and link-local addresses refused;
- a `capture` beat is screenshotted by `src/render/capture.ts` in headless
  Chrome at 1920x1080, the first fold plus a full-page shot capped at 2160 px
  tall, JPEG quality 85, 20 s a capture.

Either failure degrades that one beat to a `text` beat whose headline is the
caption, or the host if there was no caption, with a warning in the render log.
One unreachable screenshot never costs you the video.

## What it costs

Measured on the host that runs imaji (an M-series Mac with Chrome and ffmpeg),
from the timestamps of imaji's own kits:

| Output | Time after the POST |
| --- | --- |
| card | 1 to 2 s |
| film | about 12 to 13 s |
| film plus vertical cut | about 17 s |
| launch video, including one live capture | about 55 s |

The spec's ceilings are looser than the measurements: film and vertical under
three minutes each, a launch video under five including its captures.

## Where they land

```
/k/<readId>/<tag>                                 the kit page
/api/kits/<readId>/<tag>/card.png                 1200x630
/api/kits/<readId>/<tag>/film.mp4                 3840x2160
/api/kits/<readId>/<tag>/film-vertical.mp4        2160x3840
/api/kits/<readId>/<tag>/launch.mp4               3840x2160
/api/kits/<readId>/<tag>/kit.json                 the normalised kit
/api/kits/<readId>/<tag>/meta.json                repo, tag, receivedAt, status
```

`readId` is `sha256(kitToken)` truncated to 24 hex characters, so a kit link
can be shared without handing anyone the ability to overwrite the kit. Every
mp4 answers byte-range requests; every file is `private, no-store` and the kit
pages are `noindex`.
