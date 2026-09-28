# ATMOS '26

Official website of **ATMOS '26**, the technical fest of BITS Pilani, Hyderabad Campus. **Fri 23 – Sun 25 October 2026.**
*Augmented Ascension: The Transitional Convergence.*

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run lint
```

## Before you change anything
- **[AGENTS.md](AGENTS.md)**: rules for humans and AI agents (Antigravity, Cursor, Copilot). Read it first.
- **[DESIGN.md](DESIGN.md)**: the visual system (colours, type, motion, do's and don'ts).
- **[PRODUCT.md](PRODUCT.md)**: audience, facts and what must not be invented.
- **[design/ASSETS.md](design/ASSETS.md)**: how the logo layers, the Ascension's machines and stills, and the point clouds are generated.

The official logo is never redrawn. `python scripts/verify_logo.py` proves the hero's logo layers match `atmos-website.jpg` pixel for pixel, and CI runs it on every pull request.

## Contributing
Work on a branch, open a pull request into `main`, fill in the template (with desktop and phone screenshots), and wait for CI and a review. Details are in [AGENTS.md → Git workflow](AGENTS.md#git-workflow).
