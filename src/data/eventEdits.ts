import { useSyncExternalStore } from 'react';
import { EVENTS, type FestEvent } from './events';

// club PORs edit some fields of their events in Supabase. Public pages read them
// with plain fetch and the public anon key, so supabase-js stays out of this bundle.
export const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL || undefined;
export const SUPABASE_ANON_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY || undefined;
export const editingEnabled: boolean = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export interface EventEdit {
  event_id: string;
  venue: string | null;
  when: string | null;
  team: string | null;
  about: string | null;
  image_path: string | null;
  updated_at: string;
}

// the same limits the table checks
export const LIMITS = { venue: 80, when: 60, team: 40, about: 600 } as const;

export function posterUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/posters/${path}`;
}

const TEXT_FIELDS = ['venue', 'when', 'team', 'about'] as const;

// lays the clubs' edits over the static events; never mutates the input
export function applyEdits(events: FestEvent[], edits: EventEdit[]): FestEvent[] {
  const byId = new Map(edits.map((edit) => [edit.event_id, edit]));
  return events.map((event) => {
    const edit = byId.get(event.id);
    if (!edit) return event;
    const next: FestEvent = { ...event };
    for (const field of TEXT_FIELDS) {
      const value = edit[field]?.trim();
      if (value) next[field] = value;
    }
    if (edit.image_path) next.image = posterUrl(edit.image_path);
    return next;
  });
}

// mirrors public.has_contact in the migration: returns the first message that applies
export function contactProblem(text: string): string | null {
  // spaces, dashes and brackets between digits go; dots stay so 24.10.2026 9.30 passes
  if (/\d{10,}/.test(text.replace(/(?<=\d)[ ()-]+(?=\d)/g, ''))) return 'Phone numbers can’t go on the site.';
  if (/[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]/i.test(text) || /(^|\s)@[A-Za-z0-9_.]/.test(text)) {
    return 'Emails and @handles can’t go on the site.';
  }
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|io|org|net|co|me|ly|gg|app|dev|xyz|link|site|page)\b)/i.test(text)) {
    return 'Links can’t go on the site. Registration is on Flemmingo.';
  }
  return null;
}

let merged: FestEvent[] = EVENTS;
const listeners = new Set<() => void>();
let loading = false;
let loaded = false;
let warned = false;

async function load(): Promise<void> {
  if (!editingEnabled || loading) return;
  loading = true;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/event_edits?select=event_id,venue,when,team,about,image_path,updated_at`,
      {
        headers: { apikey: SUPABASE_ANON_KEY ?? '', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) throw new Error('unexpected response');
    merged = applyEdits(EVENTS, rows as EventEdit[]);
    listeners.forEach((listener) => listener());
  } catch (err) {
    // keep whatever we had; the static events are always a fine fallback
    if (!warned) {
      warned = true;
      console.warn('event edits unavailable', err);
    }
  } finally {
    loading = false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    void load();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function refreshEdits(): void {
  void load();
}

export function useEvents(): FestEvent[] {
  return useSyncExternalStore(subscribe, () => merged, () => merged);
}

export function useEvent(id: string | undefined): FestEvent | undefined {
  return useEvents().find((e) => e.id === id);
}
