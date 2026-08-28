# Changelog

All notable changes to imaji are recorded here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

0.1.0 and 0.2.0 were cut on the same day as 0.3.0, during the build, and their kits are public ([v0.1.0](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.1.0), [v0.2.0](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.2.0)); the repository was first published at 0.3.0. Per-release notes, exactly as the Mind received them, live in [docs/releases/](docs/releases/).

## [0.3.0] - 2026-08-28

### Added

- **The launch video.** When a release is a launch, the Mind writes a storyboard and imaji renders it as one long-form film (`launch.mp4`, 1920x1080, 30 fps). Five beat types with fixed lengths: `text` 4 s, `image` 4.5 s, `capture` 5 s, `lines` 1.8 s plus 1.2 s a line, `signoff` 3.5 s, behind a wordmark beat of 2.5 s that always opens. Three to ten beats, a 45 s ceiling that drops beats before the sign-off, and a guaranteed shape: a missing opening `text` is synthesised from `card.headline`, a missing `signoff` from `film.closing`.
- **Pictures resolved before Chrome opens.** An `image` beat is fetched through the same public-address guard as `brand.logoUrl` (png, jpeg, webp or svg, 3 redirects, 10 s, 6 MB); a `capture` beat is screenshotted live by `src/render/capture.ts` in headless Chrome at 1920x1080, first fold plus a full-page shot capped at 3240 px, 20 s a capture. Either failure degrades that one beat to text with a warning instead of failing the video. The composition itself never fetches anything: every picture reaches it as a data URL.
- **The vertical cut.** `"vertical"` in `outputs` renders the film composition a second time at 1080x1920 (`RenderVars.orientation: "portrait"`) to `film-vertical.mp4`, for Shorts, Reels and TikTok. It needs nothing in the kit beyond the word.
- **Per-cut render status.** `meta.json.status` gained `vertical` and `launch` beside `film`, each moving `queued -> rendering -> done | failed` with its own message under `meta.json.errors.<cut>`, and `POST /api/render` answers with `vertical`, `launch`, `verticalStatus` and `launchStatus` beside the film's. The three cuts hold separate in-flight slots per tag, so a launch video never queues behind the film.
- **Standing preferences in `imaji.json`.** An optional three-key file at the repository root (`outputs`, `look`, `launch`) that both workflow jobs read and pass to the Mind under `--- standing preferences from imaji.json ---`. Chat still wins on a conflict, and the Mind may still skip a release the file would otherwise cover. A file that does not parse is a warning, not a failure. Example at [docs/examples/imaji.json](docs/examples/imaji.json).
- **Repository assets in the release brief.** The release job now appends the project homepage and up to 12 `raw.githubusercontent.com` image URLs from the tracked files, screenshots first, badges and icons dropped, as evidence a launch video can use.
- **A setup path for coding agents.** `AGENTS.md` walks an agent through the whole install from the terminal and is served at `/agents.md` and `/llms.txt`; `job/JOB.md` at `/job.md` and `templates/imaji.yml` at `/imaji.yml`, so nothing has to be copied out of the repository by hand.
- **A Dockerfile** for hosts that are not this Mac: Chromium plus ffmpeg plus the base fonts, `IMAJI_DATA_DIR` on a volume, `IMAJI_CHROME_NO_SANDBOX=1` for the root user.
- **A documentation site at `/docs`.** Eleven pages read straight from the repository's markdown (grouped rail, previous and next, one h1 per page), each also served raw at `/docs/<slug>.md`; `/llms.txt` became an index of everything an agent can read and `/llms-full.txt` carries every page in one file.
- **The front door, told as one narrative.** One reading column: the sentence, imaji's own film, how a release becomes a kit as four claims that unfold, the rest of the kit behind a switcher (card, launch video, vertical cut, tweet, thread, LinkedIn, what the Mind kept), three things to start, the sign-off. Light and dark, a moon or sun to switch, pages that pin and slide over each other, and the whole thing under three viewport heights.
- **Asking the Mind directly.** The job description gained an "Asking you directly" section: a request in chat (a fresh card, the launch video for an older release, a vertical cut only) is rendered the same way and lands on the same private page; releases are the trigger, not the only door.
- **New identity.** The hand-lettered imaji wordmark, Tigerlily `#E2583E` as the single accent, warm neutrals, the card and film re-set in TeX Gyre Adventor and Open Sauce One, and a pixel face on the version tag.

### Changed

- **4K at 60 fps, rendered in parallel.** Every video cut now comes out at twice the stage size and twice the frame rate: the film 3840x2160, the vertical cut 2160x3840, the launch video 3840x2160, all at 60 fps. The renderer splits the frames into contiguous ranges and gives each range its own worker process, its own Chrome and its own ffmpeg segment, then concat-copies the segments, so nothing is staged as a PNG on disk and the wall clock divides by the worker count. On a ten-core box a 10 s film is about 36 s and a 28.4 s launch video about 133 s. Three new settings, all optional: `IMAJI_RENDER_SCALE` (2), `IMAJI_RENDER_FPS` (60, with `FILM_FPS` still read as a fallback) and `IMAJI_RENDER_SHARDS` (cores minus two, capped at eight). The card is unchanged at 1200x630.
- **Every description is Mind-centric.** README, the docs, the job, the agent guide, the kit pages and the metadata credit the Mind with reading, remembering, deciding and writing, and imaji with rendering and the page; the Bazaar listing is described as coming later rather than published.
- **The kit URL is no longer the credential.** Pages and files moved from `/k/<token>/<tag>` to `/k/<readId>/<tag>`, where `readId` is `sha256(token)` truncated to 24 hex characters. The raw token is now a write credential only, carried in the `Authorization` header and never in a URL that a release comment, a Slack message or a demo video could expose. Storage on disk stays keyed by the token; a read id resolves back to it through a cached scan of `tokens.json`.
- **Token minting is safe under concurrency.** Mints are serialised through one promise chain and written to a temp file that is renamed onto `tokens.json`, so simultaneous mints cannot clobber each other and a crash mid-write cannot truncate the registry. The unauthenticated endpoint gained two brakes: 10 mints an hour per address (429) and a hard cap of 5000 tokens (503).
- **Kit pages are private by default.** `X-Robots-Tag: noindex` on `/k/:path*` from `next.config.ts`, a matching meta tag in the layout, and `Cache-Control: private, no-store` on every file the kit routes serve.

### Fixed

- **A dying ffmpeg no longer takes the server down.** The ffmpeg promise is handled at creation and `ff.stdin` carries an error listener, so a missing or crashing encoder fails that one film cleanly instead of raising an unhandled rejection.
- **No half-written mp4 is ever served.** Films are written to a `.part` file and renamed on success, one render per tag per cut runs at a time, a deadline closes the browser, a card failure marks the film failed rather than leaving it `queued` forever, and the first request after a restart sweeps every interrupted render to `failed`.
- **Long headlines stay inside the card.** `overflow-wrap: anywhere` on the headline, so a 57-character single word breaks across three lines instead of running off the stage.
- **A malformed stored kit is a 404, not a 500.** `readKit` re-validates what it reads back, and the file route guards its content-type table with `Object.hasOwn`.
- **`brand.logoUrl` cannot reach the host's network.** Private, loopback and link-local addresses are refused, with a redirect cap of three and a size and type limit.
- **A capture beat cannot photograph the host's own services.** Every request the capture page makes, including redirects and subresources, is checked against the same public-address rule as the first hop, and anything loopback, private or link-local is aborted.
- **A version containing a path separator is rejected up front** (400) instead of being stored under a sanitised tag; a thread is capped at ten parts; clamps cut at the last sentence or word that fits instead of mid-word, so a post never ends on a stray letter.
- **Kit pages match the front door**: the same warm tokens, a theme toggle, self-playing muted cuts instead of native browser controls, and a soft focus ring that follows each control's own radius.
- **Literal `\n\n` in the Mind's copy renders as paragraphs** on the kit page and in the clipboard, unescaped once on the way in and never again.

### Tests

- 42 tests pass across 4 files (109 assertions), `bunx tsc --noEmit` clean.
- `bash scripts/check.sh` green offline: python and shell syntax, the reply-parser unit tests, the `minds-send.sh` tests against a stub CLI and a local render endpoint, the YAML parse, `bash -n` on every `run:` block in the template, a byte-identical round trip of the embedded helper scripts, a drift check between the workflow's brief and the local harness, and an emdash and emoji scan.
- Verified against the live platform: `imaji.labs` took the job, was onboarded from this repository, and produced kits for v0.1.0, v0.2.0 and v0.3.0 on the public host. The v0.3.0 kit rendered a 1200x630 card, a 10.000 s film, its 1080x1920 vertical cut and a 28.4 s launch video whose capture beat is a live screenshot of the homepage.

## [0.2.0] - 2026-08-28

### Added

- **The film.** A 1920x1080, ten-second, four-beat release film (wordmark, thesis, what changed, sign-off) rendered frame by frame from the same HTML composition system as the card: one paused GSAP timeline, seek `t = frame / fps`, screenshot each frame, pipe the PNGs into ffmpeg (`libx264`, `crf 18`, `yuv420p`, `+faststart`). It starts in the background right after the card and reports through `meta.json.status.film`.
- **A kit page that finishes on its own.** The film shows a rendering state that polls `meta.json` every 5 s until it resolves, beside copy buttons for the tweet, the thread and the LinkedIn post that copy exact text.
- **A kit index** listing every kit for a token, newest first, with the tag, the date, the outputs and the film's status.
- **Onboarding.** The `onboard` job gathers the README, the package description, logo candidates and CSS colour tokens, and the Mind proposes the brand and renders a sample card before the first release ever runs.

### Fixed

- **Long card headlines step down in size** through a two-step font-size ladder instead of overflowing the stage.
- **Literal `\n\n` in the Mind's copy** is unescaped once on the way in, so LinkedIn posts arrive as paragraphs.

## [0.1.0] - 2026-08-28

### Added

- **The job description** (`job/JOB.md`): the prose a developer pastes once into a chat with their own Mind. It carries what a kit is, the JSON contract, the render endpoint, and the rules (skip trivial releases and say why, remember every release, keep the user's voice).
- **The workflow** (`templates/imaji.yml`): two jobs in one file. `onboard` teaches the Mind the brand from the repository itself; `release` runs on `release: published`, sends the notes with `minds-cli send --wait --timeout 300000`, falls back to polling `minds history` on exit 3, and prints the kit URL. A skip is a success, not a failure.
- **The render service**: `POST /api/render` takes the kit JSON, validates and normalises it with zod, and renders a 1200x630 social card from HTML with Chrome. Deterministic, on brand, no image model.
- **Private kit pages** at `/k/<token>/<tag>`, plus `POST /api/tokens` to mint the kit token that scopes them. Nothing is posted anywhere.

[0.3.0]: https://github.com/s0nderlabs/imaji/releases/tag/v0.3.0
[0.2.0]: https://github.com/s0nderlabs/imaji/releases/tag/v0.2.0
[0.1.0]: https://github.com/s0nderlabs/imaji/releases/tag/v0.1.0
