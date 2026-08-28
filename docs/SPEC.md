# imaji, technical spec (v1, hackathon build)

One release in, a whole launch kit out. A developer tags a release; that wakes
their own Mind (Minds by Animoca Brands), which reads the release, remembers
the brand and every release before it, decides what each channel needs, writes
every word, and calls imaji's render service for the visuals. Nobody prompts
it. imaji is the job description plus the hands; the Mind is the brain, the
memory and the judgment. Pull the Mind out and what remains is a template
filler with no memory and no taste.

This file is the contract every part of the repo is built against.

## 1. The loop

```
1. dev tags a release                         (GitHub, theirs)
2. .github/workflows/imaji.yml runs           (their repo, our template)
3. the Action wakes their Mind with the release (minds-cli send --wait)
4. their Mind reads it, remembers past releases, decides what it earns,
   writes the kit and POSTs the kit JSON to /api/render (HTTP_Execute)
5. imaji renders card + film from HTML, stores the kit,
   answers with the private kit URL
6. the Mind replies with the kit URL; the Action prints it
   and, only if opted in, comments it on the release commit
```

Each user runs their OWN Mind. imaji never shares one: Episodes and Tenets are
per Mind, so one user's brand can never reach another's kit. Nothing is
auto-posted to any social network in v1.

The ceiling rule: the user decides by talking to their Mind (brand, voice,
which outputs are allowed, when to skip); the Mind decides per release (which
outputs this release earns, the look, the copy, what to skip); the renderer
decides nothing. The kit JSON carries the full render spec every time.

## 2. Components and repo layout

```
imaji/
  README.md                     what imaji is, and how to run it yourself
  CHANGELOG.md                  every release, Keep a Changelog form
  AGENTS.md                     the terminal install, written for a coding agent
  imaji.json                    imaji's own standing preferences (optional in any repo)
  docs/README.md                the docs index
  docs/SPEC.md                  this file
  docs/OUTPUTS.md               the six outputs, one at a time
  docs/WORKFLOW.md              the two workflow jobs in use
  docs/RELEASING.md             how a release is cut here
  docs/examples/                a complete kit.json, and an imaji.json
  job/JOB.md                    the job description the user pastes to their Mind once
  templates/imaji.yml           the GitHub Actions workflow users copy into .github/workflows/
  src/app/                      Next.js 16 App Router (TypeScript, Tailwind 4)
    page.tsx                    front door: the sentence, three copy blocks, mint a token
    k/[readId]/page.tsx         kit index (private, read-id-scoped)
    k/[readId]/[tag]/page.tsx   kit page (private)
    api/render/route.ts         POST, the Mind calls this
    api/tokens/route.ts         POST, mint a kit token
    api/kits/[readId]/[tag]/[file]/route.ts  GET card.png / film.mp4 / kit.json
    job.md/route.ts             GET job/JOB.md as text/markdown
    agents.md/route.ts          GET AGENTS.md as text/markdown
    llms.txt/route.ts           GET the llms.txt index (text/plain)
    llms-full.txt/route.ts      GET every docs page as one text/plain file
    llms/docs/[slug]/route.ts   GET one docs page as text/markdown (rewritten from /docs/<slug>.md)
    imaji.yml/route.ts          GET templates/imaji.yml as text/yaml
  src/lib/
    kit.ts                      kit JSON schema, validation, defaults (zod)
    store.ts                    flat-file storage under IMAJI_DATA_DIR
    tokens.ts                   token mint + check
    readid.ts                   readId = sha256(token), and back again
  src/render/
    render.ts                   renderCard(), renderFilm(): puppeteer-core + Chrome + ffmpeg,
                                frame-range planner, shard spawner, segment concat
    worker.ts                   one shard: its own Chrome and ffmpeg, one segment
    compose.ts                  builds a per-render project dir from a composition + vars
    capture.ts                  screenshots a live page for a launch capture beat
    compositions/card/index.html    1200x630 social card, rest frame only
    compositions/film/index.html    1920x1080 or 1080x1920 stage (x2 out), ~10 s, 4 beats, one registered gsap timeline
    compositions/launch/index.html  1920x1080 stage (x2 out), 30 to 45 s, one scene per storyboard beat
    vendor/                     gsap.min.js, fonts (vendored, never fetched)
  data/                         gitignored: data/tokens.json, data/kits/{token}/{tag}/...
  .env.example
  README.md
```

Runtime: Bun 1.3 as package manager and script runner; Next.js 16 (App
Router, TypeScript strict, Tailwind 4). Self-hosted with `next start` on a Mac
that has Chrome and ffmpeg, exposed through a cloudflared tunnel. Never Vercel:
the renderer needs Chrome and long requests.

## 3. The kit JSON (what the Mind produces)

The Mind ends every kit reply with ONE fenced json block. Over the Builder API
it arrives as `<pre><code>...</code></pre>` inside HTML: html-unescape, then
JSON.parse. Shape:

```json
{
  "version": "v0.2.0",
  "repo": "s0nderlabs/imaji",
  "releaseUrl": "https://github.com/s0nderlabs/imaji/releases/tag/v0.2.0",
  "outputs": ["x", "linkedin", "card", "film"],
  "look": "editorial",
  "brand": {
    "name": "imaji",
    "accent": "#E2583E",
    "ground": "dark",
    "type": "grotesque",
    "logoUrl": "https://raw.githubusercontent.com/s0nderlabs/imaji/main/public/logo.svg",
    "url": "https://imaji.s0nderlabs.xyz"
  },
  "tweet": "one tweet, under 280 chars",
  "thread": ["part 1", "part 2", "part 3"],
  "linkedin": "a LinkedIn post, paragraphs separated by \\n\\n",
  "card": { "headline": "under 8 words", "subline": "under 14 words", "accentWord": "one word from the headline" },
  "film": { "lines": ["what changed 1", "what changed 2", "what changed 3"], "closing": "version + where to get it" },
  "launch": {
    "beats": [
      { "type": "text", "headline": "under 10 words", "accentWord": "one word from the headline", "sub": "optional, under 14 words" },
      { "type": "image", "src": "https://raw.githubusercontent.com/owner/name/main/docs/shot.png", "caption": "optional, under 12 words" },
      { "type": "capture", "url": "https://the-product.example", "caption": "optional" },
      { "type": "lines", "lines": ["what changed 1", "what changed 2", "what changed 3"] },
      { "type": "signoff", "closing": "name v0.2.0, where to get it" }
    ]
  },
  "skipped": ["why something was left out, in the user's voice"],
  "memory": "one line the Mind wants to remember about this release"
}
```

Rules, enforced by `src/lib/kit.ts` (zod, lenient):

- `version` required (string). `repo` required (`owner/name`). Everything else has a default.
- `outputs` is a subset of `["x", "linkedin", "card", "film", "vertical", "launch"]`. Missing means the original four (`x`, `linkedin`, `card`, `film`): the two video cuts are opt-in per release, never a default.
- `vertical` is the film composition rendered a second time at 1080x1920 (`RenderVars.orientation: "portrait"`), to `film-vertical.mp4`. It needs nothing in the kit beyond the word in `outputs`.
- `launch` is a 30 to 45 second launch video built from `launch.beats`, to `launch.mp4`. When `"launch"` is in `outputs`, `launch.beats` is required and must hold 3 to 10 usable beats or the kit is a 400. Five beat types: `text` (needs `headline`, optional `accentWord` which must be a word of that headline, optional `sub`), `image` (needs an https `src`, optional `caption`), `capture` (needs an https `url`, optional `caption`), `lines` (1 to 4 strings), `signoff` (needs `closing`). An unknown beat type, or a beat missing what it needs, is dropped with a warning. A launch always opens on identity and closes on where to get it, so if the first beat is not `text` one is inserted from `card.headline`, and if the last is not `signoff` one is appended from `film.closing` (or `brand.name` plus the version). Beat lengths are fixed: wordmark 2.5 s (always, before beat one), text 4 s, image 4.5 s, capture 5 s, lines 1.8 s plus 1.2 s a line, signoff 3.5 s; past 45 s the beats just before the signoff are dropped with a warning.
- Launch pictures are resolved before Chrome opens on the composition. An `image` beat is fetched through the same guard as `brand.logoUrl` (public addresses only, 3 redirects, 10 s, now png/jpeg/webp/svg and 6 MB); a `capture` beat is screenshotted by `src/render/capture.ts` in headless Chrome at 1920x1080, first fold plus a full-page shot capped at 2160 px tall, JPEG quality 85, 20 s a capture. Either failure degrades that beat to a `text` beat whose headline is the caption, or the host if there was no caption, with a warning. The composition never fetches anything: every picture reaches it as a data URL.
- `look` is `"editorial" | "punchy" | "quiet"`, default `"editorial"`. v1 ships one composition; look only changes type scale and motion tempo. Unknown values fall back to editorial.
- `brand.accent` must be a hex colour, default `#E2583E`. `brand.ground` is `"light" | "dark"`, default `"dark"`. `brand.type` is `"grotesque" | "serif" | "mono"`, default `"grotesque"`. `brand.logoUrl` optional https URL; if present the renderer fetches it once (10 s timeout, 2 MB max, svg/png only) and shows it in the wordmark beat; if the fetch fails the beat falls back to the brand name as text.
- `card.accentWord` must appear in `card.headline` (case-insensitive) or it is ignored.
- Strings are clamped (at the last sentence or word boundary that fits): tweet 280, thread parts 280 each and at most ten, headline 60, subline 100, film lines 70 each, closing 80, beat caption 80. Clamping never throws.
- Newlines inside strings arrive as literal `\n\n` escapes (the Mind was asked for that); `normaliseKit` unescapes them once, on the way in, so what is stored already has real newlines.
- The renderer never invents copy. If `card` is missing and `"card"` is in outputs, the card is rendered with headline = version, subline = repo.

## 4. Render service

### `POST /api/render`

Auth: `Authorization: Bearer <kitToken>`. The token comes from the front door
(`/api/tokens`) and lives in the user's repo secrets as `IMAJI_KIT_TOKEN`;
the Mind receives it inside the release message. Unknown token: 401.

The token is a WRITE credential and nothing else. Everything readable is
addressed by a read id derived from it, `sha256(token)` as hex truncated to 24
characters (`src/lib/readid.ts`): the kit pages, the file route and every URL
this route returns or stores in `meta.json` carry the read id, never the
token. A kit link can therefore be pasted into a commit comment or a demo
video without handing the reader the ability to overwrite the kit. Storage on
disk stays keyed by the token (`data/kits/<token>/...`); a read id is resolved
back to its token by scanning `tokens.json` once and caching the result.

Body: the kit JSON above. The route:

1. validates and normalises the kit (`src/lib/kit.ts`),
2. writes `data/kits/{token}/{tag}/kit.json` and `meta.json` (`{repo, tag, receivedAt, status: {card, film}}`), overwriting a previous kit for the same tag (re-runs are allowed),
3. renders the card synchronously if `"card"` is in outputs (target under 10 s),
4. starts each requested video render in the background, one in-flight slot per tag per cut: `film` -> `film.mp4`, `vertical` -> `film-vertical.mp4`, `launch` -> `launch.mp4`. Each reports through its own field, `meta.json.status.{film,vertical,launch}`, going `queued -> rendering -> done | failed`, with the message under `meta.json.errors.<cut>` (and, for anything that reads the older shape, `error`). Targets on this Mac: film and vertical under 3 min each, a launch video under 5 min including its captures.
5. responds immediately after the card:

```json
{
  "ok": true,
  "kitUrl": "https://imaji.s0nderlabs.xyz/k/<readId>/v0.2.0",
  "indexUrl": "https://imaji.s0nderlabs.xyz/k/<readId>",
  "card": "https://imaji.s0nderlabs.xyz/api/kits/<readId>/v0.2.0/card.png",
  "film": "https://imaji.s0nderlabs.xyz/api/kits/<readId>/v0.2.0/film.mp4",
  "vertical": "https://imaji.s0nderlabs.xyz/api/kits/<readId>/v0.2.0/film-vertical.mp4",
  "launch": "https://imaji.s0nderlabs.xyz/api/kits/<readId>/v0.2.0/launch.mp4",
  "filmStatus": "queued",
  "verticalStatus": "queued",
  "launchStatus": "queued"
}
```

The three URL keys and the three status keys appear only for the cuts this kit asked for; a status is `"none"` when the cut was not requested.

Errors are JSON `{ ok: false, error: "..." }` with 400 (bad kit), 401 (token), 500 (render failure). The response must be small and plain: the Mind reads it with HTTP_Execute and repeats `kitUrl` to the user.

The base URL comes from `IMAJI_BASE_URL` (env), falling back to the request origin.

### `POST /api/tokens`

No auth. Mints a 24-char base62 token, appends `{token: {createdAt}}` to
`data/tokens.json`, returns `{ token, readId, indexUrl }`. The front door
calls it and shows the token once, labelled as the write credential that goes
into `IMAJI_KIT_TOKEN`, alongside a link to `/k/<readId>`. Mints are
serialised through one promise chain and the registry is written to a temp
file and renamed, so concurrent mints cannot clobber each other and a crash
mid-write cannot truncate the file. Two brakes on an endpoint with no auth:
10 mints per hour per IP (in memory, from `x-forwarded-for` or
`cf-connecting-ip`, failing open when neither is present, 429 beyond that) and
a hard cap of 5000 tokens in the registry (503 beyond that).

### `GET /api/kits/[readId]/[tag]/[file]`

Serves `card.png`, `film.mp4`, `film-vertical.mp4`, `launch.mp4`, `kit.json`
and `meta.json` from the store with the right content type and
`Cache-Control: private, no-store`. Every mp4 answers byte-range requests. An unknown read id
is a 404, as is a missing file. The kit page uses these URLs, so they must work
in `<img>` and `<video>`.

### Rendering (`src/render/`)

GSAP and the fonts are vendored (`gsap.min.js`, `fonts/`). Never a font CDN.
Rendering must be deterministic: no `Date.now`, no `Math.random`, no network
inside the compositions.

Three compositions, hand-built once, parametrised by vars:

- **card** (`compositions/card/index.html`): a 1200x630 stage. Content: brand
  mark (logo or name), headline with the accent word coloured, subline,
  version pill, repo/url line. It is a still. `renderCard()` loads it in
  Chrome (puppeteer-core, `executablePath` from `CHROME_PATH` env, default
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`), waits for
  `document.fonts.ready`, screenshots the stage element at
  `deviceScaleFactor: 1` to `card.png`.
- **film** (`compositions/film/index.html`): a 1920x1080 stage,
  `[data-composition-id="imaji-film"] data-width="1920" data-height="1080"`,
  about 10 s, 60 fps. Four beats: (1) wordmark rises, (2) thesis: the card
  headline types on with the accent word colour-blocked, (3) what changed:
  the three film lines rise one after another, (4) sign-off: closing line,
  version, url, brand mark. All motion on ONE paused gsap timeline registered
  as `window.__timelines.main`; `gsap.set` never `gsap.from`; no CSS
  animations; no rAF loops. `renderFilm()` reads the duration off the
  timeline once, splits `ceil(duration*fps)` frames into contiguous ranges
  and hands each to a worker process (`worker.ts`) that pins the viewport to
  the stage at `deviceScaleFactor` 2, seeks `t = f/fps`, screenshots every
  frame in its range and pipes the PNGs to its own ffmpeg (`libx264`,
  `crf 18`, `yuv420p`, one keyframe a second, closed GOP) as an mp4 segment.
  The parent concat-copies the segments and writes `film.mp4` with
  `+faststart`, so the output is 3840x2160 and the wall clock divides by the
  worker count. `FFMPEG_PATH` env, default
  `ffmpeg` on PATH (`/opt/homebrew/bin/ffmpeg` here). `V.orientation`
  (`"landscape"` default, `"portrait"`) switches the stage to 1080x1920 and
  rewrites `data-width`/`data-height` before the timeline is built, which is
  the whole of the `vertical` output, and comes out 2160x3840.
- **launch** (`compositions/launch/index.html`): a 1920x1080 stage,
  `[data-composition-id="imaji-launch"]`, 60 fps, as long as its beats say.
  One scene per beat plus a wordmark scene that always opens, 0.4 s
  cross-fades between them, exactly one painted at a time otherwise. Same one
  paused `window.__timelines.main`, same rules: `gsap.set` never `gsap.from`,
  no CSS animation, no rAF, no `Date.now`, no `Math.random`, no network.
  `IMAJI_READY` waits for `document.fonts.ready` and for every picture to
  decode, because the capture pan measures the decoded height. Rendered by the
  same `renderFilm()` with a longer deadline.

Vars are injected by `compose.ts`: it copies the composition and the vendor
dir into a fresh project dir under `data/renders/<id>/`, and replaces the
marker `/*__IMAJI_VARS__*/` inside the composition's `<script>` with
`window.IMAJI_VARS = <json>`. The composition reads `window.IMAJI_VARS`
before building the DOM. Vars: `{ brandName, logoDataUrl?, url, version,
headline, accentWord, subline, lines[3], closing, accent, ground, type,
look, orientation?, launch? }`, where `launch.beats` is the resolved
storyboard (every picture already a data URL). Ground `dark` means a near-black ground (never pure `#000`, use
`#0e0e10`) with light text; `light` the inverse. Type maps to font stacks:
grotesque = Outfit (vendored), mono = Geist Mono (vendored), serif = a system
serif stack (`"Iowan Old Style", "Palatino Linotype", Georgia, serif`).

Brand craft rules for both compositions: one accent used at full strength on
the accent word and the version pill only; two neutrals of one temperature;
tabular figures on the version; the stage never shows a scrollbar; text is
clamped to the stage (long headlines shrink via a two-step font-size ladder,
never overflow).

### Storage (`src/lib/store.ts`)

`IMAJI_DATA_DIR` env, default `./data`. Layout:

```
data/tokens.json
data/kits/{token}/{tag}/kit.json      normalised kit
data/kits/{token}/{tag}/meta.json     {repo, tag, receivedAt, status:{card,film,vertical,launch}, error?, errors?}
data/kits/{token}/{tag}/card.png
data/kits/{token}/{tag}/film.mp4
data/kits/{token}/{tag}/film-vertical.mp4
data/kits/{token}/{tag}/launch.mp4
data/renders/{id}/                    scratch project dirs, deleted after render
```

Tag names are sanitised to `[A-Za-z0-9._-]` before touching the filesystem.

## 5. Pages

Design stance for every page: calm, precise, made by someone who ships.
Near-neutral ground with ONE accent (imaji's own accent is `#E2583E`), two
type voices (a display face for the few big words, a tabular sans for
everything else), no gradients, no emoji, no card-on-card. Curly quotes, no
emdash anywhere. Both light and dark themes via CSS tokens.

- **`/` front door.** The sentence: "A developer who ships is a creator whose
  content is code. imaji turns each release into the posts, the card and the
  film they never had time to make." Then, in order: (1) "Hand your Mind the
  job": a copy button for `job/JOB.md`, (2) "Drop this in your repo": a copy
  button for `templates/imaji.yml` plus the three secrets it needs
  (`MINDS_API_KEY`, `MIND_ID`, `IMAJI_KIT_TOKEN`), (3) "Mint a kit token":
  a button that calls `POST /api/tokens` and shows the token once with a
  copy button and the link to `/k/<readId>`, (4) one paragraph on how it
  works (the loop above) and the wrapper test. No accounts, no form.
- **`/k/[readId]`** kit index: the repo name(s), a list of kits newest first
  (tag, date, which outputs, film status). 404 for an unknown read id. The
  read id is `sha256(kitToken)` truncated to 24 hex characters, so the page
  address is safe to share and the write token never appears in a URL.
- **`/k/[readId]/[tag]`** kit page: the card (img), the launch video above
  the film when there is one, the film with its vertical cut beside it
  (portrait, max height 520 px), each video with a "rendering" state that
  polls `meta.json` every 5 s until done, the tweet
  and thread with copy buttons, the LinkedIn post with a copy button,
  "skipped" as a quiet list, the `memory` line, links to the release. Every
  copy button copies exact text (newlines unescaped). Kits are private: the
  page sends `X-Robots-Tag: noindex` and the layout carries
  `<meta name="robots" content="noindex">`; the header is set for `/k/:path*`
  in `next.config.ts`.

Four text routes serve the repository's own files, so a human or an agent can
read them without cloning anything. They read from disk at request time, so
they never drift from the repo:

| Route | Serves | Content type |
| --- | --- | --- |
| `/job.md` | `job/JOB.md` | `text/markdown` |
| `/agents.md` | `AGENTS.md` | `text/markdown` |
| `/llms.txt` | index of the readable files and docs pages | `text/plain` |
| `/llms-full.txt` | every docs page, concatenated | `text/plain` |
| `/docs/<slug>.md` | one docs page | `text/markdown` |
| `/imaji.yml` | `templates/imaji.yml` | `text/yaml` |

## 6. The workflow template (`templates/imaji.yml`)

Two jobs, one file, copied verbatim into `.github/workflows/imaji.yml`.
Both use `bunx @animocabrands/minds-cli@0.1.4`. Env for the CLI is
`MINDS_BUILDER_API_KEY` (from secret `MINDS_API_KEY`). The conversation
alias is derived from the repo: `imaji-<owner>-<name>` lowercased, chars
outside `[a-z0-9_-]` replaced by `-`. `minds chat create --alias A --mind
$MIND_ID` is idempotent and runs every time.

- **`onboard`** (`workflow_dispatch`). Gathers evidence from the repo and
  sends it to the Mind in one message: README (first 6000 chars),
  package.json name/description/homepage if present, logo candidates (paths
  matching `logo|icon|wordmark` with svg/png extension, as raw GitHub URLs
  for public repos), theme tokens (any `--*:` CSS custom properties with hex
  values found in `**/globals.css`, `**/theme.css`, `tailwind.config.*`, up
  to 30), the last 10 releases (`gh release list` + each body's first 400
  chars), `imaji.json` if the repository has one, the kit token and the render
  endpoint. Asks the Mind to propose the
  brand (name, accent, ground, type, voice in three adjectives) and to
  remember it, and to render one sample card by POSTing a minimal kit with
  `version: "onboarding"`. Waits (`--wait --timeout 300000`), prints the
  reply, and prints the sample kit URL as a job summary.
- **`release`** (`on: release: types: [published]`, plus
  `workflow_dispatch` with a `tag` input for re-runs). Builds one message:
  repo, tag, release URL, the release body, the compare URL to the previous
  tag, the kit token, the render endpoint, `imaji.json` if the repository has
  one, the repository assets (the homepage plus up to 12 raw image URLs, as
  evidence a launch video can use), and the instruction to produce the kit and
  POST it. Captures the history fingerprint before sending
  (`minds history A --limit 1`), sends with `--wait --timeout 300000`, and on
  exit 3 (timeout) polls `minds history A --limit 1` every 15 s for up to 5
  min until a newer fingerprint appears. Parses the reply: extracts the kit
  URL (`https://.../k/...`) and, as a fallback when the Mind did not POST,
  extracts the fenced JSON and POSTs it to `/api/render` itself. Writes the
  kit URL to the job summary. If the workflow input or repo variable
  `IMAJI_POST_COMMENT` is `true`, comments the kit URL on the release commit with
  `GITHUB_TOKEN`. Never fails the job because the Mind skipped the release;
  a skip is a valid outcome and is printed as such.

Secrets: `MINDS_API_KEY` (Builder API key), `MIND_ID` (lowercase),
`IMAJI_KIT_TOKEN`. Variables (optional): `IMAJI_BASE_URL`, default
`https://imaji.s0nderlabs.xyz`, and `IMAJI_POST_COMMENT`.

Standing preferences (`imaji.json`). The user's repository holds no settings
file for taste, but a preference they never want to repeat belongs in the
repo, so both jobs read an optional `imaji.json` at its root: `outputs` (a
subset of the six), `look`, and `launch` (`major` default, `always`, `never`).
Whatever parses is copied into the message under `--- standing preferences
from imaji.json ---` with one line of instruction: honour them unless a rule
given in chat says otherwise. The precedence is chat, then the file, and the
Mind may still skip a trivial release entirely. A file that does not parse is
a warning in the log, not a failure. Shape in `docs/examples/imaji.json`,
behaviour in `docs/WORKFLOW.md`.

## 7. The job description (`job/JOB.md`)

Prose, pasted once into a chat with the user's Mind. It tells the Mind what
imaji is, what a kit is, the JSON contract, the render endpoint and how to
call it, the rules (never invent features, skip trivial releases and say
why, remember every release and reference the last one when it matters,
keep the user's voice, ask once when the brand is unknown), and the
onboarding behaviour (propose the brand from the evidence, render a sample,
take corrections in chat). Written for a Mind, not a developer.

## 8. Environment

```
IMAJI_BASE_URL=https://imaji.s0nderlabs.xyz   public base URL of this server
IMAJI_DATA_DIR=./data                          storage root
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
IMAJI_RENDER_SCALE=2                           deviceScaleFactor for the video cuts
IMAJI_RENDER_FPS=60                            frame rate (FILM_FPS still read as a fallback)
IMAJI_RENDER_SHARDS=                           workers a video is split across; blank means cores minus two, capped at 8
```

`.env.example` ships; `.env` never does.

## 9. Non-goals for v1

Auto-posting to any network. Accounts. A settings UI. Multiple compositions
per look. Audio in the film. Any shared Mind.

## 10. Verification checklist (what "done" means)

- `bun test`, `bun run typecheck` and `bun run lint` pass; `bun run build` succeeds; `bash scripts/check.sh` is green.
- `curl -X POST /api/render` with `docs/examples/kit.json` and a minted token returns a kit URL in under 15 s; `card.png` is 1200x630; `film.mp4` appears within 3 min, is 3840x2160 at 60 fps, 10.000 s, plays in Safari and Chrome.
- The kit page renders that kit with working copy buttons and the film state transitions from rendering to playing without a manual reload.
- `templates/imaji.yml` passes `actionlint` (or at least a YAML parse) and its shell steps run locally with `act`-free dry runs (bash -n).
- No emdash anywhere in the repo. No Google Fonts link.
