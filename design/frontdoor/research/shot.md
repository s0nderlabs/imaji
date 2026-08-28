# Product-shot front doors: family.co, arc.net, cursor.com

Read live on 28 Aug 2026 in qutebrowser at 1920 x 1050, DPR 2. Every number below is a computed style or a measured bounding box from the live DOM, not a memory of the site.

Lens: front doors where the product itself is the first fold. All three answer the same question imaji has to answer, which is how much of the opening screen belongs to the artifact and how little belongs to the sentence about it. They answer it very differently: family gives the artifact 100 percent of the width and puts the words in a clearing inside it, arc gives the artifact the bottom two thirds and lets it fade out unfinished, cursor demotes the headline to 26 px and gives the artifact 70 percent of the fold.

---

## 1. family.co

### First fold composition

One centred column standing inside a full bleed illustrated field.

- Header 94 px, `position: static` (it does not stick), fully transparent, no backdrop filter. The logo plus the nav cluster begins at x=448, which is the left edge of the 1024 px content column, so the nav is aligned to the text column rather than centred in the viewport. The two account actions sit at the far right, x=1276 to x=1472.
- Hero section is 554 px tall with `padding: 120px 0 96px`. Content column `max-width: 1072px` (1024 plus 24 px gutters).
- The headline occupies x=747 to x=1173, so the type island is about 426 px wide, 22 percent of the viewport. The lede below is clamped harder still, `max-width: 440px`. Everything is centre aligned.
- Behind and around it, ONE `<svg>` at 2400 x 554 positioned at left=-240, so the illustration overflows the 1920 viewport by 240 px on each side. Characters and objects cluster to the left and right of the copy and leave a clearing in the middle. The illustration is the product mood, not a screenshot.
- The action: two pill buttons side by side, centred, at y=467, each 48 px tall, 16 px apart. Primary `Download on iOS`, 210 x 48, `background: rgb(23,23,23)`, white text, `border-radius: 32px`, `padding: 0 24px 0 22px`. Secondary `Watch the Video`, 198 x 48, `background: rgb(246,244,239)`, ink text, same radius. One primary, one quiet second.
- Vertical share of the fold: header 9 percent, headline block y=221 to y=371 (14 percent), lede to y=445, buttons end at y=515 (49 percent). The bottom half of the fold is illustration only.

### Section rhythm below the fold

Viewport 1050 px, document 11315 px.

| y | height | vh | what |
|---|---|---|---|
| 95 | 1356 | 1.29 | hero (illustration plus copy) |
| 1452 | 708 | 0.67 | "Send, receive, swap. All in one place." three phone videos |
| 2160 | 778 | 0.74 | features on a beige ground, `padding: 104px 0` |
| 2938 | 694 | 0.66 | NFT section |
| 3633 | 708 | 0.67 | watch wallets |
| 4342 | 708 | 0.67 | activity |
| 5052 | 730 | 0.70 | security |
| 5782 | 744 | 0.71 | onboarding |
| 6527 | 796 | 0.76 | latest from Family |
| 7323 | 1974 | 1.88 | "Details that matter", the one set piece |
| 9299 | 853 | 0.81 | testimonials, `padding: 132px 0 112px` |
| 10153 | 501 | 0.48 | FAQ |
| 11000 | 316 | 0.30 | footer, `padding: 68px 0 96px` |

The shape is: one 1.3 vh hero, then a metronome of seven sections all between 0.66 and 0.76 vh, one 1.9 vh set piece to break it, then a deceleration to 0.81, 0.48, 0.30. Nothing is a full 1.0 vh except the hero.

### Type

- Display: a custom face named `Family`, weight 500. Hero 68 px / 74.8 lh (1.1) / `letter-spacing: -1.36px` (-2 percent). Section heads 44 px / 48 / -1.35px. Only ever weight 500, never 700.
- Body: `Inter`. Section ledes 19 px / 27 / -0.3px weight 400. Body 17 px / 26 / -0.22px. Card copy 15 px / 22 / -0.13px. Nav item descriptions 14 px / 20.
- Largest to body: 68 vs 17, a 4x range across five sizes total (68, 44, 19, 17, 15).
- Colour ladder: headings `rgb(18,18,18)`, body `rgb(71,70,69)` (a warm grey, not neutral), muted `rgba(71,70,69,0.7)`.

### Colour and material

- Page ground pure white. Card ground `color(display-p3 0.984 0.980 0.976)`, roughly #FBFAF9, a barely warm off white. Secondary button ground #F6F4EF.
- Cards: `border-radius: 12px`, `box-shadow: none`, `border-width: 0`. Containers are separated by TONE ALONE. There is no hairline between a card and the page.
- The only rule on the page is an `<hr>` with `height: 1px` and `background: rgba(0,0,0,0.05)`, zero border.
- Accent is not one colour, it is six, and each appears only as an inline coloured word inside body copy: gold, green, orange, blue, each keyed to the section it names. Never on a button, never on a background.
- No gradients anywhere in the hero. The one dark card in the grid gets `box-shadow: rgba(0,0,0,0.15) 0 0 24px 0` because it is a device frame, not a container.

### Motion

- Hero entrance: every word of the headline is its own `<span>` with inline `opacity` plus `transform: translateY(%) rotate(deg) rotateX(deg)`, so the four words flip up in sequence on load. Two lines, four spans, staggered.
- Card imagery on hover: `transform 220ms cubic-bezier(0.19, 1, 0.22, 1)`, a strong ease out quint.
- Buttons: `transition: background-color 0.1s`. Links: `0.2s ease-out`. Deliberately faster than the content motion.
- Ambient: a `hr` keyframe animating `background-position: 0 -> 100%` over `120s linear infinite`, so a dashed rule creeps almost imperceptibly. A shimmer keyframe (`background-position: 100% -> -100%`, 1200 ms) for loading states. A marquee `translateX(0 -> -50%)` for the emoji strip.

### Two moves worth stealing

1. **Put the artifact at full bleed and the words in a clearing inside it.** The hero SVG is 2400 px wide in a 1920 viewport at `left: -240px`, and the copy is clamped to a 440 px column in the middle of it, so the product surrounds the sentence instead of sitting beside it. For imaji this is the card and the film laid across the full width with the headline reading through the gap between them.
2. **Separate every container by tone and nothing else.** `border-radius: 12px`, `box-shadow: none`, `border-width: 0`, ground #FBFAF9 on white. On warm paper the equivalent is a white card on `oklch(96.6% .006 80)`, which needs no hairline at all and reads calmer than any border.

### One thing to avoid

Seven consecutive sections at 0.66 to 0.76 vh. By the fifth, the page has stopped adding information and is only adding scroll. imaji has four things to say; it should be four sections, and at least one of them should break the height pattern.

---

## 2. arc.net

### First fold composition

Two stacked full width bands, and the actual product is in the second one.

- A fixed blue header band, 96 px, `background: rgb(49,57,251)` plus `background-image: url(noise-light.png)`. Logo at x=328, five text links, no CTA. A second fixed layer at 82 px sits above it at z=100.
- Band one, an announcement, 617 px (0.59 vh): ground `rgb(255,252,236)` (cream) with `dia-background-image.png`, a soft pastel wash. Centred stack: a 60 x 60 app icon, a 36 px centred headline in a different face, a 20 px subhead at `rgba(0,0,0,0.65)`, one pill CTA 214 x 76 at `background: rgba(0,0,0,0.85)`, `border-radius: 22px`, `box-shadow: rgba(0,0,0,0.25) 0 2px 8px`, with the app icon nested inside the pill on the left and an arrow on the right.
- Below the CTA, a 1200 x 693 product screenshot inside a 1200 x **327** box with `overflow: hidden` and `mask-image: linear-gradient(rgb(0,0,0) 70%, rgba(0,0,0,0) 100%)`. The shot is deliberately taller than its box and fades to nothing rather than being cut. The video inside it carries its own harder mask at 20 percent.
- Band two, the real hero, 1070 px (1.02 vh), full bleed blue with the same noise tile: a 45.51 px pull quote centred in cream text (a press quote, not a product claim), a publication wordmark under it, two download buttons, then a 1470 x 882 product screenshot at `max-width: 1400px`, centred, with **no radius, no shadow, no card**. The screenshot supplies its own window chrome.
- The two bands are separated by a torn, scalloped edge.

### Section rhythm

Document 6265 px.

| y | height | vh | what |
|---|---|---|---|
| 90 | 617 | 0.59 | announcement band, cream |
| 707 | 1070 | 1.02 | blue band: pull quote plus first product shot |
| 1777 | 67 | 0.06 | quote marquee strip |
| 1972 | 1080 | 1.03 | feature 1 |
| 3052 | 1041 | 0.99 | feature 2 |
| 4092 | 1041 | 0.99 | feature 3 |
| 5400 | 372 | 0.35 | testimonial band, cream |
| 5772 | 494 | 0.47 | footer, blue |

Three feature sections at almost exactly 1.00 vh each, identical recipe every time: a 40 px centred blue heading, a 17 px grey one line subhead, one 1440 x 960 video in a `max-width: 1440px` box, nothing else. No cards, no bullets, no icons.

### Type

- Display: `Marlin Soft SQ`, weight 700, tracking held at -4 percent at every size: 45.51 px / -1.82px, 40 px / -1.6px, 28 px / -1.4px.
- Body: `InterVariable` 17 px / 25.5 lh, weight 500, colour `rgb(105,105,105)`.
- Mono: `ABC Favorit Mono` at 12 px, uppercase, `letter-spacing: 1.8px`, used for exactly two things, a "MORE DETAILS" affordance and the `@handle` under each quote.
- The announcement band imports two more faces, `Exposure VAR` for its 36 px headline and `ABC Oracle` for its 20 px subhead. Four families on one page.
- Largest to body: 45.5 vs 17, only 2.7x. The headline is loud through weight and tracking, not size.

### Colour and material

- Grounds: cream `rgb(255,252,236)` for banners and testimonials, white for `main`, blue `rgb(49,57,251)` for the header, the hero band and the footer.
- The accent is used at panel scale, not as a highlight. Blue is a whole band you scroll through, three times.
- Texture: `background-image: url(noise-light.png)` tiled on top of the flat blue. Flat colour plus a noise PNG, exactly the technique available with `assets/grain.png`.
- Band edges: `mask-image: url(desktop-banner-mask.svg)` with `mask-size: auto 100%` and `mask-repeat: repeat-x` on a 122 px strip. That is how the torn, scalloped seam between the cream and blue bands is made: one small SVG tile repeated across the width as a mask.
- Product media: `border-radius: 0`, `box-shadow: none`, no container background. The only softening is the linear gradient mask on the fold shot.

### Motion

- One keyframe drives the quotes: `scroll: translateX(0%) -> translateX(-100%)`, an infinite marquee.
- Nav links: `transition: transform 0.15s, background 0.15s`, so they lift on hover rather than just tinting.
- Primary CTA: `background 0.2s ease-in-out`.
- The best mechanic is scroll driven: the 617 px announcement band re-composes into a `position: fixed` 122 px strip at `top: 91px` carrying the same headline and the same pill, with the torn mask on its bottom edge. The banner does not disappear, it condenses.

### Two moves worth stealing

1. **Fade the fold shot out instead of cropping it.** A 693 px image inside a 327 px box with `overflow: hidden` and `mask-image: linear-gradient(#000 70%, transparent 100%)`. The visitor sees a real artifact that is clearly bigger than the window, which is an invitation to scroll and costs nothing. Point it at `assets/card-v020-tl.jpg`.
2. **Make the seam between two grounds a repeated SVG mask.** `mask-image: url(edge.svg); mask-size: auto 100%; mask-repeat: repeat-x` on a strip is a torn paper edge in three lines of CSS, which is the honest way to get "paper" without a decorative border.

### One thing to avoid

Four type families and an infinite quote marquee, plus an announcement band that pushes the actual product below the fold. A visitor who lands here sees an ad for a different product before they see the product. imaji has one fold to show a real kit; nothing may sit above it.

---

## 3. cursor.com

### First fold composition

The most extreme demotion of the headline of the three, and the closest model for imaji.

- Fixed header, 52 px, dark. Logo at x=308, nav centred (x=742 to x=1178), right cluster: `Sign in` plain, `Contact sales` outlined pill, `Download` filled pill.
- Section `padding: 112px 20px 67.2px`. Container `max-width: 1300px`, so the left edge is x=310, flush under the logo.
- The H1 sits at y=164, **left aligned**, `max-width: 658px`, and is only **26 px / 32.5 lh / weight 400 / letter-spacing -0.325px**. Two lines. It reads as a caption, not a banner.
- Two pill buttons directly under it at y=251, height 43, gap 10 px: filled `rgb(237,236,236)` with `rgb(20,18,11)` text, then `rgb(38,36,30)` with light text. Both 16 px, both fully rounded, both carrying a trailing glyph (a download arrow, a right arrow).
- At y=351, one demo panel 1300 x 735, `border-radius: 4px`, `overflow: hidden`, `background: linear-gradient(oklab(0.94 ... / 0.05) 0%, same 100%), linear-gradient(rgb(27,25,19) ...)`, that is a 5 percent white wash over an elevated dark ground. `box-shadow: none`. It bleeds past the bottom of the fold.
- Proportions of the fold: headline plus buttons occupy y=164 to y=294, about 12 percent. The demo occupies y=351 to y=1086, about 70 percent. Whitespace above the headline is 112 px of section padding on top of the 52 px header.

### Section rhythm

Document 8384 px.

| y | height | vh | what |
|---|---|---|---|
| 52 | 1101 | 1.05 | hero |
| 1397 | 715 | 0.68 | feature row 1 |
| 2202 | 715 | 0.68 | feature row 2 |
| 3006 | 770 | 0.73 | feature row 3 |
| 3866 | 770 | 0.73 | feature row 4 |
| 4703 | 700 | 0.67 | quotes |
| 5403 | 739 | 0.70 | models |
| 7579 | 346 | 0.33 | closing CTA |
| 7858 | 526 | 0.50 | footer |

Everything after the hero is 0.67 to 0.73 vh. The only breaks in the rhythm are the closing CTA at 0.33 and the footer at 0.50.

**Feature row structure** (worth copying exactly): a 1300 px container split into 415 px and 840 px, roughly 32 / 65 with a gap. Text block on the left, vertically centred against an 840 x 680 media panel on the right. Heading and description are the SAME size, 22 px / 28.6 lh: the heading is full ink `rgb(237,236,236)`, the description is the same colour at 60 percent alpha. Under them, one accent link at 16 px. That is the whole row. No icon, no bullet, no card.

### Type

- One face, `CursorGothic`, at **weight 400 everywhere**, including the 72 px closing headline.
- Scale: 72 (the closing CTA only) / 36 (section head) / 26 (H1) / 22 (row head and row body) / 16 (body, buttons) / 14 (nav).
- Tracking scales with size: -2.16px at 72 (-3 percent), -0.72px at 36 (-2 percent), -0.325px at 26 (-1.25 percent), -0.11px at 22, `normal` at 16 and below.
- Largest to body across the page is 72 / 16 = 4.5x, but the hero headline to body is only 26 / 16 = **1.6x**. The page has no loud type until you reach the bottom.
- Guest faces appear only INSIDE the product screenshots (EB Garamond in a mock landing page, Lato in mock UI chrome), which reads as the product having range rather than the site being indecisive.

### Colour and material

The cleanest token system of the three, and directly portable.

```
--color-bg:            #14120b            /* warm near black, not pure black */
--color-text-primary:  #edecec
--color-text-muted:    color-mix(in oklab, #edecec 60%, transparent)
--color-border:        color-mix(in oklab, #edecec 10%, transparent)
--color-border-bright: color-mix(in oklab, #edecec 20%, transparent)
--color-bg-elevated:   #1b1913
--color-bg-hover:      #201e18
--color-accent:        #f54e00
--transition-fast:     .14s
```

- One ink, one ground, and every other value is that ink mixed toward transparent. Muted text is not a second grey, it is the same grey at 60 percent.
- The accent `#f54e00` appears ONLY on inline links: "Learn about agentic development", "Explore models", "View all blog posts". It is never a button fill, never a background, never a heading. This is exactly the discipline the imaji brief asks for with Tigerlily.
- Separation: a 10 percent ink hairline plus a 5 percent white wash on the elevated panel. `box-shadow: none` on every panel measured. Not one shadow on the page outside form controls.
- Radius language keyed to role: 4 px for media panels and small controls, fully round for buttons. Two values, nothing in between.

### Motion

- `--transition-fast: .14s` is the house duration, applied to almost every hover: `.prose-column a { transition: opacity var(--transition-fast) }`, `.control-button { transition: all var(--transition-fast) }`.
- Entrance keyframes are deliberately tiny: `fadeSlideUp: opacity 0 -> 1, translateY(2px) -> 0`. Two pixels. `fadeSlideRight: translateX(-2px) -> 0`. The only larger entrance is `gallery-marquee-item-slide-up` at `translateY(25%)`.
- Dropdowns: `opacity 0.14s cubic-bezier(0.25, 1, 0.5, 1)`.

### Two moves worth stealing

1. **Demote the headline to a caption and let the artifact be the fold.** 26 px, left aligned at the same x as the logo, `max-width: 658px`, with 70 percent of the fold given to one product panel. imaji has a real card and a real film; if the page says "one release in, a whole launch kit out" at 26 px and shows the v0.2.0 kit at full size, the claim is proved before it is read.
2. **Derive the entire palette from one ink with `color-mix`, and spend the accent only on inline links.** Muted body, hairlines and hover grounds all become `color-mix(in oklab, <ink> N%, transparent)`, so the page cannot drift off temperature, and Tigerlily stays reserved for the one coloured word and the one primary action exactly as the brief demands.

### One thing to avoid

The hero panel is a live composite of four overlapping app windows over a painting. At a glance it reads as texture, not as a message: you cannot tell what the product does without stopping to parse it. imaji's fold shot must be legible in one second, which means one artifact large and calm, not a collage. Also avoid burying the biggest type on the page (72 px) at 7,579 px down where most visitors never arrive.

---

## Cross-cutting observations

- **None of the three puts its product shot in a card.** No shadow, no border, no gradient frame. arc uses no radius at all, cursor uses 4 px, family only frames device mockups because a phone is already a frame. The shot is the object; the page is the table.
- **All three left the hero headline smaller than instinct suggests.** 68 px (family, but only 22 percent of the width), 45.5 px (arc, and it is a quote), 26 px (cursor). None uses the 100 px plus banner that generic landing pages reach for.
- **All three keep the primary action to one filled pill plus one quiet second**, 43 to 48 px tall, fully rounded, with a background only transition of 0.1 to 0.2 s. Never three buttons, never a shadow on the button.
- **Two of the three ground themselves in warm off white rather than pure white** (arc `#FFFCEC`, family cards `#FBFAF9`), and cursor's dark is warm too (`#14120b`, not `#000`). This matches the imaji brief's warm paper default and its "never pure black" rule.
- **Section heights cluster at 0.67 to 0.75 vh**, not at 1.0. A section that exactly fills the viewport reads as a slide; a section at 0.7 vh shows its own edges and keeps the page reading as a document.

---

## Three front-door archetypes this suggests for imaji

### A. The kit on the table

The page opens with no banner: header, a lot of air, and then the real v0.2.0 kit laid out at full bleed across the width, the 1200 x 630 card at the left and the ten second film autoplaying at the right, with the headline set at 40 to 48 px in the clearing between them and the lede clamped to 440 px, family's move of putting the sentence inside the artifact rather than above it. Under the fold the page slows to three sections of about 0.7 vh: the three "why a Mind" lines set as three plain paragraphs with no icons and no cards, then the kit's own text (tweet, thread, LinkedIn) as three white cards on warm paper separated by tone alone at 12 px radius with no border and no shadow, then the three steps as three numbered rows each with one primary action. It closes on the footer line at 0.3 vh, and the only Tigerlily on the page is one word in the headline, the three step buttons, and the wordmark dots.

### B. Caption and specimen

Cursor's structure, executed on paper: the headline sits at 26 to 30 px, left aligned flush with the wordmark, weight 400, `max-width: 660px`, with the two step actions as pills directly beneath it, and then 70 percent of the fold belongs to one specimen, the v0.2.0 card at 1200 px wide sitting on the paper with a 4 px radius and no shadow, bleeding past the bottom edge under a `linear-gradient(#000 70%, transparent)` mask so it is visibly larger than the window. Below the fold, four rows all at 0.7 vh built on a 32 / 65 split: the text block vertically centred on the left with the heading and its description at the SAME size distinguished only by ink at 100 percent and 60 percent, and the artifact on the right (the film, the thread, the LinkedIn post, the "how it was made" line), which lets the page carry all the kit content without a single feature grid. The palette is derived from one ink with `color-mix` so muted text, hairlines and hover grounds cannot drift, and Tigerlily appears only on inline links and the one primary action.

### C. Two grounds, one torn seam

The page is built from two alternating grounds, warm paper and one deep warm ink band, with the seam between them cut by a repeated SVG mask (`mask-size: auto 100%; mask-repeat: repeat-x`), arc's mechanism used once rather than four times: the fold is paper, holding the wordmark, the headline, the lede and the card, and the film sits in the ink band immediately below where a dark ground makes ten seconds of motion look like cinema instead of an advert. Section rhythm alternates paper at 0.7 vh (the three "why a Mind" lines, then the kit copy) and ink at 0.7 vh (the film, then the three steps), so the reader always knows which register they are in, and grain.png at 5 percent with `mix-blend-mode: multiply` is fixed over the whole page so both grounds share one material. The closing move is the footer sentence set larger than anything else on the page except the headline, on paper, with the Apache-2.0 line and the GitHub link quiet beneath it in mono at 12 px.
