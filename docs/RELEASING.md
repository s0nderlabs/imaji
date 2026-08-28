# Releasing imaji

imaji is its own first user, so cutting a release here is not only bookkeeping:
publishing the GitHub release is exactly the event that wakes imaji's own Mind,
`imaji.labs`. Every imaji release is announced by that Mind, through the same
workflow a stranger would install, and nobody prompts it.

## The steps

1. **Bump the version.** `version` in `package.json`. Semantic versioning: a
   new output or a new surface is a minor, a fix is a patch, a change to the
   kit JSON contract or the render API's response shape is a major.
2. **Write the release notes** to `docs/releases/vX.Y.Z.md`. This file is the
   text the Mind reads, and the only thing anyone writes for it, so write it
   for a reader, not for a diff: what changed and why it matters, one bullet a
   thing, no headings the Mind has to parse. The existing notes are the house
   style.
3. **Add the changelog entry** at the top of [../CHANGELOG.md](../CHANGELOG.md):
   `## [X.Y.Z] - YYYY-MM-DD`, then only the groups that are true (`Added`,
   `Changed`, `Fixed`, and a `Tests` line with real numbers). Bullets lead with
   a bold claim and then say the specific thing. Add the link reference at the
   bottom of the file.
4. **Check it.** `bun test`, `bunx tsc --noEmit`, `bun run lint`,
   `bash scripts/check.sh`. If the workflow's helper scripts changed, run
   `python3 scripts/sync-template.py --write` first; `check.sh` fails on drift.
5. **Commit and tag.** Through the repository's own commit workflow, never a
   raw `git commit`. The tag is `vX.Y.Z`.
6. **Publish the GitHub release** with those notes:

   ```sh
   gh release create vX.Y.Z --title "imaji vX.Y.Z" --notes-file docs/releases/vX.Y.Z.md
   ```

## What happens next, without anyone doing anything

Publishing the release fires `.github/workflows/imaji.yml` on
`release: published`. The job builds one message (repo, tag, release URL, the
compare URL to the previous tag, `imaji.json`, the repository assets and the
notes) and wakes `imaji.labs` with it. From there the Mind does the work: it
reads the release, remembers the last one, decides what this one earns, writes
the kit and POSTs it to `/api/render`. The kit URL lands in the job summary a
few minutes later.

That is the whole demonstration: the release notes you wrote in step 2 are the
only prompt anyone typed.

If the Mind decides a release does not earn a kit, the job prints its reason
and succeeds. A skip is a decision the Mind is meant to make, not a failure. What to do when something
actually breaks is in [WORKFLOW.md](WORKFLOW.md).

## Versions so far

| Version | Date | What it was |
| --- | --- | --- |
| [0.1.0](releases/v0.1.0.md) | 2026-08-28 | the job, the workflow, the card, private kit pages |
| [0.2.0](releases/v0.2.0.md) | 2026-08-28 | the film, the kit index, onboarding |
| [0.3.0](releases/v0.3.0.md) | 2026-08-28 | the launch video, the vertical cut, `imaji.json`, the agent path, the new identity |

0.1.0 and 0.2.0 were cut during the build on the same day as 0.3.0; the
repository was first published at 0.3.0.
