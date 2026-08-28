# Motion-led and cinematic front doors

Lens: motion. Three sites read live at 1920 x 1050 in one tab, DOM and computed styles pulled with `eval`, scrolled and re-read. Every number below is measured, not remembered.

---

## framer.com

### First fold

Ground is pure black. Fixed nav 64 px, transparent, 14 px Inter, links at 60% white, one filled white pill (66 x 30, radius 8) for "Sign up". The content column is 1200 px wide, centred (x 360 to 1560).

The hero section is 981 px, 0.93 of the viewport, and it is a **single left-aligned column, not a split**:

| band | y | size | note |
|---|---|---|---|
| h1 | 164 | 721 x 108 | 60% of the column wide, so it wraps to two lines and leaves 40% of the column empty on the right |
| actions | 297 | 149 x 34 and 143 x 35 | primary filled white, secondary `rgba(255,255,255,.1)`, both radius 8, labels 14 px |
| live proof | 305 | flush right at x 1293 | "#14 on OpenRouter: 404.9B tokens this week", numbers at full white, words at 60% |
| product | 372 | 1200 x 673 | autoplay muted loop video, full column width, radius 15 to 20 px |

Proportions of the fold: nav 6%, headline plus actions 29%, video 64%. The video is deliberately **cropped by the fold**. The one action sits at the far left of the column, the live stat at the far right, on the same baseline.

### Section rhythm below the fold

Total scroll height 10877 px. As multiples of the 1050 viewport: hero 0.93, customer logo strip 0.32, "Agents that work alongside you" **2.87** (containing a 0.61 sub-scene), "Not just vibes, a full platform" 1.73, "Shipped with Framer" 1.18, "Trusted by teams" 0.78, community 1.16. The rhythm is one short strip against one very tall scroll scene, alternating. Nothing is a neat 1.0.

### Type

- Display: `GT Walsheim Medium`, 54 px, weight 500, letter-spacing **-2.16 px (-0.04em)**, line-height 54 px (1.0), white.
- Section heads: same face, 44 px, ls -1.76 px (-0.04em), lh 48.4 (1.1).
- Body: `Inter Variable`, 18 px, w400, ls -0.2 px, lh 24.3 (1.35). Primary text pure white, secondary `rgba(255,255,255,0.6)`.
- UI: 14 px ls -0.2 px. Small labels 13 and 12 px at w500 and w600.
- Scale: 54 / 44 / 18 / 15 / 14 / 13 / 12. Largest to body ratio **3.0**.

Two faces only, and the whole hierarchy is carried by SIZE plus a white-to-60%-white opacity ramp. Weight barely moves: everything is 400 or 500.

### Colour and material

Ground `rgb(0,0,0)`. Card grounds step `rgb(17,17,17)` then `rgb(23,23,23)` then `rgb(36,36,36)`, a three-stop neutral elevation ramp. Separation is by tone first, then `inset 0 0 0 1px rgba(255,255,255,0.1)` and `1px solid rgba(255,255,255,0.06)`. Accent `rgb(0,153,255)` appears only inside the product mock (selection outlines, `rgba(0,153,255,0.22)` fills). Shadows are rare and enormous, and they scale as a family: `0 12px 19px`, `0 16px 26px`, `0 26px 42px`, `0 36px 57px`, all at `rgba(0,0,0,0.2)`. Radii: 8 px dominates (41 uses), 15 and 20 px for big media, 4 to 6 px for chips. Texture is an animated grain layer.

### Motion

- **Entrance:** framer-motion appear animations via WAAPI, 400 ms, driving inline `opacity` on 1632 elements.
- **The below-fold reveals are bound to scroll POSITION, not to a trigger.** Measured: a block resting at `opacity: 0.2; translateX(-20px)` read exactly `opacity: 0.715; translateX(-7.13px)` when scrolled part way in, and **stayed at 0.715 after 1.2 s of settling**. The value is a function of scroll offset, so scrolling back un-reveals it.
- **Depth by blur, not shadow:** a ring of cards on `matrix3d` rotateY with `filter: blur()` graded by angle. Measured front to back: 0px, 0.22px, 0.75px, 1.28px, 1.5px.
- **Animated grain:** `@keyframes betterGrainWebpFramesV22 { 0% {background-position: 0 0} 100% {background-position: 0 var(--grain-range-y)} }`, 750 ms linear infinite over a webp sprite sheet, so the grain boils like film stock.
- **Text shimmer:** `@keyframes shimmer { 0% {background-position: 200% center} 100% {-100% center} }`, 5 s linear infinite on gradient-clipped text.
- **Out-of-phase ambient loops from ONE keyframe:** `ghostFlow` (opacity 1, 0.6, 0.3), 750 ms infinite, applied to a group of spans with negative delays of 0, -187.5, -375 and -562.5 ms, so a row of dots flickers out of step from a single 3-stop keyframe. Currently `paused`, so they are IntersectionObserver-gated.
- Hover and press on the CTAs: nothing measurable beyond `transition: all`. The craft is entirely in the entrance.

### Two moves worth stealing

1. **Bind the reveal to scroll progress, not to a one-shot trigger.** Map scroll offset to `opacity 0.2 to 1` and `translateX -20px to 0` so a block is partly revealed while it is partly on screen (measured 0.715 and -7.13 px mid-entry), which makes the page feel attached to the wheel instead of playing a canned animation at you.
2. **Grade `filter: blur()` by depth instead of adding shadows** (0, 0.22, 0.75, 1.28, 1.5 px measured across a card ring), which is exactly how to sit the v0.1.0 card visibly behind the v0.2.0 card with no drop shadow anywhere on a paper ground.

### One thing to avoid

The 2.87-viewport scroll scene. It earns its length because five distinct sub-scenes happen inside it. imaji has one film and one kit, so the same structure would be padding, and the fold-cropped 1200 x 673 video is right for a ten-minute product tour and wrong for a ten-second film that should be seen whole.

---

## zed.dev

### First fold

Ground `rgb(17,18,22)`. The 57 px header has its own slightly different ground, `rgb(18,19,22)`, so the bar reads as a separate plate rather than a floating strip. Under it a 36 px announcement rail, one centred sentence, label in pale blue, body near-white, trailing arrow.

Content column 1120 px (x 400 to 1520), and **the column is drawn**: two 32 px SVG rails at x 368 and x 1520, plus corner crosshair ticks at every column intersection, so the page reads as an architectural drawing sheet.

The hero section is only **448 px, 0.43 of the viewport**, and everything in it is centred:

| band | y | size |
|---|---|---|
| h1 | 211 | 388 x 58, one line |
| lede | 277 | 512 x 48, two lines |
| actions | 357 | 163 x 36 primary, 152 x 36 secondary, 8 px gap |
| microcopy | 405 | 283 x 20, "Available for macOS, Linux, and Windows", 13 px |

Total ink in the hero: 214 px. Immediately at y 542, a 98 px three-column strip (Fast / Agentic / Collaborative), each 324 px, a 15 px serif title over a 13 px two-line body, **no icons**. Then at y 640 the product: a 1120 x 770 canvas at full column width with a small "Watch Demo" tab straddling its top edge (radius `0 0 4px 4px`, so it hangs off the top like a file tab). The canvas is cropped by the fold.

Proportions: nav and banner 9%, hero 34%, feature strip 9%, product 39% visible.

### Section rhythm below the fold

Eleven sections, all `min-h-[450px]`, measured as multiples of the viewport: 0.43, 0.83, 0.69, 1.06, 0.43, 0.54, 0.72, 0.77, 0.56, 0.55, 0.43. An **exact 14 px spacer between every single one**. Nothing is full-bleed tall, the tallest is 1.06, the average is 0.63. Total 8207 px. This is the densest of the three, and the discipline is that no section is allowed to fill the screen.

### Type

Three faces, split strictly by job:

- Display: `plexSerif` (IBM Plex Serif), **italic**, 48 px, weight **320** on a variable axis (lighter than regular), ls -0.96 px (-0.02em), lh 57.6 (1.2), colour `lab(77.5 -6.46 -36.42)`, a pale blue, **not white**.
- Section heads: `plexSerif` 25.6 px, w360, white. Small titles 15 px plexSerif, white.
- Body and UI: `writer`, a custom sans, 16 px w400 ls -0.4 px lh 24 (1.5), colour `oklch(0.747 0.015 262.9)`, a cool grey. Nav 14 px ls -0.35 px. Microcopy 13 px.
- Code: `zedMono` 12 px, lh 20.
- Scale: 48 / 25.6 / 16 / 15 / 14 / 13 / 12. Largest to body ratio **3.0**.

The single italic serif line is the only voice on the page. Everything else is quiet sans.

### Colour and material

Ground `rgb(17,18,22)`, header `rgb(18,19,22)`, panels ramp `rgb(40,44,51)`, `rgb(47,52,62)`, `rgb(59,65,77)`. Accent `lab(36.33 31.17 -81.00)`, a deep blue, restricted to the primary button and the two title colours. Hairline `1px solid oklch(0.266 0.011 262.9)`, 24 uses. Radii: **4 px for essentially everything** (54 uses), 2 px for chips, a pill radius for two badges. Texture: `noise.webp` as a page background-image. Two gradient washes only: `linear-gradient(to right, transparent, oklab(blue / 0.08) 50%, transparent)` for a rule that glows in its middle, and `linear-gradient(to top, oklab(blue / 0.03), transparent 50%)` for a floor glow.

The signature material move: the primary button carries `box-shadow: inset 0 -2px 0 rgb(5,55,148), 0 1px 3px rgba(0,0,0,0.4)` and the secondary carries `inset 0 -2px 0 rgba(169,176,188,0.08)`. That inner bottom bevel makes each button read as a physical keycap, and every label ends with its keyboard shortcut in a small inset chip (D, C, S, P).

Hairline placement trick: rules are built as `width: 10px; right: -0.5px; transform: translateX(50%)`, so a soft 10 px gradient rule lands exactly on the half-pixel column boundary.

### Motion

- `hero-rise`: `opacity 0 to 1, translateY(14px) scale(0.99) to 0 / 1`, **1200 ms `cubic-bezier(0.16, 1, 0.3, 1)`**.
- `hero-drop`: `opacity 0 to 1, translateY(-14px) to 0`, **1600 ms, same curve, delay 1400 ms**. The announcement rail drops from above only after the hero has fully settled. Two events sequenced 1.4 s apart, not a stagger.
- `fade-to-current` (opacity from 0, `both` fill) is applied at **0.7 s on some elements and 1.0 s on others**, so the offset is expressed as different DURATIONS on a shared delay: everything starts together and arrives apart.
- Press: `data-[active]:[transform: scale(0.98) translateY(0.25rem)]`. The press pushes 4 px DOWN, exactly consuming the `inset 0 -2px` bevel. Material and motion are one idea.
- `fade-on-scroll` is authored as a **native scroll-driven animation**: `@keyframes fade-on-scroll { entry 0%, exit 100% { filter: blur(0.5px); scale: 0.9 } entry 100%, exit 0% { filter: blur(); scale: 1 } }`, using the `entry` and `exit` range keywords. Defined but not bound to any element in the current render, so read it as intent rather than as shipped behaviour.
- Ambient loops, all either very slow or very small: two background SVGs spinning at **50 s** and **32 s**; a marquee at **300 s** translating 0 to -50%; a 14 s `--sweep-cycle` radar over commit dots where `sweep-grow` scales 1 to 1.6 at 2%, holds 1.3 from 6% to 22%, then returns to 1, a sharp ping followed by a slow settle; a 1 s `blink` on a terminal cursor.

### Two moves worth stealing

1. **Sequence two entrance events instead of staggering one.** Hero at 0 ms over 1200 ms, then the single announcement line drops in at 1400 ms over 1600 ms, same `cubic-bezier(0.16, 1, 0.3, 1)`. Applied to imaji: the headline and the kit arrive first, then one "why a Mind" line arrives after the page has visibly settled, which reads as the page thinking rather than the page loading.
2. **Make the press feedback consume the material.** `box-shadow: inset 0 -2px 0 <darker accent>` on the primary plus `:active { transform: scale(0.98) translateY(4px) }`, so the one action is a key you push down, and it is the only interaction state the page actually needs.

### One thing to avoid

Three type families. Zed can carry serif plus sans plus mono only because the mono is real code doing real work in a real editor. On the imaji front door the brief restricts mono to a version, a time and a filename, so a third face would have nothing to do and would read as decoration.

---

## warp.dev

### First fold

Light and cool. `html` ground `oklch(0.9925 0.0018 220)`, sections white, ink `rgb(26,21,34)`, secondary `rgb(93,89,102)`, tertiary `rgb(145,141,154)`. The ground is a dot grid, `radial-gradient(circle at 1px 1px, rgba(13,10,61,0.07) 1.2px, transparent 0)`, crossed by vertical column rules `1px solid rgba(13,10,61,0.16)` running the full width every ~197 px. The page is graph paper.

Nav 64 px, white, all-lowercase 12 px labels, one filled black "get started" button. Hero 925 px, **0.88 of the viewport**, left aligned from x 394:

| band | y | size | note |
|---|---|---|---|
| h1 | 148 | 720 x 176 | three lines, 56 px, ls -2 px, lh 58.8 (1.05) |
| lede | 342 | 560 x 43 | only 13 px |
| actions | 411 | 174 x 40 and 188 x 40 | primary `rgb(26,21,34)` filled, secondary white plus hairline, **zero radius on both** |
| microcopy | 465 | 720 x 18 | 11 px, the number in accent blue |
| figure | 598 | 1002 x 300 canvas | inside a bordered panel |

The figure is introduced by a caption bar: a `>_` chip at the far left, a centred mono caption reading `[ fig. 1 , the factory ]`, hairlines running out to both edges, a `#` chip at the far right, and a "LIVE" pill inside the panel. Under the canvas a live status line: "112 tasks, 7 agents active, 1,445 PRs shipped". A second, full-bleed 1920 x 924 canvas sits behind the whole hero. A persistent "Mute sound effects" button sits at the bottom-left: the page has audio.

Proportions: nav 6%, headline block 34%, figure 48%.

### Section rhythm below the fold

Total 7318 px. As multiples of the viewport: hero 0.88, logos **0.11**, features 0.89, three 0.69, stats **0.20**, enterprise 0.68, layers 0.67, panels 1.07, everywhere 0.82, faq 0.58, footer 0.32. A run of 0.6 to 0.9 sections punctuated twice by a very thin strip.

Below the fold the layout becomes a sticky split: on the left a numbered list 01 to 06, hairline separated, the active row tinted `rgb(246,245,251)`; on the right a figure panel captioned `[ fig. 2 : quickstart ]` that swaps with the active row. **The nav swaps identity on scroll**, becoming a full-width electric-blue bar whose links are bracketed keyboard shortcuts (`[S] SDLC`, `[Q] Quality loop`, `[E] Enterprise`), on a 0.25 s transform.

### Type

**One family for everything**, `matterMono`, a monospace, including the 56 px h1. Weights 400, 500, 600 only.

- Scale: 56 / 46 / 34 / 20 / 18 / 14 / 13.5 / 13 / 12.5 / 12 / 11.5 / 11.
- Letter-spacing **-2 px on both display sizes** (about -0.036em at 56 px and -0.059em at 34 px, a hard negative tightening that a mono needs at size), `normal` everywhere else.
- Line-height 1.05 on the h1, about 1.65 on body.
- Many labels carry `text-transform: lowercase`, button labels included.
- Largest to body ratio **4.3**, the widest of the three, and it works because the body is small (13 px) rather than because the display is huge.

### Colour and material

White and near-white grounds, one tint `rgb(246,245,251)` for the active card, ink `rgb(26,21,34)`, accent `rgb(42,30,255)` (electric ultramarine) at full strength for links and stat numbers, `rgba(42,30,255,0.06)` as its only tint. **Zero box-shadows on the entire page. Zero radii except a single 20 px.** All separation is hairlines: `1px solid rgba(13,10,61,0.16)` (22 uses), plus single-side rules `0 0 1px` in `rgb(26,21,34)` and `rgb(145,141,154)`. Texture is the dot grid alone.

### Motion

- **The reveal system, measured exactly:** `[data-motion-reveal]` sits on each section and is flipped from `hidden` to `visible` by an IntersectionObserver. Children `[data-motion-reveal-item]` rest at `opacity: 0; transform: translateY(12px)` and transition `opacity, transform` over **500 ms `cubic-bezier(0.4, 0, 0.2, 1)`** with an **80 ms delay step per index** (item 0 at 0 s, item 1 at 0.08 s). Twelve pixels of travel, no scale, no blur.
- **House tokens:** `--easing: cubic-bezier(.4, 0, .2, 1)`, `--duration-fast: .1s`, `--duration-normal: .2s`, `--duration-slow: .4s`. Every hover is 0.15 s and touches only `border-color, color, background`.
- **Content moves use a second curve,** `cubic-bezier(0.16, 1, 0.3, 1)`: `warp-lite-story-reveal` (opacity 0, `translateY(8px) scale(0.985)`) at **320 ms** for a row entering, `warp-lite-row-exit` (`translateY(4px) scale(0.97)`) at **260 ms** for a row leaving. The simulated transcript pushes old rows out as new ones arrive, and the exit is deliberately faster than the entrance.
- **Ambient life inside the figure:** `factory-run-pulse` 1.6 s ease-in-out infinite (opacity 0 to 1, scale 0.85 to 1.06) on a running dot; `warp-lite-shimmer` 1.35 s linear infinite sweeping `background-position` 120% to -120% for a thinking line; `mini-app-typing-bounce` 1.2 s `translateY(-4px)`; a 2 s cursor blink; a 26 s marquee.
- **Hover craft:** `.btn-wipe::before { transition: clip-path 0.3s cubic-bezier(0.4,0,0.2,1) }` for a fill that wipes across; `.link-underline::after { transition: width }` for an underline that grows from zero; a global `main a:not([class*="btn"]) { transition: transform .25s }` for a link nudge. The FAQ uses the standalone `translate` property, not `transform`: `transition: opacity 0.2s, translate 0.2s`.

### Two moves worth stealing

1. **The figure frame.** Introduce the real asset with a caption bar: a small chip at the far left, a centred mono caption, hairlines running out to both edges, a chip at the far right, then a live status line beneath the asset. It turns a screenshot into an exhibit and costs two hairlines and two lines of mono, which is exactly how to present imaji's real v0.2.0 card and film without a feature grid.
2. **The reveal contract as measured:** section-level attribute flipped by IntersectionObserver, children at `opacity: 0; transform: translateY(12px)`, `transition: opacity .5s, transform .5s cubic-bezier(.4,0,.2,1)`, `transition-delay: calc(var(--i) * 80ms)`. Twelve pixels and eighty milliseconds is the whole recipe, it needs no library, and it satisfies the transform-and-opacity-only rule as written.

### One thing to avoid

The blue mono kicker (`# quality loop`) above each h2. It is precisely the eyebrow the imaji brief forbids, and the page leans on it because everything is one face at one colour, so nothing else orients you. If imaji takes warp's single-family discipline, the orientation has to come from size and space, not from a label. Also: the page plays sound effects and ships a mute button. Do not.

---

## What the three agree on

- **Two curves do all the work.** `cubic-bezier(0.16, 1, 0.3, 1)` (expo out) for content arriving, 240 to 1600 ms, on both zed and warp. `cubic-bezier(0.4, 0, 0.2, 1)` for state changes and hovers, 100 to 500 ms. The brief's `cubic-bezier(.23,1,.32,1)` sits between them and is compatible with both roles.
- **Travel is tiny:** 8, 10, 12, 14 px. Nobody moves anything 40 px.
- **Scale changes are tinier:** 0.985, 0.99, 0.97, 0.95. Never below 0.95.
- **All three put the real product in the fold at full content width and let the fold crop it.** None of them shows the product complete above the fold.
- **All three ground the page in a texture:** framer an animated boiling grain, zed a static noise webp, warp a dot grid. None uses a gradient blob.
- **Elevation is a three-stop neutral ramp,** and shadow is either absent (warp, zero) or rare and enormous (framer, 12 to 36 px offsets).
- **Ambient loops are either 1 to 2 s and tiny, or 14 to 300 s and imperceptible.** Nothing loops in the 4 to 8 s band, which is the range that reads as fidgety.
- **Radius is one number, held:** 8 px (framer), 4 px (zed), 0 px (warp).

---

## Three front-door archetypes this suggests for imaji

### 1. The Exhibit

A 64 px header carries the wordmark on the left and a single ghost GitHub link on the right, then the headline sets flush left at the column edge in Die Grotesk at about 56 px with -0.035em and a 1.05 line-height, the lede sits under it at 15 px Open Sauce One in a 560 px measure, and one Tigerlily-filled primary sits beside one hairline secondary, both on the same baseline with the "about eight minutes" cost as small quiet mono at the far right of that row. The kit then arrives as a captioned exhibit: a hairline caption bar with a small chip at each end and a centred mono caption naming the release, the real card and the ten-second film inside one hairline panel on warm white, and beneath it a single mono status line carrying the real numbers, "2 min 41 s to write, card 2 s, film 12 s", followed by the three "why a Mind" sentences as three hairline-separated rows with no icons and no ticks. The three steps close the page as a numbered list, 01 to 03, hairline separated with the active row tinted a half-step warmer than the page and exactly one primary action per row, then the footer sentence with Apache-2.0, s0nderlabs and the GitHub link on one baseline. Motion is warp's contract exactly: `opacity 0 to 1` and `translateY(12px) to 0` over 500 ms on the house curve with an 80 ms step per row, and the only other moving thing on the page is the film itself.

### 2. The Cold Open

The film IS the fold: the wordmark alone sits above it at 32 px, then the real ten-second film runs at the full 1200 px content column, autoplaying muted and looping, and the headline sets beneath it so the eye lands on the moving thing first and the fold crops the last band of the caption row, promising more without a scroll cue. The headline rises 14 px over 1200 ms on the expo-out curve, and then, 1400 ms later, once the page has visibly settled, the single line "It is triggered by your work, not by you." drops in from above over 600 ms, so the page finishes arriving and then speaks; below that, the tweet, the thread and the LinkedIn post run as three plain prose blocks directly on the paper with no cards at all, separated only by hairlines, and the card image closes that run as the fifth artefact with the "what the Mind kept" line under it. The three steps then run as one quiet column of three rows, each with its time cost as small mono flush right, and the footer is a single line. Nothing else moves: no grain, no ambient loop, no hover beyond a 150 ms colour change and a `scale(.97)` press on the one primary.

### 3. The Contact Sheet

A two-column fold holds the headline, the lede and the single primary action in a 480 px left column, while the right column stacks the five kit pieces as a shallow depth ring with the v0.2.0 card sharp at the front, the v0.1.0 card behind it at 0.75 px of blur and the film behind that, no shadows anywhere, the depth carried entirely by graded `filter: blur()` on a warm paper ground. Scrolling drives the stack rather than triggering it: each piece comes forward from `opacity 0.2` and 20 px of x-offset in direct proportion to scroll position, transform and opacity only, so the reader can scrub the kit forward and back and the film takes the front position last, which is a reveal bound to scroll rather than a parallax layer and stays inside the brief's motion rule. Under the stack the three "why a Mind" lines run as a single full-width row of three, the three steps follow as three hairline-separated rows with one action each, and the footer closes on one line; the page has exactly one ambient loop, a 1.6 s opacity-and-scale pulse on the single dot that marks the kit as live, and nothing else.
