// Prints the SQL that mirrors which club runs which event (src/data/events.ts)
// into Supabase's event_clubs table, so the database knows who may edit what.
// Re-run it whenever an event is added or changes clubs, and paste the output
// into the SQL editor:
//   node scripts/seed_event_clubs.mjs > supabase/.local/event_clubs.sql
// Node 24 strips the TypeScript types from events.ts itself.
import { EVENTS } from '../src/data/events.ts';

const q = (s) => `'${s.replace(/'/g, "''")}'`;

const rows = EVENTS.map((e) => `  (${q(e.id)}, array[${(e.clubs ?? []).map(q).join(', ')}]::text[])`);

console.log(`insert into public.event_clubs (event_id, clubs) values
${rows.join(',\n')}
on conflict (event_id) do update set clubs = excluded.clubs;

-- events no longer in events.ts (their edits go with them)
delete from public.event_clubs where event_id not in (${EVENTS.map((e) => q(e.id)).join(', ')});`);
