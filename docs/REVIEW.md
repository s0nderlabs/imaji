# Adversarial review, imaji v1

> A hostile read of the whole repository, run on 28 August 2026 before 0.3.0,
> kept here as written rather than tidied away. Every finding below was fixed
> in [0.3.0](../CHANGELOG.md); the closing section records what each fix was
> and how it was verified.

Read-only pass over `docs/SPEC.md`, `src/`, `templates/`, `scripts/`, `job/`,
`docs/`, the `Dockerfile` and the vendored render assets. That is imaji's half
of the loop, the hands: the judgment and the memory belong to the user's Mind
and are not in this tree to review. Nothing was fixed.

What already passes, so it is not repeated below: `bun run typecheck`,
`bun run lint`, `bun test` (27 pass), `bash scripts/check.sh` (all green,
including the YAML parse, `bash -n` on all 9 `run:` blocks, the embedded
copy round trip and the emdash/emoji scan). A repo-wide `grep` for U+2014
finds nothing. `/api/render` was probed with 17 hostile bodies (traversal
versions, wrong types, 100k-char strings, deep nesting, non-JSON, array and
null bodies): every one returned a correct 400/401/200, nothing threw, and
no path escaped `data/kits/<token>/`. The stored `card.png` is exactly
1200x630 and `film.mp4` is h264 1920x1080, 300 frames, 10.000 s.

Findings are ranked by what they cost if they fire.

---

## 1. The kit URL is also the write credential. Publishing a kit link publishes the token

**Where:** `src/lib/tokens.ts:58` (`hasToken` is the only check),
`src/app/api/render/route.ts:52-54`, `src/app/k/[token]/[tag]/page.tsx:39-40`,
`templates/imaji.yml:1237` (the release-comment step).

**What breaks:** one 24-character string is at once the private path segment
of the kit pages and the bearer token that authorises `POST /api/render`.
The front door says "anyone with the link can read your kits"; it does not
say anyone with the link can also overwrite them.

**Trigger:** set the repository variable `IMAJI_POST_COMMENT=true` (a
documented, one-click feature). The release job comments
`https://imaji.s0nderlabs.xyz/k/<TOKEN>/v0.2.0` on a public commit. Anyone
reading that commit page can now run
`curl -X POST https://imaji.s0nderlabs.xyz/api/render -H "Authorization: Bearer <TOKEN>" -d @anything.json`
and overwrite every kit under that token, spawn Chrome and ffmpeg on the host
for each request, and fill the disk. The same exposure happens any time a kit
link is pasted into a Slack, an issue or the demo video.

**Fix (one line of design, small code):** address the pages by a read id
derived from the token (`sha256(token).slice(0,24)`) and keep the raw token
for the `Authorization` header only, so the URL is no longer the credential.
If that is too much for tonight, at minimum have the comment step post
`indexUrl` only for opted-in users and label the token as write-capable in
the front door copy.

---

## 2. Concurrent token mints silently lose tokens, and one torn write invalidates all of them

**Where:** `src/lib/tokens.ts:50-56` (`createToken` = read whole file, mutate,
write whole file), `src/lib/tokens.ts:44-48` (`writeTokens`, non-atomic),
`src/lib/tokens.ts:34-42` (`readTokens` swallows every error and returns `{}`).

**What breaks:** two things.

(a) The read-modify-write has no lock, so simultaneous mints clobber each
other. The route still returns the lost token to the user, who then gets 401
from `/api/render` and 404 from `/k/<token>` forever, with no way to tell why.

(b) `fs.writeFile` truncates before it writes. A crash or a full disk in that
window leaves a truncated `tokens.json`, and `readTokens` treats an
unparseable file as "no tokens exist". Every kit page in the store goes 404
and every render call goes 401, silently.

**Trigger (verified):** 20 concurrent `createToken()` calls against a clean
data dir. Result: `minted: 20, in file: 1, lost: 19`, and `hasToken` returns
`false` for a token the caller was handed. Two people pressing "Mint a kit
token" inside the same event-loop tick is enough.

**Fix:** serialise mints through a module-level promise chain
(`queue = queue.then(...)`) and write atomically (`writeFile(tmp)` then
`rename(tmp, tokens.json)`); `rename` is atomic on the same filesystem.

---

## 3. The film render leaks a rejected promise and an unhandled stream error; only Next's global net stops it being fatal

**Where:** `src/render/render.ts:168-171` (`ffDone` is created, then not
awaited until line 199, ~300 frames later) and `src/render/render.ts:173-178`
(`writeFrame`; `ff.stdin` has no `error` listener).

**What breaks:** if ffmpeg fails before the frame loop ends, `ffDone` rejects
with no handler attached, and the EPIPE from writing to a dead stdin is
emitted as an `error` event on a stream nobody listens to. Both were verified
fatal in plain Node: the process printed the error and exited 1.

- `FFMPEG_PATH` pointing at a missing binary: `unhandledRejection: Error: spawn ... ENOENT`, exit 1.
- ffmpeg alive then dying mid-stream (disk full, bad args, OOM): `Unhandled 'error' event: write EPIPE`, exit 1.

Under `next start` this does not currently kill the server, because Next 16
installs forgiving `uncaughtException` and `unhandledRejection` handlers
during request handling
(`next/dist/server/route-modules/route-module.js:590-593`) that log instead of
exiting; re-running the same repro with those handlers attached showed the
render failing cleanly into `film: "failed"`. So today the cost is a scary
`unhandledRejection` in the log rather than a dead demo. It becomes a real
crash the moment `renderFilm` is called from anywhere without that net (a
CLI script, a worker, a queue runner) or if
`experimental.removeUncaughtErrorAndRejectionListeners` is ever turned on.

**Fix:** attach the handler at creation, `ffDone.catch(() => {})`, and keep
the real `await ffDone` where it is; add `ff.stdin.on("error", () => {})` next
to the spawn so the EPIPE is delivered only through the write callback.

---

## 4. A stale reply from a previous release can be reported as this release's kit

**Where:** `scripts/minds-send.sh:93-96` (the baseline fingerprint, whose
failure is swallowed by `2>/dev/null`), `scripts/minds-send.sh:114-117` (the
`SEND_RC=0` branch, which sets no `FILTERS`), `scripts/parse-reply.py:176-177`
and `:190-191`. Mirrored verbatim in `templates/imaji.yml`.

**What breaks:** two paths accept an old message as the answer to the message
just sent.

(a) On `SEND_RC=0` the reply is used with no freshness check at all. The
comment says a reply that came straight back is unambiguous, but the
project's own platform notes say the opposite:
`reference_builder-api-and-bazaar.md:98` records that when the CLI's internal
`getLatestHistoryFingerprint` call fails the guard is skipped and `--wait`
can return the previous release's reply.

(b) If `minds history --limit 1` fails (a 502, which this platform is
documented to return), `BASELINE` stays empty, `--after ""` is a no-op, and
the very first poll 15 s later picks the newest Mind message in the last five,
which on a live conversation is the previous release's reply.

**Trigger:** re-run the release job on a repo whose `imaji-<owner>-<name>`
conversation already has a kit in it, with one transient history failure or a
`--wait` that returns before the new reply lands. The job summary and the
release comment then carry the previous release's kit URL, and the run looks
successful. This is the worst kind of failure for a demo: green, and wrong.

**Fix:** require freshness on every path. Pass `--after "$BASELINE"` on the
`SEND_RC=0` branch too and fall through to the poll loop when the reply is not
newer, and treat an empty `BASELINE` as a hard error rather than as "no
filter" (a captured send timestamp is a usable fallback, since fingerprints
are zero-padded epoch ms and string-comparable).

---

## 5. A failed card leaves the film stuck at "queued" forever

**Where:** `src/app/api/render/route.ts:85` (meta is written with
`film: "queued"`), `:110` (the card failure returns early), `:117`
(`startFilm` is never reached).

**What breaks:** when the card render throws, the route returns 500 with the
film still recorded as `queued`, and nothing will ever move it. The kit page
shows the pulsing "Rendering the film" panel, gives up after six minutes with
"Still rendering. Reload the page to check again", and a reload says the same
thing forever.

**Trigger:** POST `docs/examples/kit.json` (outputs include both `card` and
`film`) with `CHROME_PATH` pointing at a missing binary, or while Chrome is
out of memory. `meta.json` ends as `{card: "failed", film: "queued"}`.

**Fix:** in the card `catch`, set `meta.status.film` to `"failed"` (or
`"none"`) before `writeMeta` on line 109, so no kit can be left claiming a
render that was never started.

---

## 6. A single long word in the headline overflows the film stage

**Where:** `src/render/compositions/film/index.html:116`
(`.headline .w{white-space:nowrap}`) and `:350-356` (`fitBlock`, whose ladder
bottoms out at `0.58` and then gives up).

**What breaks:** the ladder only steps down four times; if the widest single
word still does not fit at 0.58, the loop exits with the last step applied and
the word runs off the stage, clipped by `overflow:hidden`. The card is safe
here (`overflow-wrap:break-word` at `card/index.html:90`), the film is not.

**Trigger (measured in Chrome, headless, both compositions rendered):**
`card.headline` = `supercalifragilisticexpialidociousreleasepipelinebuildxyz`
(57 characters, inside the 60-character clamp) with `film` in outputs. The
thesis beat measures `span.w` at 2064 px wide, `right = 2160` against a
1920 px stage: 240 px of the word is cut off, in the middle of the video.
The break-even is around 48 characters in one token, which a package
coordinate or a URL in a headline can reach. The same test at realistic
lengths (58-character headline, 94-character subline, three 60-character film
lines, an 80-character closing) produced zero overflow in both compositions,
so this is narrow but real.

**Fix:** add `overflow-wrap:anywhere` to `.headline` (and drop `nowrap` from
`.headline .w`, which only exists to keep a word's characters together while
they type on) so an unbreakable token wraps instead of clipping.

---

## 7. Two renders of the same tag write the same film.mp4 at the same time

**Where:** `src/app/api/render/route.ts:117` and `src/render/render.ts:156-166`
(ffmpeg's output path is `fileFor(token, tag, "film.mp4")`, fixed per tag).

**What breaks:** the spec explicitly allows re-runs for the same tag. A second
POST while the first film is still rendering (a three-minute window) starts a
second ffmpeg writing the same file. Two writers, one path: the mp4 ends up
interleaved and unplayable, and whichever render finishes first flips the
status to `done`, so the page offers a corrupt file as ready.

**Trigger:** `workflow_dispatch` the release job twice for the same tag inside
three minutes, or a Mind that POSTs the kit and then the workflow's
`--render-fallback` POSTs it again.

**Fix:** render to `film.mp4.<renderId>.part` and `rename` onto `film.mp4` at
the end, and keep a module-level `Map<token/tag, promise>` so a second request
for the same tag cancels or awaits the first instead of racing it.

---

## 8. `local-release.sh --dry-run` prints the kit token to stdout

**Where:** `scripts/local-release.sh:92` (the bearer line is written into the
message) and `:112` (`cat "$M"` in dry-run mode).

**What breaks:** the dry run is documented as the safe way to inspect the
message ("this contacts nothing", `docs/WORKFLOW.md`), and `docs/WORKFLOW.md`
ends with "Nothing in the logs carries a secret". The dry run prints
`authorization header: Bearer <real token>` straight to the terminal, into
scrollback, into any `tee`, and into a screen recording of the demo.

**Trigger:** `IMAJI_KIT_TOKEN=<real token> scripts/local-release.sh --dry-run alias mind v1.0.0 notes.md`.

**Fix:** in dry-run mode substitute a placeholder before writing the header
line, for example `TOKEN_FOR_MESSAGE="$([ "$DRY" = yes ] && echo '<kit token>' || printf '%s' "$TOKEN")"`.
(Related, smaller: line 155 leaves the message file with the real token in a
`mktemp -d` after a real run, and the GitHub "Ask the Mind" step `cat`s the
Mind's reply, which is only safe because Actions masks registered secrets.)

---

## 9. The Docker image cannot render: Chromium as root with no `--no-sandbox`

**Where:** `Dockerfile:29-31` (installs `chromium`, sets
`CHROME_PATH=/usr/bin/chromium`, no `USER` directive, so the container runs as
root) and `src/render/render.ts:47-53` (`args` has no `--no-sandbox` and no
`--disable-dev-shm-usage`).

**What breaks:** Chromium refuses to start as root without `--no-sandbox`
("Running as root without --no-sandbox is not supported"). Every card render
in the container fails with a 500 and every film goes to `failed`. The
Dockerfile is presented as the way to run imaji on Railway, Fly or a VPS, so
the fallback deploy path is dead on arrival. The Mac path used for the demo is
unaffected.

**Fix:** add `"--no-sandbox", "--disable-dev-shm-usage"` to the launch args
when `process.env.IMAJI_CHROME_NO_SANDBOX` is set (or unconditionally, since
the only pages loaded are local files this server generated), or add a
non-root `USER` to the image.

---

## 10. A film render has no timeout and no recovery, so "rendering" can be permanent

**Where:** `src/render/render.ts:112-202` (no overall deadline; the frame loop
has no per-frame timeout) and `src/render/render.ts:173-178` (`writeFrame`
waits on a `drain` event that a stalled ffmpeg will never emit).

**What breaks:** if Chrome hangs, or ffmpeg stalls with a full pipe buffer, or
the server is restarted mid-render, `meta.json` keeps `film: "rendering"`
forever, a headless Chrome stays resident holding several hundred MB, and the
kit page polls for six minutes and then tells the user to reload, which
changes nothing. Nothing on start-up reconciles kits left in `rendering`.

**Trigger:** `pkill -f "next start"` while a film is rendering, then reopen
the kit page.

**Fix:** wrap `renderFilm` in `Promise.race` with a deadline (three to five
minutes) that closes the browser and rejects, and on server start sweep
`data/kits/*/*/meta.json` marking any `rendering` or `queued` as `failed`.

---

## 11. `POST /api/tokens` is unauthenticated, unbounded and O(n) per call

**Where:** `src/app/api/tokens/route.ts:11-18`, `src/lib/tokens.ts:50-56`.

**What breaks:** anyone who can reach the tunnel can mint tokens in a loop.
Each mint reads and rewrites the whole `tokens.json`, so cost grows with the
file, and each token is a permanent write credential for `/api/render`.

**Trigger:** `for i in $(seq 1 50000); do curl -sX POST https://.../api/tokens; done`
grows the file into the megabytes and makes every later mint and every
`hasToken` check (called on every kit page view and every render) slower.

**Fix:** for tonight, a small in-memory rate limit per IP and a cap on the
number of tokens; longer term, keep tokens in a directory of files rather than
one JSON blob so a mint is an append, not a rewrite.

---

## 12. `readKit` hands the page unvalidated JSON, so a malformed kit.json is a 500, not a 404

**Where:** `src/lib/store.ts:83-85` (`readJson<KitJSON>` casts whatever parses)
and `src/app/k/[token]/[tag]/page.tsx:54` (`kit.thread.map`), `:56`
(`kit.skipped`), `:120` (`kit.look`).

**What breaks:** the page trusts fields the type says exist. Any kit.json that
did not come from the current `normaliseKit` (a hand edit, a partially written
file, a kit written by an older shape) throws `TypeError: undefined is not a
function` inside a server component: a 500 error page instead of the 404 the
page is designed to show.

**Trigger:** `echo '{"version":"v1","repo":"a/b"}' > data/kits/<token>/v1/kit.json`
then open `/k/<token>/v1`.

**Fix:** run the parsed file back through `normaliseKit` in `readKit` and
`notFound()` when it throws, or default the arrays at the point of use
(`kit.thread ?? []`).

---

## 13. `brand.logoUrl` is a server-side fetch with redirects and no allowlist

**Where:** `src/render/compose.ts:71-84` (`fetch(logoUrl, { redirect: "follow" })`).

**What breaks:** a blind SSRF. `httpsUrl` blocks `http:`, so the classic
`169.254.169.254` metadata endpoint over plain HTTP is out, but any internal
service reachable over HTTPS from the render host can be requested, and the
response (if it is `image/png` or `image/svg+xml` and under 2 MB) is inlined
into the render the caller then downloads. The caller is a token holder, so
the blast radius is small, but the render host is a personal Mac on a home
network for this build.

**Trigger:** `{"brand":{"logoUrl":"https://192.168.1.1/logo.png"}}` in a kit.

**Fix:** resolve the hostname and reject private, loopback and link-local
ranges before fetching, and cap redirects.

---

## 14. Kit pages do not send `X-Robots-Tag`, which the spec asks for

**Where:** `docs/SPEC.md` section 5 ("the page sends `X-Robots-Tag: noindex`
and the layout carries `<meta name="robots" content="noindex">`") against
`src/app/k/layout.tsx:5-8`, which only supplies the metadata tag. The file
route (`src/app/api/kits/.../route.ts:20-23`) does send the header, so the
images and the mp4 are covered and only the HTML pages are not.

**What breaks:** a crawler that fetches the page without executing or parsing
the head (or a link preview bot) sees no directive. Low impact, one line off
the spec.

**Fix:** add the header in `next.config.ts` under `headers()` for `/k/:path*`.

---

## 15. `TYPES[file]` is a prototype lookup

**Where:** `src/app/api/kits/[token]/[tag]/[file]/route.ts:35`.

**What breaks:** `TYPES` is a plain object literal, so `file = "constructor"`
or `"__proto__"` returns a truthy non-string from `Object.prototype` and gets
past the `if (!contentType)` guard. Today nothing comes of it, because
`fileExists` then 404s on a file called `constructor`, but the type says
`string` and the runtime value is a function, which is exactly the shape that
becomes a bug when someone adds a file to the store later.

**Trigger:** `GET /api/kits/<token>/v1/constructor`.

**Fix:** `Object.hasOwn(TYPES, file)` before the lookup, or a `Map`.

---

## 16. The docs say the kit is commented "on the release"; the workflow comments on the commit

**Where:** `README.md:24` and `docs/SPEC.md` section 6 against
`templates/imaji.yml:1235-1246`, which comments on the release commit because
GitHub has no release comment API. `docs/WORKFLOW.md` gets this right.

**What breaks:** nothing at runtime; a judge reading the repo hits a claim the
code does not make. Worth one word each because the repo is the credibility
check behind the video.

---

## Trivia, listed so nobody re-finds them

- `scripts/check.sh:138` writes a fixed path, `/tmp/imaji-release-job.yml`, and removes it at line 154. Two checks running at once, or a hostile symlink at that path, both misbehave. `mktemp` is the fix.
- `src/render/compose.ts:112-113` copies the whole `vendor/` directory (nine woff2 files plus `_runtime.js` and `_base.css`, which neither composition references) into a fresh scratch dir for every render. About a megabyte of file copying per card and per film, for two files that are actually used.
- `src/components/FilmPanel.tsx:60`: the polling effect depends on `status`, so the poll counter resets to zero when the status moves `queued -> rendering`. Harmless, just means the six-minute give-up is really twelve.
- `src/app/k/[token]/[tag]/page.tsx:182`: `initialError` is `meta.error`, which is also where a failed card render stores its message, so a card failure prints its error under the film panel.
- `src/lib/kit.ts:97` already un-escapes `\n` before storing, and `src/components/text.ts:4` un-escapes again on read. Idempotent in practice, but the second pass will also convert a genuine literal backslash-n that survived the first, for example inside a code sample in a tweet.

---

## Status

Two passes fixed these findings. The workflow pass (owner: `scripts/**`,
`templates/imaji.yml`, `docs/WORKFLOW.md`, `README.md`) is first; the render
service pass (findings 1, 2, 3, 5, 6, 7, 9 to 15) follows it.

- **4, stale reply.** `scripts/minds-send.sh` now runs one guard on every path.
  The baseline is captured as before, but when history returns nothing (a 502,
  or a conversation that is new and therefore empty) it falls back to the send
  clock as a zero padded epoch ms, which is string comparable with a
  fingerprint, minus a minute of skew allowance; if even that is unavailable the
  script dies rather than sending with no filter. `SEND_RC=0` no longer trusts
  the reply the CLI hands back: it is accepted only when its fingerprint is
  strictly newer than the baseline and it is not an echo of the message we sent,
  and otherwise the run falls through to the same poll loop as `SEND_RC=3`. The
  poll loop moved out of the `case` so both paths reach it. Mirrored into
  `templates/imaji.yml` with `scripts/sync-template.py --write`.
- **8, the kit token in the clear.** `scripts/local-release.sh --dry-run` now
  writes `Bearer <kit token>` into the message instead of the real token, so the
  documented "safe way to inspect the message" is safe again. Both
  `local-release.sh` and `local-onboard.sh` scrub the bearer line out of the
  message file in their `mktemp` directory on exit (an `EXIT` trap, so it also
  fires when the send fails), unless `IMAJI_KEEP_WORK=1`.
- **16, the comment wording.** `README.md` now says the Action "comments it on
  the release's commit". `docs/SPEC.md` says "on the release commit" in both
  places it makes the claim (section 1's loop and section 6).
- **Trivia, the fixed `/tmp` path.** `scripts/check.sh` writes the extracted
  release job to a `mktemp` file passed in as `argv[1]` instead of
  `/tmp/imaji-release-job.yml`, and removes that file.

New tests, all in `scripts/minds-send.test.sh`: a baseline equal to the reply
fingerprint is refused (exit 3, nothing on stdout, and the run falls through to
the poll), a baseline strictly newer than the reply is refused, the send clock
fallback still accepts a reply stamped after the send when history is down, and
a real `local-release.sh` run leaves no bearer token anywhere in the work
directory it keeps.

Verified: `bash scripts/check.sh` all green (17 minds-send tests, 11
parse-reply tests, YAML parse, `bash -n` on all 9 `run:` blocks, the embedded
copy round trip byte identical, the local harness brief identical to the
workflow's, no emdash or emoji), plus `bun run typecheck`, `bun run lint` and
`bun test` (27 pass).

### The render service pass

- **1, the kit URL was the write credential.** Pages, the file route and every
  URL the render route returns or stores are addressed by a read id,
  `sha256(token)` truncated to 24 hex characters (`src/lib/readid.ts`). The
  token stays the bearer on `POST /api/render` and nothing else. Storage on
  disk is unchanged, so no kit had to migrate. `/k/<readId>/<tag>` answers 200
  and `/k/<token>/<tag>` answers 404.
- **2 and 11, the token registry.** Mints are serialised through one promise
  chain and written to a temp file that is renamed onto `tokens.json`. Twenty
  simultaneous mints now land twenty tokens in the file, none lost, all of them
  accepted by `/api/render`. `POST /api/tokens` also carries a per-address
  limit of ten an hour (429 beyond it) and a 5000 token cap (503 beyond it).
- **3, 5, 7 and 10, the renderer lifecycle.** The ffmpeg promise is handled at
  creation and `ff.stdin` has an error listener, so a missing or dying ffmpeg
  fails the film cleanly instead of raising an unhandled rejection. The film is
  written to a `.part` file and renamed on, one render per tag runs at a time,
  a five minute deadline closes the browser, a card failure marks the film
  failed instead of leaving it queued, and the first request after a restart
  marks every interrupted render failed.
- **6, the long headline.** `.headline` wraps with `overflow-wrap:anywhere`, so
  a 57 character single word now breaks across three lines inside the stage
  instead of running 240 px off it.
- **9, Chromium in Docker.** `--no-sandbox` and `--disable-dev-shm-usage` are
  added when `IMAJI_CHROME_NO_SANDBOX=1`, which the Dockerfile sets.
- **12 to 15.** `readKit` re-validates what it reads, so a malformed kit.json
  is a 404 rather than a 500; `brand.logoUrl` is resolved and refused for
  private, loopback and link local addresses with a redirect cap of three;
  `/k/:path*` sends `X-Robots-Tag` from `next.config.ts`; and the file route
  guards its type table with `Object.hasOwn`.

Verified end to end against a dev server on a copy of the store: a minted
token, `docs/examples/kit.json` posted, `card.png` 1200x630, `film.mp4` h264
1920x1080, 300 frames, 10.000 s, decoding with zero errors after two posts of
the same tag in a row; twenty two hostile bodies answered 200, 400 or 401 with
nothing written outside `data/kits/<token>/`; no emdash and no Google Fonts
anywhere in the tree.
