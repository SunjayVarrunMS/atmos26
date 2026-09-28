// The Ascension: the five eras the home page rises through, bottom to top.
// Copy is the site team's theme writing (from the launch reel), not fest facts.

export const ERAS = [
  {
    id: 'clockwork',
    when: '1700s',
    name: 'Clockwork',
    line: 'Time made mechanical. Gears taught us to trust a machine to keep count.',
    scene: 'A brass tower-clock movement: meshing wheels, an escapement and a long pendulum in a cast-iron frame.',
  },
  {
    id: 'steam',
    when: '1800s',
    name: 'Steam',
    line: 'Muscle multiplied. Pistons pulled whole cities across continents.',
    scene: 'A steam locomotive in black lacquer and brass, its coupled wheels, rods and valve gear lit from above.',
  },
  {
    id: 'silicon',
    when: '1950s',
    name: 'Silicon',
    line: 'Logic etched into sand. The circuit board grew into a skyline.',
    scene: 'A circuit board whose chip packages stand like towers around a copper-plated ring.',
  },
  {
    id: 'genome',
    when: '2000s',
    name: 'Genome',
    line: 'Life read like source code, and then rewritten.',
    scene: 'A metal double-helix model on a lab stand, its base pairs cut as flat rings of brass.',
  },
  {
    id: 'intelligence',
    when: '2026',
    name: 'Intelligence',
    line: 'Thought shared with machines. The next hand is the one we build together.',
    scene: 'A cone of brass hoops strung with thousands of wires, rising to a single unit at the top.',
  },
] as const;

export type EraId = (typeof ERAS)[number]['id'];
