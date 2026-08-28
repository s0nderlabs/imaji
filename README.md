<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/imaji-5b-on-dark.svg">
    <img src="public/imaji-5b-on-light.svg" alt="imaji" width="220">
  </picture>
</p>

<p align="center">
  <b>One release in, a whole launch kit out.</b>
</p>

<p align="center">
  <a href="https://imaji.s0nderlabs.xyz">imaji.s0nderlabs.xyz</a>
  &middot; <a href="https://imaji.s0nderlabs.xyz/job.md">the job</a>
  &middot; <a href="https://imaji.s0nderlabs.xyz/agents.md">agent setup</a>
  &middot; <a href="LICENSE">Apache-2.0</a>
</p>

A developer who ships is a creator whose content is code. Every release they tag is a launch nobody writes up. imaji is how their own Mind writes it: the posts, the card, the film and, when it is a launch, the launch video.

It is a job your Mind can take. You hand your own Mind (Minds by Animoca Brands) a job description once, drop one workflow file into your repository, and from then on every release you tag wakes that Mind. It reads the release itself, decides what the release earns, writes every word in your voice, remembers every release before it, and calls imaji to render. Nobody prompts it. Built for Creative Minds Jam #1, Track 2: content repurposing across platforms.

## The idea in one paragraph

Most "turn your commits into content" tools are a pipeline with a model in the middle: templates, a prompt, a post. imaji inverts it. Your Mind is the employee and does the whole job. It decides which releases deserve a kit and which are a dependency bump, writes the copy in your voice, remembers your brand and your last release, storyboards the launch video, and calls imaji's render service for the visuals. imaji is the job description plus the hands: no memory, no taste, no judgment. Pull the Mind out and what remains is a template filler. That is the point, and it is checkable by reading this repository.

## The loop

```
1. you tag a release                          GitHub, yours
2. .github/workflows/imaji.yml runs           your repo, our template
3. the Action wakes your Mind                 minds-cli send --wait
4. your Mind reads it, remembers past releases, decides what this release
   earns, writes the kit and POSTs the kit JSON to imaji's /api/render
5. imaji renders the card, the film, its vertical cut and, for a launch,
   the launch video from HTML, stores the kit, answers with a private kit URL
6. your Mind replies with the kit URL; the Action prints it
   and, only if you opted in, comments it on the release's commit
```

Nothing is auto-posted. The kit lands on a private page (`/k/<readId>/<tag>`) and you decide what to do with it.

## What a kit contains

- `x`: one tweet and a three-part thread
- `linkedin`: one post
- `card`: a 1200 x 630 social card, headline with one accent word, rendered from HTML
- `film`: a ten-second release film, four beats, rendered frame by frame from the same HTML
- `vertical`: the same film cut on a phone-shaped stage for Shorts, Reels and TikTok
- `launch`: a 30 to 45 second launch video, only for a launch. The Mind writes the storyboard (a line, a screenshot from your repository, a live capture of your homepage, what changed, a sign-off) and imaji renders it

Your Mind picks which of the six a release earns, and writes every word in all of them. A typo fix earns none, and saying so is a valid kit. Each output, what the Mind writes for it and how it is rendered: [docs/OUTPUTS.md](docs/OUTPUTS.md).

## Why a Mind, and not just an API call

Three things a single API call cannot do, and a Mind does:

1. **It is triggered by your work, not by you.** The Action wakes it; you never prompt it. It operates without constant prompting.
2. **It remembers.** Every release it handled, every correction you gave it ("never say excited"), every colour you changed. Kit two says "building on v0.1.0" without being told.
3. **It refuses.** Trivial releases get skipped with a reason, in your voice.

The render service is deliberately dumb so all of the judgment and all of the memory stay with the Mind. See [docs/SPEC.md](docs/SPEC.md) section 3 for the exact contract the Mind fills in.

## Using it

1. **Hand your Mind the job.** Open a chat with your own Mind and paste [`job/JOB.md`](job/JOB.md), or tell it to read `https://imaji.s0nderlabs.xyz/job.md`. It reads it, remembers it, and confirms in one sentence. This is the only time you prompt it.
2. **Mint a kit token** on the front door (`/`). It is the only credential imaji issues, and it is a write credential: it authorises posting a kit and belongs in your repository secrets. Your kit pages live at a read id derived from it (`/k/<readId>`), so a kit link is safe to share.
3. **Drop the workflow in your repo.** Copy [`templates/imaji.yml`](templates/imaji.yml) to `.github/workflows/imaji.yml` and add three secrets: `MINDS_API_KEY` (your Builder API key from build.hellominds.ai), `MIND_ID` (lowercase), `IMAJI_KIT_TOKEN`.

Then run `onboard` once (Actions tab, Run workflow, set `job` to `onboard`). It gathers your README, package description, logo, colour tokens and past releases and hands them to your Mind, which reads them, proposes the brand itself and renders a sample card. Correct it in one sentence of chat; your Mind keeps the correction for every kit after. After that, tag a release and the kit appears at your kit index within a few minutes.

You can also just ask. Tell your Mind in chat "make a launch video for v0.2.0" or "the card again, warmer" and it calls imaji the same way it does for a release; the result lands on the same kit page. Releases are the trigger, not the only door.

Setting up with a coding agent instead? Point it at `https://imaji.s0nderlabs.xyz/agents.md`. It walks the whole install from the terminal and asks you only for the API key and the Mind ID.

Optional: commit an `imaji.json` at the root of your repository to hold standing preferences (which outputs you want by default, the look, when a launch video is worth making), so you never have to say them again. It is a default your Mind honours, not a decision it hands over: a rule you give in chat still wins over the file, and your Mind can still skip a release the file would otherwise cover. The shape is under [Configuration](#configuration), a copy to start from is at [docs/examples/imaji.json](docs/examples/imaji.json), and both workflow jobs are described in [docs/WORKFLOW.md](docs/WORKFLOW.md).

## For Agents

If you are an AI agent setting imaji up for a developer: read [`AGENTS.md`](AGENTS.md), which is the whole install as four terminal steps and takes about ten minutes, most of it waiting for the Mind. The same file is served at [/agents.md](https://imaji.s0nderlabs.xyz/agents.md); [/llms.txt](https://imaji.s0nderlabs.xyz/llms.txt) is the index of everything an agent can read, with the full documentation at [/llms-full.txt](https://imaji.s0nderlabs.xyz/llms-full.txt); the job description is at [/job.md](https://imaji.s0nderlabs.xyz/job.md) and the workflow at [/imaji.yml](https://imaji.s0nderlabs.xyz/imaji.yml), so nothing has to be copied out of this repository by hand.

Ask the developer for exactly two things, `MINDS_API_KEY` and `MIND_ID`, and treat both as secrets: never write them into a tracked file, never print them, never put them in a commit message. The kit token you mint in step 2 is a write credential and belongs in `gh secret set`, nowhere else.

## Running imaji yourself

imaji is a Next.js 16 app with a render service that needs Chrome and ffmpeg on the host, so it runs on a machine, not on a serverless platform.

```bash
bun install
cp .env.example .env        # set IMAJI_BASE_URL to your public URL
bun run dev                 # or: bun run build && bun run start
```

Expose it with a tunnel (`cloudflared tunnel --url http://localhost:3000` works for a trial). For a host that is not your own Mac, the [`Dockerfile`](Dockerfile) builds the app with Chromium, ffmpeg and the base fonts, and keeps the store on a `/data` volume.

Try the renderer without a Mind:

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/tokens | jq -r .token)
curl -s -X POST localhost:3000/api/render \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @docs/examples/kit.json
```

Open the `kitUrl` from the response. The card is there at once; the film follows within a couple of minutes.

## Configuration

The server reads seven variables, all with defaults, from `.env` (see [`.env.example`](.env.example)):

| Variable | Default | What it does |
| --- | --- | --- |
| `IMAJI_BASE_URL` | the request origin | public base URL, used in every kit URL the Mind reads back |
| `IMAJI_DATA_DIR` | `./data` | storage root for `tokens.json` and every kit |
| `CHROME_PATH` | the macOS Chrome path | the browser the renderer drives |
| `FFMPEG_PATH` | `ffmpeg` on `PATH` | the encoder frames are piped into |
| `IMAJI_RENDER_SCALE` | `2` | deviceScaleFactor for the video cuts: 2 renders the 1920x1080 stage at 3840x2160 |
| `IMAJI_RENDER_FPS` | `60` | frame rate for the film, the vertical cut and the launch video (`FILM_FPS` is still read as a fallback) |
| `IMAJI_RENDER_SHARDS` | cores minus two, capped at 8 | worker processes a video render is split across |

The Docker image also sets `IMAJI_CHROME_NO_SANDBOX=1`, which adds `--no-sandbox` and `--disable-dev-shm-usage` because Chromium refuses to start as root.

A user's repository holds no configuration except three secrets and, if they want standing preferences, an optional `imaji.json` at its root. Every key is optional, and so is the file:

| Key | Values | What it means |
| --- | --- | --- |
| `outputs` | any of `x`, `linkedin`, `card`, `film`, `vertical`, `launch` | the outputs you want by default |
| `look` | `editorial`, `punchy`, `quiet` | the look, unless the release calls for another one |
| `launch` | `major` (default), `always`, `never` | when a launch video is worth making |

Chat beats the file, and the Mind can still skip a trivial release entirely.

## Repository map

```
README.md               this file
CHANGELOG.md            every release, Keep a Changelog form
AGENTS.md               the terminal install, for a coding agent (served at /agents.md)
job/JOB.md              the job description you paste to your Mind (served at /job.md)
templates/imaji.yml     the workflow you copy into your repo (served at /imaji.yml)
imaji.json              imaji's own standing preferences, an example of the optional file
docs/                   the spec, the workflow, the outputs, releasing, the review log
src/app                 front door, kit pages, API routes, text routes (Next.js App Router)
src/lib                 kit schema and validation, flat-file store, tokens, read ids
src/render              the three compositions (card, film, launch) and the renderer
src/components          the pieces the pages are built from
scripts/                the send-and-wait helper the workflow inlines, the offline checks
demo/                   the demo video, itself an HTML composition rendered by this renderer
design/                 wordmark, type and page studies. Design sources, not needed to run
Dockerfile              app plus Chromium plus ffmpeg, for a host that is not this Mac
data/                   gitignored: tokens.json and every kit that has landed
```

## Rendering

Visuals are HTML, not a diffusion model, so they come out deterministic and exactly on brand. A composition is one HTML file with one paused GSAP timeline. Every video is rendered in parallel: the frames are split into contiguous ranges, one worker process per range drives its own Chrome at twice the stage size, seeks `t = frame / fps`, screenshots every frame and pipes the PNGs into its own ffmpeg, and the parent concat-copies the segments. Outputs are 4K at 60 fps: the film 3840 x 2160, the vertical cut 2160 x 3840. The card is the film's rest frame at 1200 x 630. The launch video is a longer composition, one scene per storyboard beat, with every picture resolved to a data URL before Chrome opens so the composition itself never touches the network. Fonts are vendored (Open Sauce One, TeX Gyre Adventor, Geist Pixel), never fetched.

## It ran, for real

imaji announced imaji. On 28 August 2026 the Mind `imaji.labs` (a Minds account, Content Mind template, nothing custom) took the job from `job/JOB.md`, was onboarded from this repository's own README and CSS tokens, and then handled three releases on its own through the workflow's send-and-wait path, writing each kit and posting it to `https://imaji.s0nderlabs.xyz/api/render`. Nobody prompted it after the job:

| Kit | What it asked for | What imaji rendered, timed from the POST |
| --- | --- | --- |
| [onboarding](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/onboarding) | the sample card only | card at 2 s |
| [v0.1.0](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.1.0) | x, linkedin, card, film | card at 1 s, film at 13 s |
| [v0.2.0](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.2.0) | x, linkedin, card, film | card at under a second, film at 12 s |
| [v0.3.0](https://imaji.s0nderlabs.xyz/k/9b67acb83bf6c255a882cd82/v0.3.0) | all six | card at 1 s, film and vertical cut at 17 s, launch video at 55 s |

The card is 1200 x 630. Each film is exactly 10.000 s at 3840 x 2160 and 60 fps; the v0.3.0 launch video is 28.4 s at the same size across six beats (`text`, `capture`, `image`, `text`, `lines`, `signoff`), one of them a live screenshot of the homepage taken while the video was being made.

The Mind proposed the brand itself at onboarding, from nothing but the repository: "Brand proposed: imaji, accent #e8641a, dark ground, mono type, voice plain specific builder". One chat line corrected the type, and the Mind held the correction: every kit after it is grotesque. What it wrote to remember about v0.2.0 opens "v0.2.0 builds on v0.1.0 of s0nderlabs/imaji by making the film real", which nobody told it to say. It also left things out on purpose and said why, in the user's voice: v0.2.0's two small fixes "do not earn their own beat". Asked about its releases in a fresh conversation, it recalled all three.

A Bazaar listing comes later. A Skill is assembled and published by the Mind itself, by chat, and the description to hand it is in [docs/BAZAAR.md](docs/BAZAAR.md).

The demo video ([`demo/`](demo/)) is itself an HTML composition rendered frame by frame with the same renderer, from real screenshots and the real replies; `bun demo/capture.mjs && bun demo/render.mjs` rebuilds it.

## Platform notes

Verified on the real Minds platform during the build: the Mind reads a GitHub release itself with `HTTP_Execute`, a POST with a JSON body and a bearer header works, memory holds across conversations and across the API and the web app, a Tenet set by chat is honoured from a fresh conversation, one reply takes 27 to 66 seconds, and a full kit takes about two to two and a half minutes of Mind time, so the workflow waits up to five. The Builder API is public at `build.hellominds.ai`; there is no inbound webhook on the platform, which is why a GitHub Action is the bridge.

## Develop

```bash
bun install
bun test              # 42 tests, 4 files
bunx tsc --noEmit
bash scripts/check.sh # everything about the workflow that can be checked offline
```

`scripts/check.sh` needs no network, no Mind and no API key: it runs the parser and send-helper tests, parses the workflow YAML, runs `bash -n` over every `run:` block, round-trips the helper scripts the template embeds, and scans for an emdash or an emoji. `scripts/local-release.sh --dry-run` prints the exact message the workflow would send, without contacting anything.

## Docs

- [docs/README.md](docs/README.md): the index
- [docs/SPEC.md](docs/SPEC.md): the contract every part of the repo is built against, kit JSON to storage layout
- [docs/OUTPUTS.md](docs/OUTPUTS.md): the six outputs, what the Mind writes for each, how each is rendered
- [docs/WORKFLOW.md](docs/WORKFLOW.md): the two workflow jobs, `imaji.json`, and what to do when something fails
- [docs/RELEASING.md](docs/RELEASING.md): how a release is cut here, and why every imaji release announces itself
- [docs/BAZAAR.md](docs/BAZAAR.md): publishing the Skill to the Minds Bazaar
- [docs/DEMO.md](docs/DEMO.md): the demo video script
- [docs/SUBMISSION.md](docs/SUBMISSION.md): the hackathon submission text
- [docs/REVIEW.md](docs/REVIEW.md): the adversarial review that shaped 0.3.0
- [CHANGELOG.md](CHANGELOG.md) and [docs/releases/](docs/releases/): what changed, and the notes each Mind actually read

## Status

Hackathon build, August 2026. Current release: 0.3.0, the launch release: the launch video, the vertical cut, `imaji.json`, the agent setup path and the new identity. v1 ships one look; the Mind still picks colour, ground and type per brand.

Next: the Bazaar listing, kept current with the six outputs; more film styles behind `look`; the release comment on by default once it has been lived with. Not shipped: auto-posting, accounts, audio in the film.

## License

Apache-2.0. See [LICENSE](LICENSE).
