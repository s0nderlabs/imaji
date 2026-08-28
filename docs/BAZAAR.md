# Publishing imaji to the Minds Bazaar

A Bazaar skill is not a file you upload. Your Mind assembles it from a plain-language description and publishes it when you ask, which is the point: even the listing is work the Mind does. The only public part is the description paragraph. This is the one to use. imaji's own listing is not published yet.

## Skill name

imaji: release to launch kit

## Public description (paste to your Mind, then say "Publish this Skill to the Bazaar as imaji")

imaji turns a GitHub release into a launch kit, written by the Mind that takes the job and rendered by imaji. When a release is published, a GitHub Action wakes the Mind with the release notes; nobody prompts it. The Mind reads them and decides what the release deserves (a tweet and a thread, a LinkedIn post, a 1200 by 630 social card, a ten-second film, a vertical cut of that film for Shorts and Reels, a thirty to forty-five second launch video when the release is a launch, or a deliberate skip for a trivial release), writes the copy in the developer's voice, remembers the brand and every earlier release, and posts a kit JSON to imaji's render service, which returns a private kit page with everything on it. Nothing is auto-posted. Setup is one pasted job description, one workflow file, three repository secrets. For solo builders who only ship. Job description and workflow: github.com/s0nderlabs/imaji.

## What to tell the Mind when assembling the skill

- The playbook is `job/JOB.md` verbatim.
- The only tool it needs is HTTP_Execute, for `POST <render endpoint>/api/render` with `Authorization: Bearer <kit token>` and a JSON body.
- No app connection, no OAuth, no scheduled cadence: the skill is triggered by messages from the workflow.

## Notes from the platform

- Publishing is conversational; there is no API route and no shareable URL. The listing detail is a modal on hellominds.ai.
- A listing updates in place: hand your Mind the new description and ask it to update the Skill. The description above covers all six outputs ([OUTPUTS.md](OUTPUTS.md)); an earlier draft named only the card and the film, because that was all v0.2.0 had.
- Skill names are not unique across the Bazaar. Keep the s0nderlabs repo link in the description so people find the right one.
- Publish before recording the demo, never during a take (it costs a few cognitions and takes a minute). Until it is published, say the listing comes later rather than that it is available.
