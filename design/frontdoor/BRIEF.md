# imaji front door: the brief every layout is built from

Read all of it before writing a line of HTML.

## The stance (from elpabl0, verbatim: "simple, minimalistic but aesthetic, not being too much nor being less", "simple yet aesthetic")

Every archetype is executed with restraint. Fewer elements, each to a higher bar. The archetype decides the STRUCTURE of the page; it never licenses spectacle. A poster is one film and one sentence, not a light show; a console is one calm transcript, not a hacker screen; a magazine grid is four clean tiles, not twelve. If a decoration does not carry meaning, it goes. Whitespace is a material. The aim is the page a very good studio would ship: quiet, exact, warm, alive in two or three places at most. Judge your own render against this line before you finish: is anything on it "too much"? Is anything missing that a visitor needs? Both are failures.

## What imaji is (the product, in its own words)

One release in, a whole launch kit out. A developer tags a release on GitHub; a GitHub Action wakes the developer's own Mind (Minds by Animoca Brands); the Mind reads the release, remembers the brand and every release before it, writes the copy, and calls imaji to render the visuals. The kit lands on a private page: a tweet, a three-part thread, a LinkedIn post, a 1200 x 630 card, a ten-second film. Nothing is auto-posted. imaji itself has no memory and no taste; the Mind is the employee, imaji is the hands.

For solo builders who only ship.

## What the front door has to do (and only this)

It is the public page at `/`. A visitor arrives knowing nothing. Nobody's private kits can appear here. It must, in this order of importance:

1. Show what you get: imaji's OWN real kit for v0.2.0 as the live example. The assets are real, not placeholders (see Assets).
2. Say what it is in one line, and why a Mind rather than an API call (it is triggered by your work, it remembers, it can refuse a trivial release).
3. Let a developer start: three steps, each with one primary action.
   - Hand your Mind the job (copy `job/JOB.md`, about two minutes)
   - Drop the workflow in your repo (copy `templates/imaji.yml`, three secrets: MINDS_API_KEY, MIND_ID, IMAJI_KIT_TOKEN, run onboarding once, about five minutes)
   - Mint a kit token (one button, shown once, about a minute)
4. Footer: "For solo builders who only ship." Apache-2.0, s0nderlabs, GitHub link.

Nothing else. No pricing, no testimonials, no feature grids of icons, no fake logos, no "trusted by".

## Real copy (use verbatim; do not invent product claims)

- Headline options: "A developer who ships is a creator whose content is code." / "One release in, a whole launch kit out." / "Tag a release. Get the launch." Pick one; the coloured word, if any, is ONE word.
- Lede: "imaji turns each release into the posts, the card and the film they never had time to make. Your own Mind writes them, remembering every release before this one. imaji only renders."
- The example kit (v0.2.0, s0nderlabs/imaji, 28 Aug 2026):
  - Card headline: "Every release now ships a ten-second film"
  - Tweet: "imaji v0.2.0: your Mind now renders a 10-second film for every release, not just the card. Tag a release, get the kit. No prompts, no content calendar."
  - Thread: (1) "v0.2.0 is out. What changed: the film. Every release now gets a 10-second launch video rendered from HTML, on brand, deterministic, no diffusion model guessing at your logo." (2) "How it works: you tag a release, a GitHub Action wakes your own Mind, the Mind reads the notes, remembers your last release, writes the copy and calls imaji to render the visuals." (3) "Building on v0.1.0, which shipped the card and the private kit page. Next: the Bazaar listing so any Mind can take the job. imaji.s0nderlabs.xyz"
  - LinkedIn: "We shipped imaji v0.2.0. Every release your team tags now comes back as a full launch kit: a tweet, a thread, this post, a social card and a 10-second film. Your own Mind writes it, remembering every release before it. imaji only renders."
  - How it was made: "Your Mind read the release, remembered v0.1.0, and wrote this kit in 2 min 41 s. imaji rendered the card in 2 s; the film took 12 s."
  - What the Mind kept: "v0.2.0 builds on v0.1.0 by making the film real: ten seconds, four beats, rendered frame by frame from HTML."
- The three "why a Mind" lines: "It is triggered by your work, not by you." / "It remembers every release, every correction, every colour you changed." / "It refuses: a typo fix earns no kit, and it says so in your voice."

## Assets (relative to this directory; reference them by relative path, do not inline)

- `assets/imaji-5b.svg`: THE wordmark. Two paths: `.ink` uses `fill="currentColor"` (so `color:` drives it), `.dot` is the accent already. Use it inline (paste the SVG) so `currentColor` works, height 24 to 40 px in a header, bigger in a hero if the layout wants.
- `assets/card-v020-tl.jpg`: the real v0.2.0 card (1200 x 630 ratio). `assets/card-v010.jpg`: the v0.1.0 card.
- `assets/film-v020.mp4` (70 KB, 960 wide, ten seconds, silent) and `assets/film-poster.jpg`: the real film. `<video autoplay muted loop playsinline>` is allowed.
- `assets/grain.png`: a 160 px noise tile for paper grain (use at 4 to 6% opacity with `mix-blend-mode: multiply`, `position: fixed`, `pointer-events: none`). Optional.
- `assets/favicon-5b.png`.

## Fonts (ONLY these; never Geist, never Inter, never system-ui as the visible face)

All in `../fonts/` relative to this directory. Paste these declarations and pick from them:

```css
@font-face{font-family:"PolySans";font-weight:300;src:url("../fonts/polysans/PolySansTrial-Slim.otf") format("opentype")}
@font-face{font-family:"PolySans";font-weight:400;src:url("../fonts/polysans/PolySansTrial-Neutral.otf") format("opentype")}
@font-face{font-family:"PolySans";font-weight:500;src:url("../fonts/polysans/PolySansTrial-Median.otf") format("opentype")}
@font-face{font-family:"PolySans";font-weight:700;src:url("../fonts/polysans/PolySansTrial-Bulky.otf") format("opentype")}
@font-face{font-family:"PolySans Mono";font-weight:400;src:url("../fonts/polysans-mono/PolySansTrial-NeutralMono.otf") format("opentype")}
@font-face{font-family:"PolySans Mono";font-weight:500;src:url("../fonts/polysans-mono/PolySansTrial-MedianMono.otf") format("opentype")}
@font-face{font-family:"Die Grotesk";font-weight:300 700;src:url("../fonts/die-grotesk/test-die-grotesk-vf-roman.woff2") format("woff2")}
@font-face{font-family:"Open Sauce One";font-weight:400;src:url("../fonts/OpenSauceOne-Regular.ttf") format("truetype")}
@font-face{font-family:"Open Sauce One";font-weight:500;src:url("../fonts/OpenSauceOne-Medium.ttf") format("truetype")}
@font-face{font-family:"Open Sauce One";font-weight:600;src:url("../fonts/OpenSauceOne-SemiBold.ttf") format("truetype")}
@font-face{font-family:"Peace Sans";font-weight:400;src:url("../fonts/free/PeaceSans.otf") format("opentype")}
@font-face{font-family:"Tempting";font-weight:400;src:url("../fonts/free/Tempting.otf") format("opentype")}
@font-face{font-family:"Adventor";font-weight:400;src:url("../fonts/free/texgyreadventor-regular.otf") format("opentype")}
@font-face{font-family:"Adventor";font-weight:700;src:url("../fonts/free/texgyreadventor-bold.otf") format("opentype")}
@font-face{font-family:"Geist Pixel";font-weight:400;src:url("../fonts/geist-pixel/GeistPixel-Square.woff2") format("woff2")}
```

Notes: "Helvetica Neue" is a system font on this Mac and is allowed (`font-family:"Helvetica Neue"`). PolySans and Die Grotesk are trial cuts: letters, digits, space, comma, full stop, exclamation, question mark only; give them a fallback of "Open Sauce One" or "Helvetica Neue" so other glyphs still render. Peace Sans is a heavy poster face (display only). Tempting is a script (ONE word at most, the coloured word). Adventor stands in for Avant Garde Gothic. Geist Pixel is a pixel display face (display only, sparingly).

## Colour

- Accent: Tigerlily, `#E2583E` (oklch(64.5% .19 32)). It does ONE job at full strength: the coloured word and the primary action, plus the wordmark's dots. Nowhere else. Never indigo, never purple, never a second accent.
- Neutrals: pick ONE temperature and hold it. Warm paper is the house default (`oklch(96.6% .006 80)` page, white card, ink `oklch(24% .012 60)`), but a layout may be dark (ground at least `oklch(17% .008 60)`, never pure black) or cool if the archetype calls for it.
- Hairlines by `box-shadow: inset 0 0 0 1px` or tone, never `border: 1px solid`.

## Hard rules (a layout that breaks these is discarded)

1. No eyebrows, kickers or small uppercase mono labels ("ONE RELEASE IN..." style). Headings are sentences. Mono is only for a version, a time, a file name, small and quiet.
2. No status rows with green ticks, pills and chevrons. No feature grids with icons. No gradient blobs of purple. No emoji.
3. No em dashes in any text. Use commas, colons, full stops.
4. The layout must NOT be: a left rail with numbered sections (beautifului.dev). Do not reproduce that reference.
5. Real content only: the copy above, the real card, the real film. No lorem, no invented numbers, no fake logos or testimonials.
6. Motion is welcome and should be crafted: entrance stagger on `transform`/`opacity` only, `cubic-bezier(.23,1,.32,1)`, 150 to 450 ms, press feedback `scale(.97)`, `prefers-reduced-motion` respected. No parallax gimmicks, no infinite marquees of nothing.
7. Responsive: it must hold at 390 px wide with zero horizontal overflow, and at 1440. Verify (see below).
8. Self-contained HTML file with inline CSS and JS, assets by relative path. No frameworks, no CDN, no external fonts.
9. Craft: one type scale (5 sizes max), one radius language keyed to role, tabular figures on numbers, curly quotes in prose, `text-wrap: balance` on headings.

## Verify before you finish

Render it yourself and look at it. From the repo root:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,1600 --virtual-time-budget=5000 --screenshot=/tmp/fd-<name>-desktop.png "file:///Users/alkautsar/Documents/s0nderlabs/imaji/design/frontdoor/out/<file>.html"
bun design/frontdoor/probe.mjs design/frontdoor/out/<file>.html   # true 390 px mobile viewport: prints scrollWidth and any overflowing element, writes /tmp/fd-<file>-phone.png
```

Read both screenshots (the Read tool shows images). Fix what you see. Do not report done from code alone.
