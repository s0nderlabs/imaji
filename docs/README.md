# imaji docs

Start with the [README](../README.md) for what imaji is: a job your own Mind (Minds by Animoca Brands) takes, with imaji as its hands. These are the details.

Every file below is also a page on the docs site at
[imaji.s0nderlabs.xyz/docs](https://imaji.s0nderlabs.xyz/docs), read from this
directory at request time, with the raw markdown at `/docs/<slug>.md` and the
whole set in one file at `/llms-full.txt`.

## How it works

- [SPEC.md](SPEC.md): the contract every part of the repository is built
  against. The loop, the repo layout, the kit JSON the Mind produces, the
  render API, the compositions, the storage layout, the pages, the workflow,
  the environment, the non-goals.
- [OUTPUTS.md](OUTPUTS.md): the six outputs one at a time. Size, duration, how
  each is rendered, what the Mind writes for it, and the launch storyboard's
  beat types with their durations.
- [WORKFLOW.md](WORKFLOW.md): `templates/imaji.yml` in use, which is the whole
  of what wakes the Mind. Installing it, the `onboard` and `release` jobs,
  standing preferences in `imaji.json`, the repository assets, the release
  comment, testing it offline, and what every failure means.

## Running and shipping it

- [RELEASING.md](RELEASING.md): how a release is cut here, and why publishing
  one is the same event that wakes imaji's own Mind.
- [releases/](releases/): the notes for each version, exactly as the Mind
  received them. [v0.1.0](releases/v0.1.0.md), [v0.2.0](releases/v0.2.0.md),
  [v0.3.0](releases/v0.3.0.md).
- [examples/kit.json](examples/kit.json): a complete kit, enough to POST to
  `/api/render` yourself.
- [examples/imaji.json](examples/imaji.json): the optional standing-preferences
  file, all three keys.

## Around the build

- [BAZAAR.md](BAZAAR.md): publishing the Skill to the Minds Bazaar, which is a
  conversation with your Mind rather than a file you upload. Not published
  yet; the description to hand your Mind is there.
- [DEMO.md](DEMO.md): the demo video script, beat by beat.
- [SUBMISSION.md](SUBMISSION.md): the Creative Minds Jam submission text.
- [REVIEW.md](REVIEW.md): the adversarial review of v1, kept as written. Its
  findings shaped 0.3.0 and are fixed.
