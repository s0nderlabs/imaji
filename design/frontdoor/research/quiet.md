# quiet: three developer front doors, measured

Lens: developer tools with quiet, precise front doors. Sites read live in one qutebrowser tab on 28 Aug 2026, viewport 1920 x 1050 at dpr 2. Every number below is a computed style or a bounding rect read off the live DOM, not a recollection. Section heights are given both in pixels and as a multiple of the 1050 px viewport, written "vh".

---

## 1. linear.app

Document height 10018 px. Content column 1344 px wide (max-width 1436), 32 px side padding, laid out as a 12 column grid of 106.66 px. `--page-max-width` is 1024 px but the homepage overrides it.

### First fold composition

A single left aligned column, three quarters air, with the product cropped at the bottom edge.

- **Header**, 72 px tall, full width, `background-image: linear-gradient(rgba(11,11,11,.8), oklab(.149 ... /.76))` plus `backdrop-filter: blur(20px)`. No border. Wordmark at x=318, nav items centre right at 13 px in tertiary grey, then "Log in" as bare text and one white pill "Sign up" (bg `#e5e5e6`, text `#08090a`, radius 9999, 13 px weight 510). That pill is the only filled control above the fold.
- **Air**: nothing between y=72 and y=272. Two hundred pixels, about a fifth of the viewport.
- **Headline** at y=272: two lines, 64 px / 64 px line height, weight 510, letter-spacing -1.408 px (-0.022 em), colour `#f7f8f8`, left aligned, lines 703 and 784 px wide, so about 58 percent of the column measure.
- **One row at y=432**: the lede on the left (15 px / 24, ls -0.165 px, colour `#8a8f98`, 505 px wide) and, flush right at x=1496 on the same baseline, a 104 px micro link, "New" in secondary grey plus "Loops" with an arrow in tertiary. That is the entire right half of the fold.
- **The product** starts at y=476: a full bleed 1920 px image behind, and a 1344 x 720 app frame that bleeds past the text column and is cut off by the fold (the frame runs to y=1246, the viewport ends at 1050).

Proportions of the fold: roughly 26 percent air, 20 percent type, 0 percent buttons (the action is in the header), 54 percent cropped product.

### Section rhythm below the fold

| top | height | vh | what |
|---|---|---|---|
| 0 | 1358 | 1.29 | hero plus cropped app frame |
| ~1560 | small | 0.1 | logo strip, "POWERING THE COMPANIES BUILDING THE FUTURE" |
| 1659 | ~280 | 0.27 | one 48 px thesis paragraph, colour `#8a8f98`, max-width 1250 |
| 1939 | 468 | 0.45 | three FIG blocks (FIG 0.1, 0.2, 0.3) on the 12 column grid |
| 2609 | 1225 | 1.17 | feature section 1 |
| 3844 | 1227 | 1.17 | feature section 2 |
| 5081 | 1231 | 1.17 | feature section 3 |
| 6322 | 1219 | 1.16 | feature section 4 |
| 7703 | 421 | 0.40 | changelog, 4 columns of 272 px |
| 8284 | 564 | 0.54 | customer quotes |
| 9072 | 228 | 0.22 | prefooter CTA, 72 px / 72 heading, two pills |
| 9524 | 494 | 0.47 | footer |

Every feature section is built the same way: a 2 x 672 px grid header, 251 px tall, heading left and paragraph right, both aligned to the top; then an illustration panel about 600 px tall (0.57 vh). Four identical blocks is the spine of the page.

### Type

One family does display and body: **Inter Variable**. **Berkeley Mono** appears only inside the product mock, at 10 to 14 px, for a branch name, a file path and an inline `vehicle_state` token.

- 72 px / 72, w510, ls -1.584 px (prefooter)
- 64 px / 64, w510, ls -1.408 px (h1)
- 48 px / 48, w510, ls -1.056 px (section h2)
- 20 px / 26.6, w590, ls -0.24 px
- 15 px / 24, w400, ls -0.165 px (lede)
- 13 px / 19.5, w400 or w510 (nav, footer headings)

Largest to body is 64 : 15, about 4.3x. Weights are 400, 510 and 590 only. Tracking is negative and proportional, near -0.022 em at every display size and about -0.011 em at text sizes.

### Colour and material

- Page ground `#08090a`. Secondary surface `#1c1c1f`. Panel `#0f1011` at opacity 0.8.
- Text `#f7f8f8`, secondary `#d0d6e0`, tertiary `#8a8f98`.
- Lines `--color-line-primary #37393a`, `--color-line-secondary #202122`. Hairlines are drawn as 0.5 px or 1 px divs, or as `box-shadow: inset 0 0 0 1px rgb(35,37,42)`, or as `border: 1px solid rgba(255,255,255,.08)` on a "shine" ring. Never a heavy border.
- Brand indigo `#5e6ad2` exists as a token but is used on one thing: the skip-to-content link. The visible action is white on black.
- **Texture**: `grain-default.png` tiled, `mix-blend-mode: overlay`, `opacity: 0.6`, matching the panel radius of 12 px. It is applied to panels only, never to the page ground.
- Radius language: 12 px on panels (12 12 0 0 where a panel meets the fold), 8 px on small buttons, 9999 on pills, 4 px on code chips.
- The header is separated from the page by blur and a gradient, not by a rule.

### Motion

- Token easing `--ease-out-quad: cubic-bezier(.25,.46,.45,.94)`, applied at 0.16 s to `border` and `background-color` on every button and nav item, and at 0.1 s to `color`.
- The slower signatures: `transform .4s cubic-bezier(.16,1,.3,1)` and `transform, opacity .5s cubic-bezier(.32,.72,0,1)`.
- Micro fades at 0.12 s ease-out on opacity and transform.
- No entrance stagger. The hero is simply present at load.
- The only ambient motion is an SVG grid of 25 dots running `grid-dot-r-c-upDown` (2800 ms) and `-pong` (1600 ms), linear, infinite, animating opacity between 0.3 and 1 in a travelling wave. 545 animations are running, and all but a handful are those dots.

### Two moves worth stealing

1. **The micro link on the lede's baseline.** A second destination sits flush right on the same row as the lede, at 15 px in tertiary grey, so the fold offers two places to go without a second button competing with the first. Mechanism: one flex row, lede at flex-start, link with `margin-left: auto`, no background, no border. For imaji this is where "v0.2.0, 28 Aug 2026" or the repo link belongs.
2. **Grain scoped to the artefact.** A PNG noise tile at `mix-blend-mode: overlay; opacity: .6` inherits the panel's 12 px radius and sits only inside the product frame, so the artefact reads as printed material while the page around it stays perfectly flat. Cheap, one div, and it survives any background colour.

### One thing to avoid

The 48 px thesis paragraph set in tertiary grey (`#8a8f98` on `#08090a`) at 1250 px wide. It is the lowest contrast and longest measure on the page, it is display sized so you cannot skim it, and it makes no offer. Related: four consecutive sections of identical height is a rhythm only a product with four equal pillars can afford.

---

## 2. raycast.com

Document height 15690 px. The whole page lives inside a 1204 px column; outside it the ground is black.

### First fold composition

Centred, one column, no product.

- **Navbar**: a floating bar, 1204 x 76, radius 16 px, 20 px down from the top, `background-image: linear-gradient(137deg, rgba(17,18,20,.75) 4.87%, rgba(12,13,15,.9) 75.88%)`, `backdrop-filter: blur(5px)`, `box-shadow: inset 0 1px 1px rgba(255,255,255,.15)` as a top edge highlight. Nine nav links at 14 px w500 in `#9c9c9d`, then "Log in", then a light button "Download" (117 x 36, bg `#e6e6e6`, text `#2f3031`, radius 8).
- **Air** from 76 to 370, about 28 percent of the viewport.
- **Headline** at y=370, centred: 64 px / 70.4 (line height 1.1), weight 600, letter-spacing normal, 540 px wide so it breaks to two lines.
- **Lede** at y=543: 18 px, ls +0.2 px, 786 px wide, centred, full white (not grey).
- **One action** at y=799: 173 x 36, the same light button as the navbar, centred.
- **Under-action detail** at y=851 and y=878: two rows of 12 px / 19.2 **GeistMono**. First row white: "macOS Tahoe and Apple Silicon required". Second row tertiary: "Install via Homebrew" and "Download V1".
- **A pill** at y=938: 202 x 30, radius 1000, dark red fill `#130d0e`, "The Raycast Keyboard" with an arrow.
- **Behind everything**: a 1200 x 969 `<canvas>` painting red diagonal light streaks. The only colour on the page.

Hero block total 969 px, 0.92 vh. The product screenshot does not appear until y=1417.

### Section rhythm below the fold

| top | height | vh | what |
|---|---|---|---|
| 0 | 969 | 0.92 | hero, canvas light, no product |
| 1193 | 1376 | 1.31 | "Take shortcuts, not detours." plus a 1186 x 722 device frame |
| 2569 | 720 | 0.69 | "It's not about saving time." plus keyboard art |
| 3289 | 1259 | 1.20 | "There's an extension for that." plus a 536 px horizontal reel |
| 4548 | 1447 | 1.38 | "Your Mac just got smarter." plus a rotating description list |
| 5995 | 1101 | 1.05 | "Built for professionals like you." plus a 290 px carousel |
| 7096 | 1144 | 1.09 | "Don't repeat yourself." plus a 2 x 582 px grid |
| 8241 | 986 | 0.94 | feature wall |
| 9227 | 797 | 0.76 | community, plus a 185 px video carousel |
| 10023 | 3182 | 3.03 | API section, the one outlier, contains a 56 px / 65.5 heading |
| 13205 | 1245 | 1.19 | closing "Take the short way." |
| 14451 | 1239 | 1.18 | footer |

Every section is one heading plus one artefact, between 0.7 and 1.4 vh, with a single deliberate 3 vh outlier.

### Type

**Inter** for everything, **GeistMono** for the technical undertext, "SF Pro Text" only inside product mocks.

- 64 px / 70.4, w600, ls normal (h1, the only large size in the fold)
- 56 px / 65.52, w400, ls +0.2 px (one h3 deep in the API section)
- 24 px / 38.4, w500 (the two tone captions)
- 20 px / normal, w500, ls +0.2 px (every section h2)
- 18 px / normal, w400, ls +0.2 px (lede)
- 16 px / 25.6, w500 (body)
- 12 px / 19.2, w400, ls +0.2 px, GeistMono (undertext)

Largest to body is 64 : 16, exactly 4x. The unusual choice: **letter-spacing is positive**, +0.2 px on nearly everything, which is what gives the small text its calm. Below the h1 the hierarchy is deliberately flat: section headings are 20 px, smaller than the captions under the artefacts.

### Colour and material

- Ground `#07080a`. Text white, secondary `#9c9c9d`, tertiary `#6a6b6c`, and a fourth step `#434345` reserved for "not yet revealed" text.
- Red exists only as light inside a canvas. It is never a fill on a control, never a border, never a link colour.
- The primary button is light grey `#e6e6e6` with dark text. Every other control is a translucent white or a gradient.
- Surfaces: `linear-gradient(137deg, rgb(17,18,20), rgb(12,13,15))` with `inset 0 1px 0 rgba(255,255,255,.1)`, radius 16 to 31 px. The big device frame is `rgba(0,0,0,.44)` with `0 0 40px 20px rgba(255,255,255,.03)` bloom, `inset 0 .5px 0 rgba(255,255,255,.3)` top hairline, `backdrop-filter: blur(2px)`, radius 19 px, and a faint warm `radial-gradient(85.77% 49.97% at 51% 5.12%, rgba(255,150,150,.11), rgba(222,226,255,.08))` tint at its top edge.
- Containers are separated by glow and a half pixel inset highlight, never by a drawn line. There is no visible border anywhere in the fold.
- Cards deeper down are `radial-gradient(... at 50% 30%, rgba(4,63,150,.7), rgba(5,9,29,.42))`, radius 20, `inset 0 1px 0 rgba(255,255,255,.1)`, plus `0 30px 50px rgba(0,0,0,.4)`.

### Motion

- Entrance: `fadeInUp`, opacity 0 to 1 with `translateY(20px)`, 1000 ms, once. One block, no stagger.
- Transition cluster: 0.2 s and 0.3 s ease for colour, transform and opacity; `0.15s cubic-bezier(.34,1.56,.64,1)` (overshoot) for small press feedback; `1.5s cubic-bezier(.165,.84,.44,1)` for the large frame moves; `0.3s cubic-bezier(.4,0,.22,.96)` on paired opacity plus transform.
- Ambient loops: a 1100 ms `blink` on the fake caret in every product mock (`50% { opacity: 0 }`), a 3000 ms rotating announcement, and 5000 ms linear `progress` animations that auto advance the description lists. 47 animations running.
- The caret blink is the cheapest "this is alive" signal on the page.

### Two moves worth stealing

1. **The mono line under the button.** Two rows of 12 px mono directly beneath the single CTA state the real requirement and the alternative path. It answers "will this actually work for me" without a feature list, a table or a checkmark. For imaji: "three secrets, about five minutes" on the first row, `MINDS_API_KEY, MIND_ID, IMAJI_KIT_TOKEN` on the second, in PolySans Mono at 12 px.
2. **Two tone captions.** One line where the first phrase is full white and the remainder is `#434345`, same size, same weight, no second type size and no label. "Express Yourself." carries the title, "Search for emojis and symbols and paste them into any context." carries the explanation. For imaji this is exactly how "What the Mind kept." plus its sentence should be set.

### One thing to avoid

The floating pill navbar. At 1204 px wide with a gradient fill, a 5 px backdrop blur and an inset highlight, it is a large piece of chrome sitting directly above the headline, and it needs three stacked layers to look right at all. A flush header painted on the page ground is quieter, cheaper and does not compete.

---

## 3. resend.com

Document height 12265 px. Container `max-width: 1280px`, `padding: 96px 24px`, on every section without exception.

### First fold composition

Two columns, text left and one object right, on pure black.

- **Header** at the top of the page, no background, no border. Wordmark at x=344. Seven nav buttons at 14 px w500 in `#a1a4a5`, each 58 px tall. Then "Log in" and "Get started", both radius 16, both with transparent backgrounds and only a colour difference (grey text vs white text).
- **Left column** begins at x=408, width 480 px:
  - y=288, a 218 x 32 pill, radius full, fill `#0b0e14`, with an animated conic gradient border, "Join us at Resend Forward".
  - y=352, the headline in **Domaine**, a high contrast serif: 96 px / 96 px, weight 400, letter-spacing -0.96 px (-0.01 em), two lines, 480 px wide, colour `#f0f0f0`.
  - y=564, the lede in Inter: 18 px / 27, `#a1a4a5`, the same 480 px measure.
  - y=650, two actions 48 px tall at radius 16: "Get started" (white text, dark fill) at 130 px and "Documentation" (grey text, no fill, no border) at 160 px.
- **Right column**: a 648 x 550 `<canvas>` at x=928 rendering a slowly rotating matte black cube, lit from one side.
- **Behind**: two full bleed 1920 x 1050 images providing a faint diagonal light sweep across the ground.

Split is 480 : 648, about 42 : 58, with a 100 px gutter. Hero block 950 px, 0.90 vh.

### Section rhythm below the fold

| top | height | vh | alignment | what |
|---|---|---|---|---|
| 58 | 950 | 0.90 | left plus object | hero |
| 1088 | 479 | 0.46 | centred | one sentence, then five logos in a 1280 x 479 box, border-top only, radius 24 |
| 1567 | 1296 | 1.23 | centred | "Integrate this afternoon", emblem, lede, 13 icon tiles, a 1024 x 598 code panel |
| 2863 | 967 | 0.92 | **left** | "First-class developer experience", 2 x 600 px cards |
| 3829 | 1358 | 1.29 | centred | "Write using a delightful editor" |
| 5187 | 899 | 0.86 | **left** | "Go beyond editing", 2 x 600 px cards |
| 6087 | 1367 | 1.30 | centred | "Develop emails using React", a 1109 x 600 panel |
| 7454 | 941 | 0.90 | **left** | "Reach humans, not spam folders", 3 x 357 px |
| 9026 | 1351 | 1.29 | centred | "Everything in your control" |
| 10378 | 683 | 0.65 | full bleed | "Beyond expectations", a 180 s marquee |
| 11061 | 702 | 0.67 | centred | closing, "Email reimagined. Available today." |
| 11669 | 596 | 0.57 | left | footer, max-w-5xl, 1px top border |

The alternation is the whole structure: a centred statement at 1.2 to 1.3 vh, then a left aligned pair at 0.85 to 0.92 vh, four times over. Vertical padding is 96 px everywhere, so the rhythm comes from content height alone.

### Type

Two display faces and a mono, which is one more face than either of the others.

- **Domaine** (serif) at 96 px / 96, w400, ls -0.96 px for the h1, and 76.8 px / 76.8, ls -0.768 px for the closing line. Used exactly twice, at the two ends of the page.
- **ABC Favorit** (grotesque) at 56 px / 67.2, w400, letter-spacing -2.8 px, which is -0.05 em, very tight. Every section h2. Also 20 px / 26 for sub-headings and 24 px / 33.6 inside mocks.
- **Inter** for body: 18 px / 27 and 16 px / 24, colour `#a1a4a5`; 14 px / 20 w500 or w600 for nav and buttons; 12 px / 16 for meta.
- **Commit Mono** at 12 to 16 px for code, ids and timestamps.

Largest to body is 96 : 18, about 5.3x, the widest ratio of the three. The serif carries no negative tracking to speak of (-0.01 em); the grotesque carries a lot (-0.05 em). That contrast, loose serif against tight grotesque, is what keeps them from reading as an accident.

### Colour and material

- Ground pure `#000`. Text `#f0f0f0`, secondary `#a1a4a5`. Tokens: `--color-slate-6: #d6ebfd30` (the hairline), `--color-slate-11: #f1f7feb5`, `--color-gray-11: #a1a4a5`.
- **Every hairline is the same**: `1px solid rgba(214,235,253,0.19)`, a cool white at 19 percent, and it is frequently applied to one side only (the logo wall has `border-width: 1px 0 0`, cards have `1px 1px 0`). The footer uses a slightly weaker `rgba(211,237,248,.114)`.
- Radius language keyed to role: 24 px on full width containers, 16 px on cards and buttons, 8 px on inputs and tabs, 4 px on code chips.
- **The accent is a gradient clipped to text**: `background-image: linear-gradient(to right bottom in oklab, rgb(255,196,70) 0%, rgba(254,109,21,.97) 100%); -webkit-background-clip: text; color: transparent`, applied to a single `<span>` covering half of one heading ("this afternoon"). Nowhere else on the page. A second colour, `#00a3ff`, appears only inside a product mock.
- Separation is by gradient, not by shadow: `radial-gradient(41.07% 8.33% at 50% 0%, rgba(255,255,255,.1), transparent)` as a top edge glow on panels, and `linear-gradient(transparent, #000)` as a bottom fade on cropped illustrations. Almost no box-shadow anywhere.
- No grain, no noise, no texture.

### Motion

- Entrance is **two animations, not ten**: `hero-text-slide-up-fade` (opacity 0 to 1, `translateY(16px)` to 0), 1000 ms ease-in-out, applied to the entire left column as one block; and `open-scale-up-fade` (`scale(.98) translateY(5px)` to identity), 1500 ms, on the visual.
- Tokens: `--default-transition-duration: .15s`, `--ease-out: cubic-bezier(0,0,.2,1)`, `--ease-in-out: cubic-bezier(.4,0,.2,1)`.
- Hover on the primary action is a full inversion, measured live: colour `#fff` to `#000`, background transparent to `rgba(255,255,255,.9)`, no transform, over 0.15 s.
- Ambient: a 30 s linear `rotate` driving the conic gradient on the pill border, a 6 s `disco`, a 180 s `scroll-x` marquee for the testimonial wall, and a 1500 ms infinite `cubic-bezier(.36,.66,.6,1)` transition on the hero cube. Nine animations running in total, against Linear's 545.
- The keyframe library is all four way slide fades of 4 to 5 px (`open-slide-down-fade`, `close-slide-up-fade` and so on), which is the house scale for menus and popovers.

### Two moves worth stealing

1. **The serif bookend.** A high contrast serif appears exactly twice, on the h1 and on the closing line, and never in between; everything in the middle is one tight grotesque. The page gets a beginning and an end without a single piece of decoration. For imaji: pick one display face (Die Grotesk or PolySans Slim at 96 px), use it for the headline and for the footer line "For developers who ship real things and refuse to become content creators", and nowhere else.
2. **The coloured half heading via gradient text.** `linear-gradient(to right bottom in oklab, ...)` plus `background-clip: text` on one span, interpolated in oklab so the ramp stays even. It reads warmer and less flat than a solid fill and it holds up at 56 px. For imaji, this is how the one Tigerlily word should be built: two stops around `#E2583E` in oklab, on one word, once.

### One thing to avoid

Three full bleed background images plus two canvases and a WebGL context, purely to light the hero. The effect is genuinely beautiful and it costs several megabytes and a GPU context to produce a diagonal sweep that a single `radial-gradient` would approximate. Also `#a1a4a5` on `#000` at 18 px is a thin contrast for the one paragraph that explains the product.

---

## What the three agree on

- One filled control above the fold, at most. Linear puts it in the header; Raycast centres it under the lede; Resend pairs it with a bare text link of equal size and no border.
- Air before type. All three leave 26 to 35 percent of the viewport empty above the headline.
- One family for body text, one for display if any, one mono used only for technical facts. Never a third voice.
- Hairlines are translucent white at 8 to 19 percent, or half pixel divs, or inset box-shadows. Not one of them draws a solid 1 px border in a visible grey.
- The accent colour never fills a button. It is light in a canvas (Raycast), a gradient clipped to eleven characters of one heading (Resend), or absent entirely from the visible page (Linear).
- Entrance motion is one block moving 16 to 20 px over 1000 ms, not a staggered cascade. The ongoing motion is one small looping thing: a caret, a dot wave, a rotating object.

---

## Three front-door archetypes this suggests for imaji

### The cropped kit

A flush header on warm paper carries the wordmark left and one Tigerlily action right, then a fifth of the viewport is left empty before a two line headline at 64 px in PolySans Median with -0.022 em tracking, a single grey lede line, and flush right on that same baseline one quiet mono note reading "v0.2.0, s0nderlabs/imaji, 28 Aug 2026". Immediately below, the real v0.2.0 card and the ten second film sit side by side inside one wide panel that bleeds past the text column and is cut off by the fold, so the visitor scrolls into the artefact instead of past a promise; that panel is the only place grain appears, tiled at 5 percent with multiply, and its 1 px hairline is an inset box-shadow, not a border. Below it the page holds exactly three equal bands, the three "why a Mind" sentences as plain paragraphs separated by hairlines, the written kit as three text tiles (tweet, thread, LinkedIn) with "how it was made" as a two tone caption underneath, and the three start steps as three rows each ending in one button, then a two line footer.

### The two column object

A 1280 container with 96 px of vertical air puts the hero text in a 480 px column on the left: the headline at 96 px in Die Grotesk at -0.01 em with its one coloured word carried by a two stop Tigerlily gradient clipped to the text in oklab, the lede in Open Sauce at 18 / 27 on the same 480 px measure, and two actions of unequal weight, a filled "Copy the job" beside a bare text "Read JOB.md" with no border at all. The right 58 percent of the fold is the ten second film playing silently in a 16:9 panel at 24 px radius with a single warm hairline, the only moving thing above the fold, entering once as one block with a 16 px rise over 1000 ms. The page then alternates centred statement sections at about 1.25 viewports (the three "why a Mind" lines, then the card at full width) with left aligned pairs at about 0.9 (the tweet beside the thread, the LinkedIn post beside "how it was made"), and brings the display face back exactly once at the end for the footer line, so the page is bookended and needs no other decoration.

### The single artefact, centred

Everything sits in a 1100 px column on warm paper: a plain header with no fill, then a third of the viewport of air, then a centred headline at 64 / 70 in PolySans Median, a centred lede at 18 px in full ink rather than grey, one Tigerlily button, and directly beneath it two rows of 12 px PolySans Mono giving the real cost, "three secrets, about five minutes", and the alternative, "read job/JOB.md first". The fold shows no product at all; the second screen opens with a two tone caption whose first phrase is ink and whose remainder is grey, and under it the real v0.2.0 card at the full column width in a panel lifted only by a soft bloom and a half pixel top highlight, with the film in the same frame below it. Below that, three short bands of 0.7 to 0.9 viewports, each one sentence and one artefact, the thread as three stacked quotes, the LinkedIn post as one block, and the three start steps as three rows with a single button each, closing on the footer line and nothing else.
