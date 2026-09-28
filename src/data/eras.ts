// The Ascension: the five eras the home page rises through, bottom to top.
// Copy is the site team's theme writing (from the launch reel), not fest facts.

export const ERAS = [
  {
    id: 'clockwork',
    when: '1700s',
    name: 'Clockwork',
    line: 'Time made mechanical. Gears taught us to trust a machine to keep count.',
  },
  {
    id: 'steam',
    when: '1800s',
    name: 'Steam',
    line: 'Muscle multiplied. Pistons pulled whole cities across continents.',
  },
  {
    id: 'silicon',
    when: '1950s',
    name: 'Silicon',
    line: 'Logic etched into sand. The circuit board grew into a skyline.',
  },
  {
    id: 'genome',
    when: '2000s',
    name: 'Genome',
    line: 'Life read like source code, and then rewritten.',
  },
  {
    id: 'intelligence',
    when: '2026',
    name: 'Intelligence',
    line: 'Thought shared with machines. The next hand is the one we build together.',
  },
] as const;

export type EraId = (typeof ERAS)[number]['id'];
