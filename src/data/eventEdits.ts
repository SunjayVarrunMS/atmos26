import { useSyncExternalStore, type SyntheticEvent } from 'react';
import snapshot from 'virtual:event-edits';
import CARDS from './eventCards.json';
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

const cards = new Set<string>(CARDS);

// the grid's 4:3 crops of a bundled poster (scripts/event_cards.py); club uploads have none
export function cardSrcSet(image: string): string | undefined {
  const name = /^\/events\/([\w-]+)\.webp$/.exec(image)?.[1];
  if (!name || !cards.has(name)) return undefined;
  return `/events/card/${name}-600.webp 600w, /events/card/${name}.webp 900w`;
}

// a club's poster that won't load (storage down) falls back to the bundled one, else the picture goes
export function posterFallback(id: string, card: boolean) {
  return (ev: SyntheticEvent<HTMLImageElement>) => {
    const img = ev.currentTarget;
    const bundled = EVENTS.find((e) => e.id === id)?.image;
    if (!bundled || img.getAttribute('src') === bundled) {
      img.hidden = true;
      return;
    }
    const set = card ? cardSrcSet(bundled) : undefined;
    if (set) img.srcset = set;
    else img.removeAttribute('srcset');
    img.src = bundled;
  };
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

// this browser's copy of the last edits it fetched, for the next visit and for outages
const CACHE_KEY = 'atmos:event-edits';

function isEdit(row: unknown): row is EventEdit {
  return (
    typeof row === 'object' &&
    row !== null &&
    typeof (row as EventEdit).event_id === 'string' &&
    typeof (row as EventEdit).updated_at === 'string'
  );
}

function readCache(): EventEdit[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]');
    return Array.isArray(rows) ? rows.filter(isEdit) : [];
  } catch {
    return [];
  }
}

function writeCache(rows: EventEdit[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // private mode or a full quota: the next visit fetches again
  }
}

// each event's newest edit across the build's snapshot and this browser's cache
function newest(...lists: EventEdit[][]): EventEdit[] {
  const byId = new Map<string, EventEdit>();
  for (const row of lists.flat()) {
    const had = byId.get(row.event_id);
    if (!had || Date.parse(row.updated_at) > Date.parse(had.updated_at)) byId.set(row.event_id, row);
  }
  return [...byId.values()];
}

// until Supabase answers (or if it never does), the edits baked in at build time
// and the ones this browser saw last stand in for the live table
let merged: FestEvent[] = editingEnabled ? applyEdits(EVENTS, newest(snapshot, readCache())) : EVENTS;
const listeners = new Set<() => void>();
let loading = false;
let loaded = false;
let warned = false;
let failures = 0;
let lastLoad = 0;

async function load(): Promise<void> {
  if (!editingEnabled || loading) return;
  loading = true;
  try {
    // the key as a query parameter keeps this a simple request: no CORS preflight round trip
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/event_edits?select=event_id,venue,when,team,about,image_path,updated_at&apikey=${encodeURIComponent(SUPABASE_ANON_KEY ?? '')}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) throw new Error('unexpected response');
    const edits = rows.filter(isEdit);
    merged = applyEdits(EVENTS, edits);
    writeCache(edits);
    failures = 0;
    lastLoad = Date.now();
    listeners.forEach((listener) => listener());
  } catch (err) {
    // keep whatever we had; the static events are always a fine fallback
    if (!warned) {
      warned = true;
      console.warn('event edits unavailable', err);
    }
    // two spaced-out retries, jittered so a busy Supabase isn't hit by everyone at once
    failures += 1;
    if (failures <= 2) setTimeout(() => void load(), failures * 15000 + Math.random() * 10000);
  } finally {
    loading = false;
  }
}

// a page left open (a phone on the fest's first day) picks up venue and time changes when it comes back
function onVisible(): void {
  if (document.visibilityState === 'visible' && Date.now() - lastLoad > 5 * 60_000) void load();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    void load();
    document.addEventListener('visibilitychange', onVisible);
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
