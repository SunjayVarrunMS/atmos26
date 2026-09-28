import type { ChamberSpec } from '../chamber';
import { clockwork } from './clockwork';
import { genome } from './genome';
import { intelligence } from './intelligence';
import { silicon } from './silicon';
import { steam } from './steam';

export const FLOORS = { clockwork, steam, silicon, genome, intelligence } satisfies Record<string, ChamberSpec>;
export type FloorId = keyof typeof FLOORS;
