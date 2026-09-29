---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/layout"]
---

# Home — surface brief

Scope: `/` home page plus the shared layout (nav, footer, page transitions) that every inner route inherits. Mode: **Persuade**.
Audience/job: outside students deciding to come and register; sponsors checking scale. Action: explore events; passes are "opening soon".
Proof on hand: official artwork (+ team source layers for letters and machine hand), past-edition photos, 4 past stats. Nothing else may be invented.
Constraints: official logo pixels untouched (layers verified by scripts/verify_logo.py). No phone number (user decision).
Build path this session: code-led. Not stored in config.

History: v1 (ring-portal HUD world: tracked mono labels, notched buttons, corner info blocks, marquee, dust) was rejected by the user as "looks like AI made it". User then pointed at Boon Global (awwwards nominee) and asked for an award-level site with an AI-themed design, and more Blender. v2 below replaces v1.

## Direction contract

THESIS: The fest's own campaign, played at site scale. The first screen is the countdown reel's end card (official logo over a giant stencil "N DAYS TO GO"); below it one living field of brass dots, modelled in Blender, becomes each era's machine as you scroll. Refuses the fest template (video hero + neon cards) and the AI-dark-HUD kit (mono micro-labels, notched sci-fi buttons, glow orbs).

OWN-WORLD: Pure black. Stone text, brass/amber highlight on one phrase per statement, teal only as a sprinkle in the dot field. Type: Stardos Stencil (the reel's face, condensed) for the countdown only; Hubot Sans caps, heavy and condensed, for statements, names, figures and era years; plain Archivo for reading and controls; Cinzel only inside the logo. Photos in black→brass duotone, colour returns on hover. Damaged-film scratches from the reel over hero and page headers. Plain rectangular buttons, sentence-case nav.

STORY: See the logo assemble → know it is 29 days away, where, and the two actions → "every era built a better hand… this time the tool reaches back" over two hands in dots → five eras morph (watch, locomotive, circuit city, DNA, brain) → the numbers → pick an arena → three sealed proshow nights → photos → closing statement over dot rings → footer cards.

FIRST VIEWPORT: Official logo centred, ~560–700 px square; directly under it, overlapping its black margin, "29 DAYS TO GO" in the reel's stencil at ~full content width; one row below: "Fri 23 – Sun 25 October / BITS Pilani, Hyderabad Campus" left, "Explore events" (solid) + "Passes: opening soon" (outline) right. Nav: stencil wordmark left, five sentence-case links. Phone: logo full width, countdown, facts, stacked full-width buttons, all in one screen.

FORM: Brief-pinned (user plan + user feedback + Boon reference); original roll d32274af superseded by the user's direction. Raises kept: collider display (select one, dim the rest → category rows dim on hover), Du Bois (stats set as the page's biggest figures, not metric cards), glazier (colour only on what is active).

Signature interaction: the particle field (12k dots, public/shapes/*.bin baked by scripts/blender/era_shapes.py) swirls between Blender-modelled shapes as sections take the centre of the screen, dots part around the cursor. Motion grammar: expo-out, blur-to-sharp line reveals, one iris wipe between routes, logo build-up then idle layer parallax.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Registration URL, 2026 event list, proshow artists, sponsors (placeholders, labelled).
- Remaining source layers (human hand, ring/vortex, circuits, taglines) would allow a 3000 px retina hero.
