# The imaji workflow

`templates/imaji.yml` is the whole GitHub side of imaji. Copy it into your
repository and every release you publish wakes your own Mind (Minds by Animoca
Brands), which reads the release, writes the kit and calls imaji to render it.

The workflow is deliberately thin. It gathers evidence, wakes the Mind with one
message, waits, and reads one reply. Every decision about copy, look, what to
leave out and whether the release earns a kit at all belongs to your Mind.

## Install

1. Mint a kit token at https://imaji.s0nderlabs.xyz and keep the token.
2. Copy `templates/imaji.yml` to `.github/workflows/imaji.yml` in your repo.
3. Add three repository secrets under Settings, Secrets and variables, Actions:

   | Secret | What it is | Where it comes from |
   | --- | --- | --- |
   | `MINDS_API_KEY` | your Minds Builder API key | build.hellominds.ai/en/console |
   | `MIND_ID` | the id of your own Mind, lowercase | the Mind's page, or `minds list` |
   | `IMAJI_KIT_TOKEN` | your kit token | imaji.s0nderlabs.xyz |

4. Optional repository variables:

   | Variable | Default | What it does |
   | --- | --- | --- |
   | `IMAJI_BASE_URL` | `https://imaji.s0nderlabs.xyz` | point the workflow at another imaji server |
   | `IMAJI_POST_COMMENT` | unset | `true` comments the kit URL on the release commit every time |

5. Run the onboard job once (below), then publish a release.

The Mind ID is lowercased by the workflow before it reaches the API: owner
gated routes reject an uppercase id.

## The two jobs

Both jobs run on `ubuntu-latest`, install Bun with `oven-sh/setup-bun@v2`, and
talk to the Mind through `bunx @animocabrands/minds-cli@0.1.4`. `gh` and `jq`
are already on the runner.

A manual run asks which job you want, because both jobs answer
`workflow_dispatch`. The `job` input defaults to `release`.

### onboard

Run it from the Actions tab: pick the imaji workflow, Run workflow, set
**job** to `onboard`.

It gathers what the repository already says about itself and sends it in one
message:

- the README, first 6000 characters
- `package.json` name, description, homepage, version, license
- logo candidates: tracked files matching `logo`, `icon` or `wordmark` with an
  `.svg` or `.png` extension, as `raw.githubusercontent.com` URLs. Those URLs
  only resolve for public repositories; on a private repo the Mind will fall
  back to the brand name as text.
- theme tokens: CSS custom properties with hex values found in `globals.css`,
  `theme.css` or `tailwind.config.*`, up to 30 of them
- the last 10 releases, each body cut to 400 characters
- the render endpoint and the kit token
- `imaji.json`, if the repository has one (see Standing preferences below)

It asks the Mind to propose the brand (name, accent, ground, type, voice in
three adjectives), to remember it, and to render one sample card by POSTing a
kit with `version: "onboarding"`. The sample kit URL lands in the job summary.

Correct the brand by talking to your Mind in its own chat. The correction
sticks: the workflow never sends brand settings. The one file it does read is
`imaji.json`, and that holds standing preferences, not taste (see below).

### release

Runs automatically on `release: published`, and by hand with **job** set to
`release` and a **tag** input for a re-run. Re-running the same tag overwrites
that tag's kit, which is why re-runs are safe.

What it does:

1. checks out the tag with `fetch-depth: 0`, so the previous tag is reachable
2. reads the release body and URL through `gh api`, never through a workflow
   expression, so release notes can never turn into shell
3. derives the previous tag with `git describe` and builds the compare URL
4. writes one message: repo, tag, release URL, compare URL, the kit token, the
   render endpoint, a one paragraph reminder of the job, `imaji.json` if the
   repository has one, the repository assets, and the release notes
5. ensures the conversation (`minds chat create --alias imaji-<owner>-<name>`),
   which is idempotent and permanent per repository
6. records the newest history fingerprint, then sends with
   `--wait --timeout 300000`. A full kit takes 134 to 144 seconds of Mind time.
7. if the send exits 3, which is both a server error and a `--wait` timeout,
   polls `minds history` every 15 seconds for up to 5 minutes for a message
   newer than the recorded fingerprint that is not an echo of what we sent
8. reads the reply: a kit URL if the Mind called the endpoint itself, otherwise
   the fenced JSON out of the `<pre><code>` block, which the job then POSTs to
   `/api/render` itself
9. writes the kit URL, or `skipped: <reason>`, to the job summary
10. comments the kit URL when asked to (below)

**A skip is not a failure.** If the Mind decides a release does not earn a kit,
the job prints the reason and succeeds. The job only fails on a real failure:
a rejected API key (exit 4), a rate limit (exit 5), or no reply at all after
the wait and the polls.

### Standing preferences: imaji.json

Everything about a kit is a conversation with your Mind, and it stays that way
for taste. But a setting you never want to repeat belongs in the repository, so
both jobs read an optional `imaji.json` at the root of your repo:

```json
{
  "outputs": ["x", "linkedin", "card", "film", "vertical", "launch"],
  "look": "editorial",
  "launch": "major"
}
```

| Key | Values | What it means |
| --- | --- | --- |
| `outputs` | any of `x`, `linkedin`, `card`, `film`, `vertical`, `launch` | the outputs you want by default. `vertical` is a 1080 x 1920 cut of the film; `launch` is a 30 to 45 second launch video, and it is rare. |
| `look` | `editorial`, `punchy`, `quiet` | the look, unless the release calls for another one |
| `launch` | `major` (default), `always`, `never` | when a launch video is worth making. `major` means a major version, or notes that say this is a launch. |

Every key is optional, and so is the file. The job copies whatever parses into
the message under `--- standing preferences from imaji.json ---`, with one line
of instruction: honour them unless a rule given in chat says otherwise, and the
chat rule wins on a conflict. That is the precedence: **chat beats the file, and
the Mind can still skip a trivial release entirely.**

A file that does not parse as JSON is a warning in the log, not a failure: the
job carries on without it.

There is a copy to start from at `docs/examples/imaji.json`.

### Repository assets

The release job also appends a short `--- repository assets ---` section, which
is evidence a launch video can use rather than a setting:

- `homepage`: `.homepage` from `package.json`, or the first `https` URL in the
  README that is not a github.com link, or `none`
- up to 12 images, as `raw.githubusercontent.com` URLs, from the tracked files
  matching `.png`, `.jpg`, `.jpeg`, `.webp` or `.gif`. Anything under 2 KB is
  dropped, along with `node_modules`, favicons, icons, logos and badges, and
  paths under `docs/`, `screenshots/`, `assets/` or `public/` come first.

Those URLs only resolve for public repositories, and the line in the message
says so, so the Mind knows not to lean on them for a private repo.

### The comment

GitHub has no comment API for releases. The nearest public place to put the
link is a comment on the commit the tag points at, which shows up on the commit
page and in the tag's history. That is what the workflow does, with
`gh api repos/{owner}/{repo}/commits/{sha}/comments`, and it needs
`permissions: contents: write` on that job.

It only comments when you ask: either the `post_comment` input on a manual run,
or the `IMAJI_POST_COMMENT` repository variable set to `true`. Nothing is ever
posted to a social network.

## Why the helper scripts are inlined

The workflow runs in your repository, not in imaji's, so it cannot fetch
anything from this repo at runtime. Both jobs write two helpers to
`$RUNNER_TEMP/imaji` with a heredoc and run them from there:

- `parse-reply.py`, which reads the CLI JSON and prints one of `KIT_URL=`,
  `KIT_JSON=`, `SKIPPED=` or `NOTHING`
- `minds-send.sh`, which does the chat create, the fingerprint guard, the send,
  the history fallback and the render fallback

`scripts/parse-reply.py` and `scripts/minds-send.sh` in this repository are the
source of truth. Never hand edit the copies inside the yml. After changing
either script, run:

```sh
python3 scripts/sync-template.py --write   # rewrite the embedded copies
python3 scripts/sync-template.py           # check, exits 1 on drift
```

`scripts/check.sh` runs that check along with everything else, including a
round trip that executes the workflow's own writing step and diffs the result
against `scripts/`.

## Testing it without GitHub

```sh
bash scripts/check.sh
```

Everything offline: python and shell syntax, the parser unit tests, the
`minds-send.sh` tests against a stub CLI and a local render endpoint, the YAML
parse, `bash -n` on every `run:` block in the template, the embedded copy round
trip, and a check that the local harness sends the same brief as the workflow.
No network, no Mind, no cognition spent.

To exercise the real thing against a real Mind:

```sh
# see the exact message first, this contacts nothing
scripts/local-release.sh --dry-run <alias> <mindId> <tag> <notes-file>

# the real run, this spends the owner's cognition
export MINDS_BUILDER_API_KEY=...        # from the Keychain or .env, never printed
scripts/local-release.sh <alias> <mindId> <tag> <notes-file> \
  https://imaji.s0nderlabs.xyz <kit-token>
```

It prints the kit URL on stdout and everything else on stderr, so
`KIT=$(scripts/local-release.sh ...)` works. About 2.4 cognitions per exchange.

## When something goes wrong

| What you see | What it means |
| --- | --- |
| `alias_mind_mismatch` | the alias already belongs to a different Mind. `MIND_ID` changed under a live conversation. Pick a new alias or put the old Mind back. |
| exit 4 from the send | the Builder API key was rejected. Check `MINDS_API_KEY`. |
| exit 5 from the send | rate limited. Re-run the job. |
| `send exited 3, polling history` | normal. The wait timed out but the reply usually lands seconds later, and the poll picks it up. |
| `no reply after the wait and 20 polls` | the Mind never answered in 10 minutes. Check its cognition balance: a message sent at zero balance wedges the thread permanently. |
| `render endpoint answered 401` | `IMAJI_KIT_TOKEN` is not a token the server knows. Mint a new one. |
| `the Mind replied with nothing this job could use` | the Mind answered in prose with no URL, no JSON and no skip. The full reply is in the job log. |

Nothing in the logs carries a secret: the message is written to a file rather
than echoed, and the CLI's stderr is filtered for long tokens before it is
printed.
