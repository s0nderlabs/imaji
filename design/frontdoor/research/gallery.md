# Gallery research: landing layout archetypes, 2025 to 2026

Lens: the three galleries named in the brief, read live on 28 Aug 2026 at 1920 x 1050, plus twelve of the landing pages they feature, opened and measured one at a time in a single tab. Every number below comes from `getComputedStyle` and `getBoundingClientRect` on the live page, not from memory. Where a page failed to load (alt-shift.co returned no data, mixpanel.com returned `ERR_ACCESS_DENIED`) it is left out rather than guessed at.

One correction to the brief's list up front: **godly.website no longer exists under that name.** It 301s to `recent.design/?ref=godly`, same curation, same team, rebuilt. Everything recorded under "Godly" below is recent.design.

---

## The three galleries, as pages in their own right

### recent.design (formerly godly.website)

**First fold.** A persistent left rail about 15% of the width carries the whole site (Browse: Design, Websites, OG Images, App Screenshots, App Icons; Resources: Tools, Skills, Jobs), with a sponsor card pinned at its top and a "Join 9,949 members" sign-up block pinned at its bottom. The remaining 85% is the feed. There is no hero: the page title is an `h1` reading "Design" at **15px**, a 14px grey lede under it, a row of filter chips (All, Web, Interface, Branding, Product, Typography, Motion, Illustration, 3D, Editorial, Print, Packaging), then work. The single action is "Sign up" in the rail, never in the content.

**Rhythm below the fold.** The whole home page is 2320px, about 2.2 viewports. Feed, a jobs block interleaved at roughly one screen down, more feed. No sections in the marketing sense at all.

**Type.** One face, Inter, one size for almost everything. Body 13px. The largest text on the entire page is the 15px `h1`. Weights are 400 and 500 only. Tracking normal throughout.

**Colour and material.** White ground, ink at `lab(7.78)` near-black, two muted greys used as the entire hierarchy: `rgba(0,0,0,.486)` for lede, `rgba(0,0,0,.267)` for rail group labels. No card grounds, no borders, no shadows: containers are separated by whitespace and by the thumbnail's own edge.

**Motion.** Almost none in CSS. The work does the moving (the thumbnails are the animation).

**Two moves worth stealing.** (1) Demote the page title to body size and let the artefacts carry the weight, which works because the visitor came to see the thing, not to read a claim. (2) Build the entire grey scale from two alphas of the ink colour instead of separate greys, so the page cannot drift off temperature.

**One thing to avoid.** The rail holds a sponsor card and a member count above the actual content; imaji's front door has nothing to sell in that slot and would just be putting furniture in front of the kit.

### land-book.com

**First fold.** Centred, full width, no rail. A 14px top bar (Websites, Experts, Templates, a `/` search hint, Sign in, Get Pro, Sign up), then a mode row (Websites, Sections, Mobile, New, Motion, OG Images, Headlines), then a **24.5px/600** `h1` with a 14px lede, then two rows of filters, then the feed. Roughly 300px of chrome before any work appears.

**Rhythm.** 5667px and infinite ("Loading more content..."), so there is no rhythm to speak of: it is one feed with a paywall card cut into it ("Unlock access to everything", "It's just $6 per month", both at 24.5px, the same size as the `h1`).

**Type.** Inter throughout. Body 14px, `h1` 24.5px at weight 600, so a 1.75x type scale across the whole site.

**Colour and material.** Warm off-white ground `rgb(247,246,245)` with ink `rgb(43,42,42)`, the warmest of the three and the closest to imaji's house paper. Cards sit on the ground with no border and no shadow.

**Motion.** Stock Bootstrap 5: `0.15s ease-in-out` on form controls, `80ms ease-out` on buttons and filter chips, `0.3s ease-in-out` on the offcanvas panel. Nothing authored.

**Two moves worth stealing.** (1) The warm paper ground `#F7F6F5` against near-black ink is measurably calmer than siteinspire's pure white and is the reference point for the brief's `oklch(96.6% .006 80)`. (2) Every card carries a one-line credit ("Landing Page", "Portfolio by COSMOFLOW", "Template by Irem Geldry"), which is exactly the shape of imaji's "How it was made" line under the kit.

**One thing to avoid.** The paywall card is set at the same 24.5px as the page's own `h1`, so the ask competes with the content for first read. Whatever imaji's primary action is, it should not be typeset at heading weight next to the kit.

Worth recording separately: land-book's `/sections` page publishes the industry's default section vocabulary, and it is precisely the list the brief bans. **Hero, Value proposition, Features, How it works, Testimonial, Brands, Stats, Pricing, Resources, FAQ, Call to action, Footer, About us, Case study.** imaji uses four of the fourteen: the case study (the kit), the how it works, a single call to action repeated three times, and the footer.

### siteinspire.com

**First fold.** A 113px fixed white header, then a 308px `zinc-50` band (0.29 of the viewport) split across a 12 column grid: the `h1` "A showcase of the web's finest design + talent" occupies the left 4 columns at 576px wide, the filter panel (Popular Categories, Styles, Types, Subjects, Platforms, with live counts: Typographic 2090, Minimal 767, Grid Layout 657, Unusual Layout 656) occupies the right 8. The grid of work starts inside the first screen. The one action, "Subscribe to the weekly edit", sits directly under the `h1` as plain text, not a button.

**Rhythm.** Head band 0.29 viewports, then a single 4.35 viewport grid, then a 0.16 viewport pagination block (Page 1 to 5). Three sections total, and one of them is 93% of the page.

**Type.** Scto Grotesk A, body 14px, `h1` 24px at weight 400, tracking **-0.4px site wide including body copy**. Category names at 20px. So again a very tight scale: 14, 20, 24.

**Colour and material.** White page, `zinc-50` head band as the only tonal shift, ink `rgb(24,24,27)`. Containers are separated by grid gaps alone: 64px between columns, 48px between rows. No borders, no shadows.

**Grid.** 12 columns of 96px. The first two tiles run 848 x 530 (16:10), then the feed drops to 368 x 230 at the same 1.6 ratio, four up. So the newest two items get roughly 5x the area of the rest.

**Two moves worth stealing.** (1) The first two tiles are twice the size of the rest on the same ratio, which is a free hierarchy that costs no new component: imaji's card and film can be the two big tiles and the four text pieces the small ones. (2) Negative tracking applied at every size, body included, is what makes a 14px grotesque read as designed rather than defaulted.

**One thing to avoid.** The filter panel takes two thirds of the head band, so the page's own sentence is outweighed by its controls. imaji's fold has one sentence and one artefact; nothing should be allowed to outweigh them.

---

## Thirteen structurally different landing archetypes seen across the three galleries

Each was opened and measured. "Structure in one sentence" first, then the evidence.

### 1. No-hero index: the work is the first fold
The header is a hairline and the grid of work begins immediately, so the page never makes a claim in words.
*Example: Lundgren+Lindqvist (lundgrenlindqvist.se), seen on siteinspire.* Ground `rgb(233,233,233)`, header 53px, then a 2-up case grid of 947 x 637 cards starting at y=47. PxGrotesk at **22px for literally everything**: nav, case titles, categories, footer. One radius (8.8px), zero shadows, zero borders. 56307px long, 26 viewports of work. Entrances are `opacity 0.45s linear` and `transform 0.45s cubic-bezier(0.35,0,0.55,1)`.

### 2. Single-screen ambient card: one canvas, one card, one action
The page is exactly one viewport tall, a generative canvas fills it, and a single small card floats low in the frame holding the name and the only button.
*Example: Desktop.fm, seen on recent.design.* Document height 1050 against a 1050 viewport, so the page cannot scroll. Full-bleed `<canvas>`, zero images. One 280 x 200 card at x=820 (centred) and y=830 (low, at 79% of the fold), holding a 28px/800/-1px name and a 260 x 55 button. Transitions are `backdrop-filter 0.2s linear` and `transform 0.05s linear` on press.

### 3. Asymmetric split with a bleeding product panel
A narrow text column holds the headline on the left while the product panel starts near the middle and runs off the right edge of the screen.
*Example: Mintlify, seen on recent.design.* Dark ground `lab(2.4)`. Headline column x=416 w=352 (18% of the viewport); product panel x=830 w=1057, so it ends at 1887 of 1920 and overflows its own 1088px content grid. Serif display (Arizona Flare) at 50px/-2px against Inter 16px body. Animated canvas behind the full hero. Hero 0.94 viewports, logo strip 0.58, first feature 1.58.

### 4. Centred stack with alternating caption and media
Everything is centred on one axis and the page below the fold alternates a short caption block with a tall media block, over and over.
*Example: Endel (endel.io), seen on recent.design.* Black ground, Apercu Pro. `h1` 60px centred in a 564px measure inside a 1480px container; one 172px button at dead centre (x=874 of 1920). Section heights alternate 0.15 to 0.23 viewports (caption) against 0.58 to 0.67 viewports (media) for 12218px.

### 5. One-viewport-per-chapter band stack
Every section is sized to roughly one screen and each gets its own ground colour, so scrolling feels like turning pages.
*Example: Voiceflow, seen on land-book.* Measured section heights in viewports: 1.03, 0.70, 1.08, 1.01, 1.33, 1.05, 1.05, 0.65. Grounds alternate transparent, `rgb(226,230,230)`, white, `rgb(31,36,41)`. Serif display Tiempos Headline at **72px weight 300, tracking -2.16px** over a pale mint page `rgb(242,247,247)`, with a UI sans for everything else.

### 6. Inset full-bleed media hero
A video or image card is inset a few pixels from every edge of the viewport and the headline sits on top of it.
*Example: Superpower, seen on recent.design.* A 1904 x 986 video card inset 8px from the viewport edges, `h1` 60px/-1.2px in white over the video, 14.17 viewports of body beneath, price at 70px far down the page. Radius 8px used 52 times.

### 7. Artefact as hero, headline as caption
The thing being sold is rendered at full size in the fold and the sentence about it is set smaller than the section headings further down.
*Example: AuthKit (authkit.com), seen on recent.design.* Ground `rgb(5,6,15)`. The fold headline is **24px** while a later `h2` is 44px. The hero is 1.16 viewports with a canvas, three spotlight beams (427 x 726, 204 x 714, 427 x 726) and an overlaid line grid. A 0.08 viewport ticker strip of feature names sits under it. Radius 2px, used 46 times. Entrances all on `opacity 0.45s cubic-bezier(0.6,0.6,0,1)`.

### 8. Narrow single column, a screenshot after every claim
One measure runs the whole page and each claim is answered immediately by a product image, repeated for as long as there are features.
*Example: Amie (amie.so), seen on recent.design.* Content locked to 1024px inside a 1920 viewport, so 47% of the screen is margin. Headline 56/64 bold at -0.7px, then a 976 x 630 shadowed screenshot. 14225px, 13.5 viewports, each chapter an `h4` at 40px plus an image. Four radii in play (12, 8, 9999, 4) and 26 box-shadows: the most template-like page in the set.

### 9. Persistent left index rail plus an endless canvas
A fixed rail carries navigation and live status while the right side scrolls forever through work.
*Example: PORTO ROCHA (portorocha.com), seen on recent.design.* Black ground, 400px rail whose inner column is 6019px and scrolls independently, carrying a live clock ("Friday, August 28 New York, 06:47:46") over stacked nav cards. 336 images on the page, 53575px tall. Type never exceeds 23px. One radius (10px), zero shadows, transitions all `0.5s ease`.
**Flag:** this is the family the brief bans in rule 4. Recorded so it is recognisable, not so it is used.

### 10. Warm paper editorial: serif body, mono labels, one accent used twice
A paper-toned ground carries a serif for reading and a tracked-out mono for the small print, and colour appears once or twice on the whole page.
*Example: The Browser Company (thebrowser.company), seen on recent.design.* Ground `rgb(238,238,231)`, body IvarText, names in EB Garamond at 28px, labels in ABCDiatypeMono at 14px with **+2.1px tracking**. Marquee keyframes on all four axes. The accent `rgb(12,80,255)` appears exactly **twice** on the entire page.

### 11. Muted paragraph with lit words
The largest thing on the page is a paragraph set in a muted grey with only the load-bearing words switched to full ink.
*Example: Increase (increase.com), seen on recent.design.* The biggest type is a 40px/-0.8px paragraph in `rgb(101,116,130)` with its key words in `rgb(29,42,54)`. Separation is by hairline, not shadow: 38 borders against 9 shadows. Single accent mint `rgb(49,242,191)`. Radius 8px.

### 12. Oversize identifier over media
The product's name or version is set enormous over a video, and the actual sentence sits under it at half the size.
*Example: Heart Aerospace, seen on recent.design.* "ES-30" at **80px, tracking -3.2px**, white over video; the real `h1` beneath it at 40px. Chapter headings at 28px. Motion is opacity only, 0.15 to 0.2s.

### 13. One small sentence on a nearly empty page
The entire page is a single short line of type, a wordmark and a footer, and it fits in not much more than a screen.
*Example: block.xyz, seen on recent.design.* Ground `rgb(251,251,251)`, whole document 1357px. The `h1` is **24px** with +0.2px tracking. Pill radius 1000px on the two controls. The stylesheet declares **zero keyframes and zero transitions**.

---

## What the measurements say across all thirteen

- **Body copy is 13 to 16px everywhere, without exception.** The galleries themselves run 13 to 14px. There is no 18px body in this set.
- **Display sizes cluster into two bands and nothing sits between them.** A restrained band at 24 to 44px (block, AuthKit, siteinspire, recent.design, Increase, Lundgren+Lindqvist) and a loud band at 56 to 80px (Amie, Endel, Superpower, Voiceflow, Heart Aerospace). Choosing a band is the single biggest structural decision on the page.
- **Negative tracking scales with size, at roughly -0.03em to -0.04em.** Measured: -0.7px at 56px, -1.2px at 60px, -2px at 50px serif, -2.16px at 72px, -3.2px at 80px. siteinspire applies -0.4px even at 14px body.
- **The crafted pages carry one radius; the template-like pages carry four.** AuthKit 2px, Lundgren+Lindqvist 8.8px, PORTO ROCHA 10px, all with a single value repeated. Amie runs 12, 8, 9999 and 4, and reads as the most generic page measured.
- **Separation is tone or hairline, not shadow.** Lundgren+Lindqvist and PORTO ROCHA declare zero box-shadows across the whole page. Increase runs 38 borders to 9 shadows. The one page with 26 shadows is the one that reads as a template.
- **Two motion durations recur.** 0.15 to 0.2s for state changes, 0.45 to 0.5s for entrances. The two authored curves in the set are `cubic-bezier(0.6,0.6,0,1)` (AuthKit) and `cubic-bezier(0.35,0,0.55,1)` (Lundgren+Lindqvist). The brief's `cubic-bezier(.23,1,.32,1)` at 150 to 450ms sits squarely in this range.
- **Accent restraint is measurable and it correlates with quality.** The Browser Company uses its blue twice on the page. Increase uses its mint 58 times. Voiceflow uses its blue 112 times and is the least distinctive page in the set. The brief's "one job at full strength" rule is the correct reading of what the best pages actually do.
- **The strongest pages put the artefact before the argument.** Lundgren+Lindqvist, siteinspire, recent.design, AuthKit and Desktop.fm all give the fold to the thing rather than to a sentence about the thing. That is the same instinct as imaji's rule that the kit comes first.

---

## Three front-door archetypes this suggests for imaji

### The Contact Sheet
The page opens with a hairline header carrying only the wordmark and a GitHub link, and the very next thing, inside the first screen, is imaji's own v0.2.0 kit laid out as a contact sheet on warm paper: the film large at the left, the card large at its right on the same 16:10 rhythm, and the tweet, thread, LinkedIn post and the "How it was made" line as four smaller tiles beneath, all six pieces on the same grid the way siteinspire gives its two newest items five times the area of the rest. One sentence sits above the sheet in the restrained band, 40px at -1.4px, with the coloured word carrying the only Tigerlily on the screen, and directly under the sheet the three "why a Mind" lines run as three short paragraphs with no icons, no ticks and no boxes. The three steps close the page as three plain rows, each with its label, its time and one primary action, and the footer is the single line about developers who ship, plus Apache-2.0, s0nderlabs and the repo, with the whole page separated by tone and grid gap alone and not one box-shadow anywhere.

### The Rest Frame
The first screen is the film and nothing else: `assets/film-v020.mp4` playing muted and looping inside a card inset 12px from every edge of the viewport, exactly the Superpower move, with the wordmark small in the top left over it and the lede set as one line of white type low in the frame where Desktop.fm puts its card, so a visitor who reads nothing still watches the product make its own launch video. Scrolling once lifts the film to a resting size at the top of the page and reveals the rest of the same kit under it, the card and then the four text pieces in one narrow measure, each entering on opacity and a 12px rise at 300ms on `cubic-bezier(.23,1,.32,1)`, followed by the three "why a Mind" lines as a single short paragraph each. The three steps are the last band before the footer, set as three stacked rows on a slightly lifted paper tone with one Tigerlily button per row, and the page ends on the footer line, meaning the whole document is under three viewports and every one of them is either the product or the way in.

### The Broadsheet
The page reads like a printed sheet: a warm paper ground, the headline set as a 40px paragraph in muted ink with only its one coloured word lit, the way Increase lets a muted sentence carry the fold, and the lede immediately under it in the same measure with the version and date in small quiet mono at the shoulder. Below the rule, the kit is presented as an article would present its evidence: the card at full measure with the film beside it, then the tweet, the thread and the LinkedIn post set as three columns of real copy in the body face, each with its channel named in mono above it, and the "How it was made" and "What the Mind kept" lines set as the caption matter they actually are. The three "why a Mind" lines run as a three-column stand-first across the sheet, the three steps follow as a numbered-free sequence of three rows with one action each, and the footer closes with the single line about developers who ship, Apache-2.0, s0nderlabs and the repo, everything separated by hairlines and whitespace with no card, no shadow and no second colour on the page.
