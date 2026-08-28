# Setting up imaji from the terminal

You are a coding agent, and the person you are working for wants imaji on the repository you are in. Read this whole file, then do the four steps in order. They take about ten minutes, most of it waiting for the Mind.

With imaji installed, every GitHub release the developer tags wakes their own Mind (Minds by Animoca Brands), which turns the release into a launch kit: a tweet, a three-part thread, a LinkedIn post, a 1200 x 630 card, a ten-second film, a vertical cut of that film, and a 30 to 45 second launch video when the release is a launch. The Mind reads the release, decides which of those it earns, writes every word in the developer's voice, remembers the brand and every release before it, and skips a trivial release with a reason. imaji renders what the Mind asks for and hosts the page; it has no memory and no taste of its own. Nobody prompts the Mind after setup. Nothing is posted anywhere. Kits land on a private page.

## Ask for two things before you start

- `MINDS_API_KEY`: a Builder API key from https://build.hellominds.ai/en/console
- `MIND_ID`: the ID of the Mind that will take the job, lowercase. It must be the developer's own Mind, never a shared one: what it learns about their brand is theirs. The Mind must exist already (created in the Minds web app, which is where its starting credit comes from) and must hold a balance.

Treat both as secrets: never write them into a tracked file, never print them, never put them in a commit message. Everything below reads them from the environment.

You also need `gh` (authenticated, with access to this repository), `bun` and `curl`.

## 1. Hand the Mind the job

The Mind reads the job once and remembers it. This is the only prompt anyone writes: from here on the workflow wakes it. The conversation alias below is the same one the GitHub Action uses, so the Mind sees onboarding and releases in the same thread.

```bash
export MINDS_BUILDER_API_KEY="$MINDS_API_KEY"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
ALIAS="imaji-$(printf '%s' "$REPO" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_-' '-')"
curl -fsSL https://imaji.s0nderlabs.xyz/job.md -o /tmp/imaji-job.md
bunx @animocabrands/minds-cli@0.1.4 chat create --alias "$ALIAS" --mind "$MIND_ID"
bunx @animocabrands/minds-cli@0.1.4 send "$ALIAS" - --wait --timeout 120000 < /tmp/imaji-job.md
```

The reply is one sentence confirming the job. If `send` exits 3, the Mind is still thinking: run `bunx @animocabrands/minds-cli@0.1.4 history "$ALIAS" --limit 1` after a minute instead of sending again.

## 2. Mint a kit token

```bash
curl -fsS -X POST https://imaji.s0nderlabs.xyz/api/tokens
```

The answer is `{ "token": ..., "readId": ..., "indexUrl": ... }`. The `token` is the only credential imaji issues and it is a write credential: keep it as a secret. The `indexUrl` is where the kits will appear; tell the user that address, it is safe to share.

## 3. Wire the repository

```bash
mkdir -p .github/workflows
curl -fsSL https://imaji.s0nderlabs.xyz/imaji.yml -o .github/workflows/imaji.yml
gh secret set MINDS_API_KEY --body "$MINDS_API_KEY"
gh secret set MIND_ID --body "$MIND_ID"
gh secret set IMAJI_KIT_TOKEN --body "<the token from step 2>"
```

Commit `.github/workflows/imaji.yml` the way this repository normally commits, and push it to the default branch. The workflow does nothing until it is on the default branch.

## 3b. Standing preferences, if the user wants any (optional)

Ask the user which outputs they want by default: `x` (a tweet and a thread), `linkedin`, `card` (the 1200 x 630 social card), `film` (the ten-second film), `vertical` (a 1080 x 1920 cut of the film), `launch` (a 30 to 45 second launch video, rare). Ask whether the look should be `editorial`, `punchy` or `quiet`, and whether a launch video is worth making for a major version only (`major`), every release (`always`), or never (`never`).

If they have a preference, write it to `imaji.json` at the root of the repository and commit it with the workflow file:

```json
{
  "outputs": ["x", "linkedin", "card", "film"],
  "look": "editorial",
  "launch": "major"
}
```

Every key is optional. If they do not care, say so and skip the file: the Mind decides per release, which is the design. Tell them the file holds only standing preferences, and that anything they say to the Mind in chat overrides it.

## 4. Onboard the Mind

```bash
gh workflow run imaji.yml -f job=onboard
gh run watch
```

The Action gathers the README, package description, logo files, colour tokens and past releases and hands them to the Mind. The Mind reads them, proposes the brand itself and renders a sample card by calling imaji (allow two to three minutes). The run's summary carries the sample's URL.

## Then tell the user

Say, in your own words: the Mind has taken the job and proposed a brand; open the Mind in the Minds app, look at the sample card and correct anything in one sentence (a colour, a word they never use, light instead of dark). The Mind remembers the correction for every kit after, and correcting it in chat is the only configuration there is. From now on, publishing a GitHub release wakes the Mind and a kit appears at the `indexUrl` from step 2, without anyone prompting it again. They can also ask the Mind directly in chat ("make a launch video for v0.2.0", "the card again, warmer") and the result lands on the same page.

Tell them the kit token is a write credential that now lives only in the repository secrets, and that the `indexUrl` is safe to share because it carries a read id, not the token.

## If something fails

- `chat create` says `alias_mind_mismatch`: the alias already belongs to another Mind. Use the other Mind, or pick a new alias suffix and set the same alias in the workflow's `ALIAS=` line.
- `send` returns a balance error: the Mind has no credit. The user tops it up in the Minds app; do not resend until then, a message sent at zero balance wedges the thread.
- `/api/tokens` returns 429: too many tokens from this address this hour. Wait, do not loop.
- The onboarding run is green but the Mind replied with nothing useful: run it again once. The Mind is allowed to ask one question, and the user answers it in chat; it can also decline an instruction and say why, which is not a failure.
