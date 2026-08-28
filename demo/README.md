# The launch video

`demo/out/imaji-launch.mp4`, 1:55, 1920x1080, 30 fps, no audio, no voice over.

The last third of it is a launch video imaji made. Beat nine is `launch.mp4`
out of the v0.3.0 kit, dropped in whole, no overlay, no crop, no speed change.
Everything around it is an HTML composition rendered frame by frame by the
same seek-and-screenshot loop the product uses for its own films, so the whole
thing is deterministic: change one screenshot or one line of copy, re-render,
and every other frame comes back identical.

Two beats are a real screen recording of the Minds app, cropped to the thread
and otherwise untouched. Nothing else here is a recording, and nobody's cursor
appears.

## Two commands

```bash
bun demo/capture.mjs    # gather the assets from the live site and the real kit
bun demo/render.mjs     # render demo/out/imaji-launch.mp4 (about ten minutes)
```

Both need the system Chrome (`CHROME_PATH`, default
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) and `ffmpeg`
and `ffprobe` on `PATH` (`FFMPEG_PATH`, `FFPROBE_PATH` to override).

While iterating, skip the video and take stills instead:

```bash
bun demo/render.mjs --shots            # demo/out/segment-1.png .. segment-12.png
bun demo/render.mjs --at 25,69         # demo/out/at-a-25.png, at-a-69.png
bun demo/render.mjs --part c --at 4    # a still from the end card
```

## What capture.mjs gathers

One headless Chrome, opened once and closed at the end, at a 1440x810
viewport with `deviceScaleFactor: 2`. That is 16:9, so a shot maps onto the
1920x1080 stage with no crop and no distortion, and every glyph lands a third
larger than it would at a 1920 viewport while staying retina sharp.

- `demo/assets/shots/*.png` from `https://imaji.s0nderlabs.xyz`: the kit index
  and the kit page parked at the card, the tweet, the thread and the film. It
  also measures the film's 16:9 box in page pixels, so the composition can
  paint the real film exactly into the frame the page draws for it.
- `demo/assets/frames/frame_001.png` .. `frame_300.png`: every frame of the real
  ten second `film.mp4` of the v0.3.0 kit, extracted with ffmpeg.
- `demo/assets/rec/r1_*.jpg`, `r2_*.jpg`, `r3_*.jpg`: three ranges cut out of
  the screen recording of the real Minds app, cropped to the thread. Set
  `IMAJI_RECORDING` to the source file to cut them again; without it the
  frames already on disk are kept.
- `demo/assets/fonts/`: Manrope and Space Mono, the two faces the Minds app
  itself uses, fetched once so the rebuilt interface renders offline.
- `demo/assets/text.js`: every string the composition puts on screen, read out
  of the file it really lives in (`docs/releases/v0.3.0.md`, `imaji.json`,
  `templates/imaji.yml`), out of a real run's output, or out of the kit the
  Mind wrote. The composition retypes nothing.
- `demo/assets/capture.json`: which kit was filmed and how tall the page was.

Which kit it films is decided by the store, not by hand: the newest
`data/kits/*/v0.3.0/meta.json` wins.

## The composition

`demo/composition/index.html` plus `build.js`, one 1920x1080 stage, one paused
gsap timeline on `window.__timelines.main`. Two parts, selected by the query
string: `?part=a` is everything up to the bridge, `?part=c` is the end card.
`render.mjs` renders both, re-wraps the kit's launch video with the same
encode, and joins the three with the ffmpeg concat demuxer, then checks that
the output's frame count equals the sum of the parts.

It obeys the same rules as the product's compositions: `gsap.set` and
`gsap.fromTo` only, no CSS animations, no rAF, no `Date.now`, no
`Math.random`, no network. Fonts and gsap come from `src/render/vendor/` and
`demo/assets/fonts/`; every image is a local file under `demo/assets/`. The
faces are loaded and checked before the timeline is built, because the caret
is placed from measured character boxes and fallback metrics would leave it
adrift.

Real footage is painted onto a `<canvas>`. Frames are fetched on demand:
`render.mjs` awaits `window.__prepare(t)` before every screenshot, and the
reel keeps a sliding window of about seventy decoded images rather than
holding hundreds at once. `drawImage` is synchronous and the decode is awaited
first, so nothing can race the screenshot and a scrub in either direction
lands on the exact frame.

Beat four rebuilds the Minds interface at 1:1 from the recording: the icon
rail, the sidebar, the header, the Today divider, the outbound bubble, the
avatar, the meta rows and the composer, in the app's own colours and in
Manrope, with the kit JSON in a Space Mono code block.

## The beats

| in    | out   | on screen |
|-------|-------|-----------|
| 0:00  | 0:07  | the mark, "Tag a release. Get the launch." |
| 0:07  | 0:15  | "You tag a release." then the terminal, `gh release create v0.3.0` |
| 0:15  | 0:23  | "A GitHub Action wakes your Mind." then the run, and the message going out |
| 0:23  | 0:41  | "Your Mind reads it, remembers the last release, and writes the kit." then the thread |
| 0:41  | 0:55  | "imaji renders." then the kit page: the card, the tweet, the thread, the film |
| 0:55  | 1:07  | "It remembers every release." then the real app, a new thread, thirty seconds |
| 1:07  | 1:14  | "It refuses." then the real app turning down a typo-only release |
| 1:14  | 1:17  | "It also made this." then black |
| 1:17  | 1:45  | the launch video imaji wrote and rendered for v0.3.0, untouched |
| 1:45  | 1:55  | the end card: three steps, the agent path, the URL |

## Rules the video keeps

- Under two minutes. It is 1:55 with five seconds of headroom.
- One sheet of warm paper, one accent, a hint of weather behind it. Nothing is
  coloured that does not have to be.
- No camera moves. Product shots arrive once, on a 16px rise, and hold. The
  only motion inside a window is the content's own: typing, log lines landing,
  a reply revealing, film frames playing.
- Nothing on screen is invented. Every quoted line is read from a file in this
  repository, from the kit the Mind wrote, from a real run's output, or from
  the recording of the real app.
- No voice over, no music, no caption bar. The typed statements are the
  narration, and every one of them finishes before its cut.
- No emoji and no em dash anywhere. No icon font either: the rebuilt
  interface's glyphs are drawn shapes.
- One accent (`#E2583E`), at most one accented word per statement.
- "Mind" not "agent"; "your Mind" not "our Mind".
- No kit token ever reaches the screen. The kit page is addressed by its
  read id.
