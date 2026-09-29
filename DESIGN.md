---
name: ATMOS '26
description: The fest's own countdown campaign, played at site scale, then an ascent through five lit machines to the logo.
colors:
  void: "#000000"
  soot: "#0d0c0a"
  brass: "#c9962b"
  brass-hi: "#e8c170"
  brass-lo: "#6b4e16"
  brass-line: "rgb(201 150 43 / 0.28)"
  teal: "#2fa3a8"
  signal: "#7ff6ff"
  stone: "#eadbd2"
  stone-dim: "#a8998f"
  stone-mute: "#8f8279"
  glitch: "#e0263a"
typography:
  countdown:
    fontFamily: "Stardos Stencil, Archivo Variable, serif"
    fontSize: "min(15vw, 17svh)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  stencil:
    fontFamily: "Stardos Stencil, Archivo Variable, serif"
    fontSize: "clamp(3rem, 9vw, 8rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  display:
    fontFamily: "Big Shoulders Stencil Display, Archivo Variable, sans-serif"
    fontSize: "clamp(3rem, 11vw, 11rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Big Shoulders Stencil Display, Archivo Variable, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  title:
    fontFamily: "Big Shoulders Stencil Display, Archivo Variable, sans-serif"
    fontSize: "clamp(1.5rem, 2vw, 1.9rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  lead:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.3rem)"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100"
  control:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 650
    letterSpacing: "0.04em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 70"
shadows:
  text-display: "0.02em 0.05em 0.1em rgb(0 0 0 / 0.9), 0 0.1em 0.7em rgb(0 0 0 / 0.65)"
  text-copy: "0 1px 2px rgb(0 0 0 / 0.9), 0 2px 14px rgb(0 0 0 / 0.75)"
rounded:
  none: "0px"
  ring: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "32px"
  row: "24px"
  row-wide: "32px"
  stack: "56px"
  section-tight: "14svh"
  section: "16svh"
  section-loose: "18svh"
components:
  button-primary:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.void}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hi}"
    textColor: "{colors.void}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.stone}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    textColor: "{colors.brass-hi}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.stone-dim}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  tab-active:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.void}"
  nav-link:
    textColor: "{colors.stone-dim}"
    padding: "8px 0"
  nav-link-active:
    textColor: "{colors.brass-hi}"
  menu-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.stone}"
    rounded: "{rounded.ring}"
    size: "44px"
  tag-category:
    backgroundColor: "{colors.void}"
    textColor: "{colors.stone-dim}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  card-footer:
    backgroundColor: "{colors.soot}"
    textColor: "{colors.stone-dim}"
    rounded: "{rounded.none}"
    padding: "32px"
---

# Design System: ATMOS '26

## Overview

**Creative North Star: "The Ascension: The Countdown Reel, Then a Climb Through the Eras"**

The site is the fest's Instagram campaign made navigable. It opens on the countdown reel's end card: the official artwork builds itself layer by layer, then a live days : hours : minutes : seconds clock lands under it in the reel's stencil, digits rolling like a mechanical counter, with a red glitch. Below that, the page becomes a shaft you rise through: a dive down past brass collars to the 1700s, then five lit machines, each on its own floor: a tower-clock movement, a locomotive's running gear, a circuit board grown into a skyline, the 1953 double-helix model, and a string-art network. Every machine is first perceived as dots, then drawn as a blueprint, then cast in metal from the bottom up, and it leaves as dust streaming to the next floor. At the summit the dust gathers into the logo's ring and the untouched artwork lands in it. A loupe under the pointer shows each machine the way a machine sees it. Everything sits in lit darkness: black ground, light that falls from above, and a single brass-lit phrase per statement.

Density is low and scale is high. Statements are set in condensed stencil caps (Big Shoulders Stencil) at confident but measured sizes; only page titles run poster-scale. Lists are full-width hairline rows, not grids of cards. Photos rest in a black-to-brass duotone and get their colour back only when you point at them. The surface is analogue film rather than a HUD: static grain over everything, and projector-gate scratches over the hero and page headers. The world is built to refuse the dark sci-fi HUD kit (mono micro-labels, notched buttons, corner brackets, glow orbs) and the generic fest template (video hero and neon cards).

The official artwork is the identity, and it is never redrawn. It may be split into its original layers and animated (build-up, idle parallax), but every visible pixel stays identical to `atmos-website.jpg`, and `scripts/verify_logo.py` checks the layers. Dots may trace the ring, but the raster always supplies the logo itself.

**Key Characteristics:**
- Lit darkness. Black ground; light falls from above onto brass, iron and glass, and one brass-hi phrase carries each statement.
- Three type voices: the reel stencil for time and names, condensed stencil caps for statements, plain Archivo for reading and controls.
- Photos rest in a brass duotone and regain colour on hover.
- Film grain everywhere, with projector scratches on the hero and page headers.
- Rectangular text controls with square corners. The circle belongs only to the ring motif.
- Motion is expo-out: blur-to-sharp reveals, one iris wipe between routes, and one scroll timeline that drives the whole ascent.
- Human view and machine view: the same object as metal, as a blueprint, and as a point cloud inside the loupe.

## Colors

A black void with brass as the structural ink, stone for reading, teal light held inside rings, and red that appears only for a glitch frame.

### Primary
- **Reel Brass** (brass): hairlines that carry structure (nav underline, the floor dial, the iris ring, underline decoration at 60%), the "'26" in the wordmark, era years, the date separator slash, footer arrow icons, the skip link fill and the text selection fill. It is the base tone of the dust and the ink of every blueprint.
- **Lit Brass** (brass-hi): the one highlighted phrase in each statement ("Pick your **arena**", "**Names sealed.**"), the active nav link, the hovered category row, stat labels, the primary button's hover fill and the reticle dot. It is also the bright end of the dust, the floor dial's needle and the pour front as it cools.
- **Tarnished Brass** (brass-lo): the scrollbar thumb, the minor ticks on the preloader dial, and the far-depth colour that dots fade into.
- **Brass ink:** the blueprint lines of every machine are brass (`#d9a654`) at 80%, blended as ink (normal blending), so dense strokes never sum to white. Only the pen tip is hot enough to bloom.
- **Brass Hairline** (brass-line): the scrolled nav's bottom border and the ring outline on the circular menu toggle.

### Secondary
- **Ring Teal** (teal): about 14% of the dust, the machine view inside the loupe (the loupe is a ring), the vortex glow inside the preloader dial and the mobile menu ring. It is never a UI fill or a text colour.
- **Signal Cyan** (signal): the focus outline, the glitch's cyan channel, the near readings inside the loupe, a thought climbing the network, and the ping on the contact map.

### Tertiary
- **Glitch Red** (glitch): the red channel of the stencil glitch split (countdown, past-edition numbers, proshow codenames, 404) and the preloader's second hand. Nothing else.

### Neutral
- **Void** (void): page background, nav backdrop at 80%, the iris cover, text on stone fills.
- **Soot** (soot): footer cards at 60% and the placeholder behind event images.
- **Stone** (stone): headings, statements, primary text and the primary button fill. Stone at 12% is the standard hairline between rows (15% on the proshow bands, 35% for the outline button's border).
- **Dim Stone** (stone-dim): lead paragraphs, captions, inactive nav, secondary text.
- **Mute Stone** (stone-mute): notes under stats, meta values, the address, the copyright line, inactive era labels.

### Named Rules
**The One Lit Phrase Rule.** Each statement gets exactly one brass-hi phrase, and the rest stays stone. If two phrases are lit, neither is.

**The Teal Lives Inside Rings Rule.** Teal only appears in the dust, inside a ring (the loupe, the preloader dial, the mobile menu), or as signal on the network's wires. A teal glow floating on its own is an orb, and orbs are outside this world.

**The Red Is a Glitch Rule.** Glitch red only shows for the few frames of a channel split or on the preloader's second hand. It is never a fill, a border or a status colour.

## Typography

**Display Font:** Archivo Variable, set wide (with Archivo, system-ui)
**Stencil Font:** Stardos Stencil 700 (with Archivo Variable)
**Body Font:** Archivo Variable at normal width
**Label Font:** Archivo Variable condensed to 70% width (not a mono face)
**Logo Font:** Cinzel Variable, used only for the preloader dial numerals, where it echoes the logo's lettering

**Character:** The stencil comes straight from the countdown reel and speaks for time and names. Big Shoulders Stencil caps, condensed and cut like crate markings, carry statements; they sit a step down from poster scale so the page never shouts. Plain Archivo handles reading and every control, in sentence case.

### Hierarchy
- **Countdown** (Stardos Stencil 700, 18vw on phones and min(15vw, 17svh) above, compressed horizontally to 74%): "27:07:42:19" in the hero, stone digits with stone-mute colons, and "days / hrs / min / sec" under each group in plain Archivo (0.95rem, stone-dim, sentence case). One line, a glitch every 5–12 s.
- **Stencil** (700, clamp(3rem, 9vw, 8rem), 0.9): proshow codenames, the footer wordmark (clamp(3.4rem, 6vw, 5.5rem)), the 404 title, the nav wordmark (1.35rem), category counts (1.875rem), the preloader percentage. Era years use it in brass at clamp(1.6rem, 3vw, 2.6rem) with the uppercase transform switched off.
- **Display** (Big Shoulders Stencil Display 700, uppercase, 0.01em, 0.95): page titles at clamp(3rem, 11vw, 11rem), stat figures at clamp(3rem, 7vw, 6.8rem), category rows at clamp(1.75rem, 4.6vw, 4.25rem), era names at clamp(2rem, 4.2vw, 4rem).
- **Headline** (display voice, clamp(2rem, 3.6vw, 3.4rem) to clamp(2rem, 4.2vw, 4rem)): section statements, with the closing statement at clamp(1.8rem, 3vw, 3rem).
- **Title** (display voice, clamp(1.5rem, 2vw, 1.9rem)): event card titles and similar in-list headings.
- **Lead** (Archivo 400, clamp(1.05rem, 1.4vw, 1.3rem), 1.625): the one plain sentence under a page title, era copy and section intros. Stone-dim, limited to 28–52ch.
- **Body** (Archivo 400, 1rem, width 100%): card summaries, captions, footer text. Measure up to 60ch.
- **Control** (Archivo 500–600, 0.95rem, sentence case): buttons, nav links, filter tabs.
- **Label** (Archivo 650, 0.82rem, width 70%, 0.04em, tabular figures): the era index under the progress bars and the skip link. The uppercase transform is optional (the era index turns it off).

### Named Rules
**The Three Voices Rule.** Stencil is for time and names, condensed stencil caps are for statements, and plain Archivo is for reading and controls. Cinzel belongs to the logo and the preloader dial, and nowhere else.

**The Condensed Clock Rule.** The countdown is always the stencil compressed horizontally to 74% on one line, filling close to the full content width. Its unit words are counter-scaled so they read at normal proportions.

**The Sentence-Case Controls Rule.** Nav links, buttons and tabs are in sentence case at normal width. Caps are for statements only.

## Layout

The container is 1440px wide and centred, with 16px gutters on phones and 32px from 640px. Sections breathe in viewport units (14svh, 16svh and 18svh of vertical padding) instead of a fixed spacing scale. Section heads sit on a flex row with the statement on the left and a plain underlined text link ("All N events", "Full gallery") on the right, wrapping on phones.

Content is set as full-width rows separated by stone/12 hairlines: stats, event categories, proshow nights, contact routes. Each row has 24px of vertical padding (32px from 768px). The heading sits at left, supporting text sits right-aligned, and the whole row is one link. Events use a 1/2/3-column grid with 24px column gaps and 56px row gaps. The footer uses a 12-column grid with three 4-column cards.

Pinned storytelling is the other structure. Eras and the closing manifesto use sticky full-screen stages over scroll runways (110svh per era, 200svh for the close). The copy sits in the left 58%, and the dot shape takes the right side on desktop or a low band on phones. The hero fits in one phone screen: logo at full width, countdown, facts, then full-width stacked buttons. On desktop, the facts sit left and the buttons right, within min(92vw, 68rem).

Breakpoints are Tailwind defaults (640, 768, 1024px). The nav switches to its full link row at 1024px.

## Elevation & Depth

Surfaces never cast shadows; only type does. Every display and stencil line carries `--shadow-text-display` (a soft em-relative drop like the one under the logo's stone letters, plus a wide dark falloff), and reading copy that can sit over dots or photos takes the `text-lift` utility (`--shadow-text-copy`). On plain black the shadow is invisible; over the world it carves a dark bed under each letter so the words stay readable. Copy that sits beside a machine also gets a soft void shade on its side of the screen (left on wide screens, below on phones). The glitch pseudo-elements drop it (`text-shadow: none`) so the red/teal split stays clean, and controls never get it (dark text on the stone button must not halo). Depth otherwise comes from the world: exponential fog into black, baked ambient occlusion on every part, a warm skylight above and a cool rim behind, and bloom only on things that emit light (the pour front, the pen tip, signal on copper and wire). Blur and parallax add the rest (the logo stage scales to 1.12 and drifts 14% as the hero scrolls away). The film layers sit on top: fixed SVG grain at 5% opacity that steps through six positions every 0.9 s, and a scratch canvas at 12 fps. The only translucent surfaces are the scrolled nav (void at 80% with a medium backdrop blur) and the category tag on event images (void at 80% with a blur).

### Named Rules
**The Flat Void Rule.** Surfaces never lift. If something needs to come forward, it gets brighter (stone to brass-hi) or gets its colour back. Cards, buttons and images never cast a shadow; the only shadow on the site belongs to type.

## Shapes

Every text control, card, tab, tag and image has square corners (0px). Structure comes from 1px hairlines rather than filled panels. The circle has exactly one meaning, the logo's ring, and it shows up only in ring-derived pieces: the route iris, the cursor reticle, the 44px menu toggle, the mobile menu's backdrop ring, the preloader dial, and the halo the dots form at the close. Photos are cropped to plain rectangles (4:3 on event rows, 4:5 for the category hover photo, natural width in the gallery strip), with no masks or clip shapes at rest.

### Named Rules
**The Ring Is the Only Curve Rule.** If it isn't a ring, it's a rectangle. A rounded button or pill tab borrows a curve that belongs to the logo.

## Components

### Buttons
Plain, heavy rectangles that read like a title card rather than an interface.
- **Shape:** square corners (0px), 48px tall, 24px side padding (28px on the closing pair).
- **Primary:** a solid stone fill with void text, weight 600, 0.95rem, sentence case ("Explore events"). In the hero it carries a thin 20px drawn right-arrow.
- **Hover / Focus:** the fill changes to brass-hi over 300ms. Focus is the global 1px signal-cyan outline at a 4px offset.
- **Secondary:** a 1px stone/35 outline with stone text. On hover, the border turns brass and the text brass-hi. While registration is closed, the secondary is the passes button: it reads "Passes: opening soon", and when clicked it says where passes will drop instead of linking nowhere.
- **Pairing:** primary first, secondary second, 12px apart. On phones they stack at full width.

### Filter tabs
- **Style:** 44px tall, 20px side padding, 0.95rem medium, stone-dim text with a count in stone-mute. A 24px hairline sits under the row.
- **State:** the active tab is a solid stone block with void text. The block slides between tabs as a shared layout element over 0.5 s with expo-out easing, and the count dims to void/60.

### Cards / Containers
Cards are the exception here. Rows are the rule.
- **Corner Style:** square (0px).
- **Background:** footer cards use soot at 60% with a stone/12 border and 24px padding (32px from 640px). Events are rows, not cards: on wide screens the hovered or focused row brings up its 4:3 duotone photo beside the facts, with the category rows' iris entrance. Below 1024px a small 4:3 duotone thumbnail leads each row and gets its colour back on hover.
- **Shadow Strategy:** none on surfaces; text only (see Elevation & Depth).
- **Tag:** a void/80 blurred chip, 10px by 4px, in the top-left corner of the image. Small text, capitalized, stone-dim.

### Navigation
- **Bar:** fixed, 64px tall. It is transparent at the top of the page. After 24px of scroll it gets a void/80 fill, a medium backdrop blur and a brass-line bottom border (500ms expo-out).
- **Wordmark:** stencil at 1.35rem, "ATMOS" in stone and "'26" in brass.
- **Links:** sentence case, 0.95rem medium, stone-dim, turning stone on hover. A 1px brass underline scales in from the left over 500ms. The active link is brass-hi and keeps its underline.
- **Mobile:** below 1024px, a 44px circular brass-line toggle with two offset hairlines opens a full-screen menu. The menu has a 140vmin brass ring with teal light inside it and stencil links at clamp(2.6rem, 12vw, 4.5rem).

### Photos (duotone)
Every photo passes through one SVG filter that maps luminance from black to brass to stone. The colour returns only on hover or focus of the containing group, with a 700ms expo-out filter transition. Images never scale on hover. Background photos (proshow bands) stay duotone at 25–40% opacity under a black gradient.

### Category rows (signature)
Full-width rows with the category name in display caps at clamp(1.9rem, 8vw, 7.5rem) on the left, and a stencil count plus a blurb on the right. Hovering a row turns it brass-hi and shifts it 12px right, dims every other row to stone/25, and brings up that category's 4:5 duotone photo. The photo enters with an iris-like vertical clip, a small rotation and a scale from 0.9. Colour goes to whatever is active.

### The Ascension (signature)
One fixed WebGL world behind the home page, driven by a single scroll timeline (`src/world/timeline.ts`). A dive down a shaft of machined brass collars, then five floors, one per era, then the summit. Every floor plays the same beats on its own slice of the scroll: **arrive** (the machine's points rise into place), **draw** (its blueprint is drawn part by part: round parts swept by a compass, the rest along their length, lower parts first), **cast** (metal pours into the drawing from the bottom up behind a thin molten front), **stand** (the machine runs; copy is readable), **exit** (it breaks into dust that streams up to the next floor). The camera moves like a loupe, not a roller coaster: small, deliberate moves per floor, rising through a collar between floors. Phones scroll by native momentum, not a wheel, so they get a shorter ascent (1.2 screens a floor instead of 2.4), the world eases after each swipe instead of jumping, and the page ends at the summit: under the ring sit the date, Explore events, Passes, and links to Proshows and Gallery. The sections after the ascent are laptop-only. Scrolling is never snapped or taken over.

Machines are modelled in Blender with real mechanics: a clock train with true ratios running on live seconds; a locomotive whose rods and Walschaerts valve gear are solved from the crank angle and turn faster while you scroll; a board whose copper carries signal packets; the double helix, spelling ATMOS'26, rewriting one base pair at a time; a network that carries a thought to its apex on click or tap. At the summit the dust forms the logo's ring (sampled from the ring layer only) and the official JPEG is laid over it, aligned to the ring the engine projects.

### The loupe (signature)
The pointer becomes a brass ring with the reticle's four ticks. Inside it the metal is cut away and the machine is shown as a point cloud in teal and signal, with a scan band climbing it and the blueprint faint behind, magnified slightly with a glass edge. It opens over the world only (never over controls) once a machine is standing. On touch it opens where you tap, and drifts over the machine on its own when you haven't touched for a while.

### Floor dial
A lift indicator on the right edge of wide screens: a hairline shaft with a stop for every era (1700s at the foot, 2026 at the head), labels in the condensed label voice, and a brass diamond needle that rides with the scroll. Choosing a stop rides the lift there over 2.6 s. On phones it is one brass hairline along the bottom that fills as you rise.

### Floor backdrops
Inner pages stand on a floor: Events on the circuit board, Proshows under the network, Gallery by the clockwork, Sponsors beside the locomotive, Contact at the double helix. The floor is perceived, drawn and cast as the page arrives (about five seconds), then runs behind the title with the loupe, fading into the page at the bottom. Without WebGL, the header shows the floor's rendered still.

### Sound
Synthesised in the browser, never recorded, and off until the visitor turns it on (the choice is remembered). A drone that opens up as you rise, tick and tock on the escapement's seconds, a chuff on every quarter turn of the drivers, blips over a mains hum, a struck bell for each rewritten base pair, a swell and chime for a thought, and a chord as the artwork lands. The toggle is a plain text control in the nav, on the home page only.

### Countdown (signature)
The reel's title card, live to the second. It counts days, hours, minutes and seconds to opening (09:00 IST on day one) and switches to "Day N is live" during the fest and "See you in '27" after it. It is the stencil at 74% width. Each digit sits in a fixed 0.6em slot and rolls up to its new value (0.55 s, expo-out, 4px blur to sharp); with reduced motion the digits swap in place. Screen readers get one sentence that changes once a day ("27 days to go until ATMOS 2026."), not the ticking digits. A red and cyan channel split fires 0.9 s after the hero lands, then every 5–12 s. Each split runs 0.42 s in two steps, with clipped slices offset by 2–4px. The same split runs on hover over proshow codenames and once on the 404 title.

### Film scratches (signature)
A canvas overlay that redraws at 12 fps and pauses when off screen. Each frame draws hairline curves, dust specks and up to two wandering vertical scratches, all in warm white at 12–53% opacity. It covers the hero (density 0.8, opacity 0.8, screen blend) and every page header (density 0.5, opacity 0.6). It is off for reduced motion.

### Motion grammar
- **Easing:** expo-out (0.16, 1, 0.3, 1) for every reveal and hover, and expo-in-out (0.87, 0, 0.13, 1) for the route iris only.
- **Blur-to-sharp reveal:** statements and page titles rise 0.3–0.5em from a 10px blur to sharp over 1.1 s, with lines staggered 0.1 s. Eras cross-fade the same way over 0.7 s.
- **Row entrance:** rows rise 30–40px and fade in over 0.9–1 s, staggered 0.05–0.08 s, once each.
- **Route iris:** a void layer clipped to a circle closes to 75vmax (0.55 s) while a 2px brass ring swells with it. Both then contract to a point to reveal the next page (0.66 s). The first page of a visit skips the iris.
- **Logo build-up:** the ring draws itself (1.6 s stroke), the vortex spins up, circuits light outward, the two hands glide in, a spark marks where they meet, the letters ripple out from the M, and the taglines wipe in. After that, the layers idle with parallax, driven by the mouse or, on phones, by device tilt. With a mouse, the hands part as the pointer moves over the ring and close again as it nears the meeting point, sparking on contact. A click or tap inside the ring replays the convergence (hands part, rejoin, spark, letters ripple). Circling the pointer or scrolling stirs the vortex disc, which always settles back to the artwork's pose. The preloader's brass watch case becomes the hero ring.
- **Reduced motion:** no preloader, no iris, no grain stepping, no scratches, a static hero and near-instant transitions.

## Do's and Don'ts

### Do:
- **Do** keep the ground black and let the light come from the world: skylight on metal, emissive fronts, stone text and one brass-hi phrase.
- **Do** use the stencil for time, years, codenames and the wordmark, Big Shoulders Stencil caps (700 weight, 0.01em tracking) for statements, and plain Archivo in sentence case for reading and controls.
- **Do** compress the countdown to 74% width on one line.
- **Do** set lists as full-width rows on stone/12 hairlines, with 24px row padding (32px from 768px), inside the 1440px container.
- **Do** keep text controls as square-cornered rectangles (primary is a stone fill, secondary is a stone/35 outline, both 48px tall).
- **Do** pass every photo through the duotone filter and return its colour on hover over 700ms.
- **Do** give each new floor the same beats (arrive, draw, cast, stand, exit), real mechanics, and a camera that moves like a loupe.
- **Do** keep bloom for things that emit light; metal is lit, never glowing.
- **Do** use the expo-out easing for reveals and hovers, blur-to-sharp for statements, and the iris for route changes only.
- **Do** use lucide icons at 1.5 stroke (16px inline, 20–24px for lightbox controls), in brass or the current text colour, where an icon is needed.
- **Do** keep the official artwork pixel-identical. Animate its original layers and verify them with scripts/verify_logo.py.

### Don't:
- **Don't** redraw, retrace, upscale or recolour the logo. Dots may form the ring, but the raster supplies the logo.
- **Don't** use monospace or tracked micro-labels. The only small label is condensed Archivo at 70% width.
- **Don't** notch, chamfer or bracket buttons and panels, or add HUD corner blocks.
- **Don't** add kickers or eyebrow labels above headings. A statement stands alone, with an optional plain sentence under it.
- **Don't** scale or zoom images on hover. Colour returning is the hover.
- **Don't** use typed arrow or icon glyphs (→, ↗, ×). Use lucide icons or a drawn SVG stroke.
- **Don't** round text controls or use pill tabs. Curves belong to the ring motif (iris, reticle, menu toggle).
- **Don't** add box shadows or glow orbs; the only shadow is the text depth token. Teal glows only inside a ring.
- **Don't** use glitch red outside the channel-split reveal and the preloader's second hand.
- **Don't** light more than one phrase per statement in brass-hi.
- **Don't** use Cinzel outside the logo and the preloader dial.
- **Don't** set statements in wide or extended grotesk caps. It is the stock AI-landing-page look this site replaced.
