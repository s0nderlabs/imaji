# Front-door research: type-led, editorial, human

Lens: how world-class, type-first front doors are actually laid out. Three sites read live in one tab at 1920 x 1050 on 28 Aug 2026: mymind.com, cal.com, lu.ma (which now serves from luma.com). Every number below comes from the live DOM and computed styles, not from memory.

---

## 1. mymind.com

**First fold composition.** One centred column, nothing else. The fold is 1050 px tall and the content block is 1440 px wide inside it, so there is roughly 240 px of ground on each side. Order down the centre line: a floating white nav pill (87 px tall, sticky, four text links plus "Log in" and an accent "Sign up" pill, all right-of-centre); then the display headline at y=150, 1102 px wide (76% of the container), two lines, dead centre; then a 500 px lede at y=445; then three platform chips at y=657; then the product, a 1098 x 779 video that starts at y=735 and is deliberately **cropped by the fold line**, with a phone mockup overlapping its right edge at y=1051. There is no hero button. The only action inside the fold is the "Sign up" pill in the nav plus the three app chips, so the fold's job is purely to state the promise and show the product beginning.

**Section rhythm below the fold.** Document height 19,850 px, about 19 viewports, which is long. The container width never changes (1340 to 1440 px). Sequence and height relative to the 1050 px viewport: hero 1.0, intro video 0.84, manifesto 2.12 (a single prose column), "try it out" 0.52, app-store strip 0.22, what-it-is 1.36, "it just works" 1.78, search 1.34, the features block 4.87 (itself a stack of five near-identical 0.72 rows), reviews 1.42, use cases 1.20, pull quote 1.24, second app strip 0.27, what's new 0.75, footer 0.80. The pattern is a long block, then a very short strip (0.22 to 0.27) used as a palate cleanser, then another long block. The repeated 0.72 feature rows give the middle of the page a metronome.

**Type.** Display is **Louize** (205TF, a high-contrast old-style serif) in Regular, Italic, Medium and Bold. Body is **Inter**; UI chrome and buttons are **Nunito SemiBold**; a few legacy strings still sit in Avenir LT. Hero: 140 px, weight 400, letter-spacing -4.19 px (about -0.03em), two lines in 287 px so leading is roughly 1.02. Manifesto: 42 px Louize Regular, line-height 50 px (1.19), colour rgb(58,71,90), with the first word "In" set in **Louize Italic at 84 px**, exactly double the body size, as an oversized opening word rather than a drop cap. The "we promise" list runs at 52 px. Body copy: 20 px Inter, line-height 40 px (2.0 exactly), rgb(74,84,101). Small labels: 18 px, and the uppercase section eyebrows ("OUR MANIFESTO") are 16 px Nunito SemiBold, letter-spaced. Largest to body is 140:20, a ratio of 7:1.

**Colour and material.** Page ground rgb(249,250,252), a very faint cool white; content sits on pure white; a second ground of rgb(255,241,241), a pale warm pink, marks the reviews, use-cases and footer blocks. Accent is a single hot orange rgb(255,89,36) used on the "Sign up" pill, the wordmark dot, and the word "NO" in the promise list. Containers are separated three ways: a 1 px rgb(226,226,226) hairline with 12 px radius on video frames; a warm coloured shadow on the main app container, `rgba(255,167,129,.44) 0 57px 60px -54px` layered with `rgba(255,128,36,.27)`, that is, the shadow is tinted with the accent rather than black; and a soft neutral card shadow `rgba(140,142,151,.32) 0 4px 7px -4px` at 16 px radius on the smaller wrappers. Texture: the fold's aurora is a 2160 x 2160 looping **video** of a soft gradient, overlaid with `radial-gradient(117.54% 92.5% at 50% 150%, rgba(255,255,255,.97) 9.51%, ...)` so the centre bleaches to near-white and the type sits on flat white while the edges stay coloured. One section boundary is a full-width vertical wash `linear-gradient(rgb(255,89,36) 0%, rgb(255,192,180) 20.88%, rgb(255,255,255) 37.26%)`, the accent used at 100% opacity for only the top 20% of the section.

**Motion.** Deliberately small. Global `a { transition: 0.2s linear }` and `input { 0.15s linear }`. The only authored keyframes that matter are `pop` / `pop-out` / `play-pop` / `play-pop-out` at 200 ms linear, used for the video play affordances, plus `coverZoom`. One element loops on a 5000 ms linear cycle. There is no scroll-entrance stagger and no parallax: with a 19-viewport page they chose to let the type carry it.

**Two moves worth stealing.**
1. Bleach the middle of a coloured field to near-white with a single radial gradient so a large display line sits on flat paper while the page edges still carry colour: `radial-gradient(circle at 50% 150%, rgba(255,255,255,.97) 10%, transparent 100%)` over the tint.
2. Open a prose block with its first word set in italic at exactly twice the body size on the same baseline, which reads as editorial authority without needing a heading, an eyebrow or a rule.

**One thing to avoid.** The uppercase letter-spaced eyebrows above every section ("OUR MANIFESTO", "IT JUST WORKS", "YOUR PRIVATE OASIS"). They are load-bearing here only because the page is 19 screens long and the reader is lost without them. The imaji brief bans them outright, and correctly: a short page does not need them.

---

## 2. cal.com

**First fold composition.** The hero is not the viewport, it is **a card**. A white sheet 1176 px wide, radius 12 px, starts at y=96 and is only 700 px tall (0.67 of the viewport), floating on a flat rgb(244,244,244) ground. Inside it, a two-column split with generous inner padding: left column 500 px wide starting at x=436 holds a small chip ("Cal.com launches v6.8"), the h1 at y=253, a 500 px lede at y=476, then **two full-width stacked buttons** at y=572 and y=620 (dark primary "Sign up with Google", light secondary "Sign up with email"), then a reassurance line at y=660. The right column, starting at x=1008, is the **live product**, a real booking widget (event card plus a month calendar) that runs off the right edge of the card and is clipped by it. Ratio is roughly 42% words, 58% product. Below the card, on the grey ground, a "Trusted by" line and a logo strip at y=844. The nav is a separate white pill floating above the card at y=27.

**Section rhythm below the fold.** Document height 8,428 px, exactly 8 viewports, less than half of mymind for a bigger product. Content column is a constant 1200 px. Heights relative to viewport: hero card 0.67, how-it-works 0.83, benefits 1.18, "and so much more" 0.54, testimonials 0.66, app store 0.43, wall of love 1.41, FAQ 0.62, closing CTA 0.37, footer 0.63. **Nothing is a full viewport.** The rhythm alternates one tall block (1.18 to 1.41) against two or three short ones (0.37 to 0.66), so the page always feels like it is moving.

**Type.** Display is **Cal Sans**, a geometric grotesk, at weight 600. All UI text is **Cal Sans UI Variable at weight 300**, which is the interesting decision: a light weight for every label, nav item, lede and card body, so the 600 headings stand alone without needing size. The embedded product uses **Inter** (12 to 16 px, weights 400 to 600) and **Matter Regular** for the availability rows, which reads correctly as "this is the app, not the page". Sizes: h1 64 px / 600, letter-spacing normal, 500 px measure, three lines in 211 px so leading is about 1.10. h2 48 px / 600, centred. Section chip label 12 px / 300. Card titles 18 px / 300. Body and lede 16 px / 300 with 24 px leading. Nav 14 px / 300 with -0.2 px tracking. Largest to body is 64:16, a clean 4:1, and the whole page uses only five sizes: 12, 14, 16, 18, 48/64.

**Colour and material.** Ground rgb(244,244,244); every container is pure white; heading ink rgb(36,36,36); nav ink rgb(41,41,41); all secondary text rgb(137,137,137), one single grey used everywhere; primary button near-black rgb(17,17,17) with white text; secondary button a pale grey fill. There is **no brand accent colour at all** in the page chrome. Separation is by shadow, not border, and the recipe is worth copying verbatim: `box-shadow: rgba(36,36,36,.7) 0 1px 5px -4px, rgba(36,36,36,.05) 0 4px 8px 0` at radius 12 px (16 px on smaller cards). The first layer, nearly opaque but with -4 px spread, reads as a 1 px contact edge; the second is the ambient lift. Section boundaries are 1 px rules at rgb(225,226,227) running the full 1920 px, with vertical rules marking the 1200 px column edges and small 16 px SVG crosshair "+" marks at the intersections, drawn as data-URI backgrounds.

**Motion.** Almost nothing in CSS: two keyframes total (`pulse`, a Framer loading spin) and a 32.36 s linear infinite marquee on the logo strip. Entrance work is done in JS by Framer. Third-party embeds bring their own 0.15 s and 0.2 s transitions. The restraint is the point: a page this dense stays calm because nothing moves except the marquee.

**Two moves worth stealing.**
1. The section-boundary chip: run a 1 px hairline the full page width, then centre a small pill (icon plus 12 px label) directly on top of it so the pill visually breaks the rule. It labels the section, marks the boundary and adds a scale-shift, all with one element and no eyebrow.
2. The two-layer shadow `0 1px 5px -4px rgba(ink,.7), 0 4px 8px 0 rgba(ink,.05)`: the negative-spread first layer gives you the crispness of a hairline border while the second gives lift, which is exactly the "hairline by shadow, never border" rule the imaji brief asks for.

**One thing to avoid.** The hero's right column is a real, interactive-looking product widget cropped by the card edge, and at 1920 px it reads as broken rather than as a crop, because the calendar's Friday and Saturday columns are simply gone. If you crop the product, crop it along a line the eye reads as intentional (a full row, a card edge, a fold) and never mid-element.

---

## 3. lu.ma (luma.com)

**First fold composition.** The entire fold is the product. A 1920 x 1050 canvas fills the viewport with a scattered constellation of real event posters, each a rounded square (radius 11 px) at slight rotation, drifting. Over it, one centred stack occupying only the middle 450 px of width: the wordmark at y=265, the display headline at y=318 (three lines, ending in a coloured phrase), a 450 px lede at y=568, one **white pill button** 224 x 46 at y=659, and a quiet text link "Discover Events" with an arrow at y=723. That is the whole fold. The nav is a single word, "Sign In", at the far top right; there is no menu at all. Words occupy about 23% of the width and the product occupies 100% of it, behind them.

**Section rhythm below the fold.** Document height 2,886 px, **2.75 viewports total**. Three sections: hero 1.0, a discover block at 1.25 (real events near the visitor, a 6-across row of 147 px poster squares, then a community card grid, then a category grid), a closing CTA at 0.50, and a legal strip at 0.18. The content column narrows sharply after the fold, from full-bleed to about 1000 px. This is the shortest credible front door of the three, and it works because section two is live data rather than argument.

**Type.** No web font at all: `-apple-system, system-ui`. The editorial quality comes entirely from scale and weight discipline. Display 80 px at weight 500, letter-spacing -0.8 px (-0.01em), line-height 74 px (0.93), so lines nearly touch. Lede 20 px / 400 at rgba(255,255,255,.6) with 30 px leading. Button 18 px / 500. Section headings below the fold drop right down to 20 px / 600. Card titles 16 px / 500, dates 14 px / 400 muted. Largest to body is 80:20, again 4:1, and there are only five sizes on the page: 14, 16, 18, 20, 80. The gap between 20 and 80 is the entire drama.

**Colour and material.** Ground rgb(21,21,21), a warm near-black, never pure black. Cards are rgb(21,21,21) with `linear-gradient(rgba(255,255,255,.04), rgba(255,255,255,.04))` painted over, at radius 11 px, so the "card" is a 4% white lift rather than a border. Text is white and rgba(255,255,255,.6). One gold rgb(204,168,110) marks the editable city name. The accent is a **single gradient phrase**: "start here" filled with `radial-gradient(circle at 0.15em 0.15em, #ab46dd 0%, #f31a7c 36%, #f8712b 51%, #eaab26 77%)` and `background-clip: text`. Because the circle is anchored 0.15em into the first glyph, the sweep runs naturally left to right across the phrase, which is far better than the usual `linear-gradient(90deg)`. Each floating poster carries its own bloom: a sibling div filled with a flat one-colour gradient sampled from the poster (`#6e8af5`, `#ef5d8b`, `#3392fa`, `#b975da`, `#b08c19`) sitting behind it, plus a matching "sheen" layer at the same radius. The white button is made to feel physical with a stacked shadow, `rgba(0,0,0,.1) 0 3.3px 3px, rgba(0,0,0,.13) 0 8px 7px`.

**Motion.** Motion is tokenised: `--transition: all .3s cubic-bezier(.4,0,.2,1)` and `--fast-transition: all .2s cubic-bezier(.4,0,.2,1)`, referenced by every interactive rule rather than re-declared. The headline entrance is one keyframe, `landing-title-rise`, `transform: translateY(170px)` to `translateY(0)` over 1200 ms, applied to each line separately inside a clipping mask so the lines rise out of nothing with a stagger. Transform only, no opacity, no filter. The canvas gives a slow continuous drift and a light pointer parallax.

**Two moves worth stealing.**
1. Make the product the wallpaper: put the real artefacts full-bleed behind the fold at low contrast and set the sentence on top, so "what you get" is answered before the copy is read. For imaji that is the card, the film and the post texts tiled behind, not a stock gradient.
2. Colour one phrase with a radial gradient anchored inside its own first letter (`radial-gradient(circle at .15em .15em, ...)` plus `background-clip: text`), which sweeps across the phrase correctly at any line-wrap, unlike a 90-degree linear gradient which breaks when the phrase rewraps.

**One thing to avoid.** The lede's three nouns are links with dotted underlines, and at 20 px on a dark ground they read as spelling errors before they read as links. Do not decorate inline links in a hero; if a word needs to be special, give it the accent colour and nothing else.

---

## Cross-cutting numbers

| | mymind | cal.com | luma |
|---|---|---|---|
| Doc height | 19,850 px (18.9 vh) | 8,428 px (8.0 vh) | 2,886 px (2.75 vh) |
| Fold hero height | 1.00 vh | 0.67 vh (a card) | 1.00 vh |
| Content column | 1340 to 1440 px | 1200 px, constant | full bleed, then 1000 px |
| Display : body | 140 : 20 (7:1) | 64 : 16 (4:1) | 80 : 20 (4:1) |
| Type sizes on page | 8 or more | 5 | 5 |
| Accent | one orange, three places | none | one gradient phrase |
| Separation | hairline + tinted shadow | two-layer shadow + 1 px rules | 4% white lift |
| Motion | 0.2 s linear, pop 200 ms | none authored | 1.2 s line rise, 0.3 s tokens |

The pattern across all three: **one display size, one body size, one muted grey, one accent used two or three times, and containers separated by shadow rather than border.** The two that feel most crafted (cal.com, luma) hold themselves to five type sizes.

---

## Three front-door archetypes this suggests for imaji

### A. The broadsheet

A warm paper ground with the wordmark small at top left and nothing else in the header, then a single centred display line at about 96 px in Die Grotesk with tight leading, the coloured word carrying the one accent, and directly beneath it the real v0.2.0 card at about 900 px wide, cropped by the fold line so the visitor scrolls to complete it. Below the fold the page becomes one left-aligned prose column of about 700 px: the lede set at 28 px with its first word set in italic at double size, then the three "why a Mind" lines as three short paragraphs separated by whitespace alone, then the film playing inline at column width with the kit's tweet, thread and LinkedIn text set as quiet indented blocks under it, the way a newspaper sets a pull quote. The three steps close the page as three numbered paragraphs in the same column, each ending in one accent-coloured action, and the footer is a single sentence with the licence and the GitHub link on one line. Total length around four viewports, no cards, no grid, the whole page held by measure and leading.

### B. The floating sheet

A flat neutral ground (warm paper or the dark option) with a single white sheet inset 96 px from the top, 1176 px wide and about 0.7 of a viewport tall, carrying the entire hero: left column of 500 px with the headline at 64 px, the lede at 16 px in a light weight, and one primary action; right column showing the real kit, the card above and the film below, running off the sheet's right edge along a clean row boundary so the crop reads as deliberate. Every section below is separated by a full-width 1 px hairline with a small pill label centred on it ("the kit", "why a Mind", "start"), which replaces every eyebrow the brief bans, and the sheet motif repeats: the kit section is one wide sheet holding the tweet, thread and LinkedIn post as three columns of real text, the "why a Mind" section is three sentences on the bare ground with no container at all, and the three steps are three white sheets at 16 px radius, each with a mono step number, a title, one line of body and one action. Separation is entirely the two-layer shadow, never a border, and the only accent is the primary button and one word in the headline. Total length around five viewports with no section reaching full height.

### C. The kit as wallpaper

The fold is the work itself: the real card, the film poster, the tweet, the thread and the LinkedIn post laid out full-bleed as a loose scatter of rounded artefacts at low contrast on a near-black or deep-paper ground, drifting slowly, with the centre bleached by a single radial gradient so that one centred stack sits on clean ground: the wordmark, one 80 px sentence whose last phrase carries the radial-gradient accent, one line of lede, one pill button, one quiet text link. Section two, immediately below and needing no transition, is the same kit shown honestly at full size and full contrast: the card at 1200 x 630, the film autoplaying beside it, and the three text pieces set as real copy underneath, with the "how it was made" and "what the Mind kept" lines as small mono captions, which is the entire proof of the product. Section three is the three "why a Mind" sentences at display size, one per line, followed immediately by the three steps as a single tight row of three actions and then the one-line footer, so the whole page finishes inside three viewports and never argues where it can simply show.
