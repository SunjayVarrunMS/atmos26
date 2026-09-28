# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary: students from other colleges** deciding whether ATMOS is worth travelling to Hyderabad for, and which events to register for. They arrive from Instagram reels and college groups, mostly on phones.
- **Secondary: sponsors and press** deciding whether to back or cover the fest. They need scale (footfall, colleges, prize pool) and a credible, professional impression fast.
- BITS Hyderabad students also use it for schedule and events, but they are not the design target.

## Product Purpose
Official website for ATMOS '26, the annual technical fest of BITS Pilani, Hyderabad Campus. It announces the fest, sells the theme, lists events and proshows, and routes people to registration and contact. Success: outside students register and show up; sponsors reach out; people remember the site and share it.

## Positioning
ATMOS '26's theme is **"Augmented Ascension — The Transitional Convergence"**: the meeting of human and machine, told through eras of technology (clockwork → steam → silicon → genome → intelligence). The official artwork (a human hand and a machine hand meeting on the "M" of ATMOS inside a brass ring) is the identity; no other fest can use it.

## Operating Context
- Dates: **Fri 23 – Sun 25 Oct 2026**, BITS Pilani Hyderabad Campus.
- Launch campaign runs on Instagram (@atmos_bitshyd) with reels: an era montage that builds the logo, and a "30 days to go" countdown reel.

## Capabilities and Constraints
- Stack: Vite + React 19 + TypeScript + Tailwind v4 + three.js (raw) + postprocessing + framer-motion + Lenis, multi-page via react-router.
- The home page is the Ascension: a scroll-driven WebGL world with one machine per era. Weak devices and reduced motion get rendered stills instead; the logo, countdown and facts always paint first.
- Pages: Home, Events (filterable by category), Proshows, Gallery, Sponsors, Contact, 404.
- **Registration is not open yet**: "Get Passes" / "Register" show "Registrations opening soon" until a real URL is supplied.
- Event list, proshow artists and sponsors are placeholders until the team provides them.
- Proshow nights carry codenames written by the site team (Signal, Circuit, Ascension) as sealed-dossier placeholders; they are not artist or event claims and get replaced when the line-up is announced.

## Brand Commitments
- **The official logo (`atmos-website.jpg`) cannot be changed** (fest team decision). It may be split into layers and animated, but every visible pixel must match the original. No re-drawing, no AI upscaling.
- Taglines: "Augmented Ascension", "The Transitional Convergence".
- Reel language: the logo building itself, stencil "N DAYS TO GO" countdown, red glitch accents.

## Evidence on Hand
- Stats from previous editions: 30,000+ footfall, 40+ events, ₹12L+ prize pool, 150+ colleges.
- Past-edition photos: `public/gallery/*` (11 images).
- Contact: atmos@hyderabad.bits-pilani.ac.in · Instagram @atmos_bitshyd. No phone number on the site (team decision). Events name their organising club (name + SU Connect tagline), never people or contacts.
- Absent (do not fabricate): 2026 event list, proshow artists, sponsors, testimonials, registration URL, pass prices.

## Product Principles
1. The logo is the hero; everything else frames it.
2. Answer "when, where, what, how do I join" within the first screen on a phone.
3. Spectacle must never block information: every effect has a fast, readable fallback.
4. Placeholders are honest ("revealing soon"), never fake names or numbers.

## Accessibility & Inclusion
Honour `prefers-reduced-motion` everywhere (static hero, no preloader). Keyboard-navigable nav and menus; readable contrast on the black canvas; mobile-first performance on mid-range Android phones.
