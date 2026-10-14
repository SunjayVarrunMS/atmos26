import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogIn, LogOut } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EventEditor } from '../components/manage/EventEditor';
import { editingEnabled, type EventEdit } from '../data/eventEdits';
import { CLUBS, EVENTS, type ClubSlug } from '../data/events';
import { CONTACT } from '../data/fest';
import { supabase } from '../lib/supabase';

const SECONDARY =
  'inline-flex h-11 items-center justify-center gap-2 border border-stone/35 px-5 text-[0.95rem] font-medium text-stone hover:border-brass hover:text-brass-hi';
const PRIMARY =
  'inline-flex h-11 items-center justify-center gap-2 bg-stone px-5 font-semibold text-void hover:bg-brass-hi';

interface EditorRow {
  slug: string;
  isAdmin: boolean;
}

// supabase sends sign-in failures back in the query string or the hash. The
// text there is never shown as is, so a crafted link can't put words on the site.
function readAuthError(): string | null {
  const fromSearch = new URLSearchParams(location.search);
  const fromHash = new URLSearchParams(location.hash.slice(1));
  const failed = [fromSearch, fromHash].some((p) => p.has('error') || p.has('error_description'));
  return failed
    ? `That Google account isn’t set up to edit events. Sign in with your club’s account, or email ${CONTACT.email}.`
    : null;
}

export default function Manage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  // the editor rows and edits fetched for one user; ignored once the user changes
  const [loaded, setLoaded] = useState<{ userId: string; clubs: EditorRow[]; error: string | null } | null>(null);
  const [edits, setEdits] = useState<Record<string, EventEdit>>({});
  const [authError] = useState<string | null>(readAuthError);

  // an admin page: keep it out of search results
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  useEffect(() => {
    if (authError) history.replaceState(null, '', '/manage');
  }, [authError]);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase || !userId) return;
    let live = true;
    void Promise.all([
      supabase.from('editors').select('club_slug,is_admin'),
      supabase.from('event_edits').select('*'),
    ]).then(([editorRes, editRes]) => {
      if (!live) return;
      const failure = editorRes.error ?? editRes.error;
      if (failure) {
        setLoaded({ userId, clubs: [], error: failure.message });
        return;
      }
      const rows = (editorRes.data ?? []).map((r) => ({ slug: r.club_slug as string, isAdmin: Boolean(r.is_admin) }));
      setLoaded({ userId, clubs: rows, error: null });
      const byId: Record<string, EventEdit> = {};
      for (const row of (editRes.data ?? []) as EventEdit[]) byId[row.event_id] = row;
      setEdits(byId);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  if (!editingEnabled || !supabase) {
    return (
      <PageHeader title="Edit your event">Editing isn’t switched on yet. Email {CONTACT.email} for changes.</PageHeader>
    );
  }

  if (!ready) return null;

  const client = supabase;
  const mine = loaded && loaded.userId === userId ? loaded : null;
  const clubs = mine ? mine.clubs : null;
  const loadError = mine?.error ?? null;
  const signOut = (
    <button type="button" onClick={() => void client.auth.signOut()} className={SECONDARY}>
      <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
      Sign out
    </button>
  );

  if (!session) {
    const signIn = () =>
      void client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/manage`, queryParams: { prompt: 'select_account' } },
      });
    return (
      <>
        <PageHeader title="Edit your event">
          For club PORs. Sign in with your club’s BITS Google account to change your events’ venue, time, description
          and poster.
        </PageHeader>
        <section className="px-4 pb-24 sm:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-12">
            <div className="flex flex-col items-start gap-4">
              {authError && (
                <p role="alert" className="text-brass-hi">
                  {authError}
                </p>
              )}
              <button type="button" onClick={signIn} className={PRIMARY}>
                <LogIn className="size-4" strokeWidth={1.5} aria-hidden />
                Sign in with Google
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const isAdmin = clubs?.some((c) => c.isAdmin) ?? false;
  const slugs = clubs?.map((c) => c.slug) ?? [];
  const shown = isAdmin ? EVENTS : EVENTS.filter((e) => e.clubs?.some((c) => slugs.includes(c)));
  const clubNames = isAdmin
    ? 'All events (admin)'
    : slugs.map((s) => (s in CLUBS ? CLUBS[s as ClubSlug].name : s)).join(' × ');

  return (
    <>
      <PageHeader title="Edit your event">
        Signed in as {session.user.email}. Changes go live as soon as you save.
      </PageHeader>
      <section className="px-4 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-12">
          {authError && (
            <p role="alert" className="text-brass-hi">
              {authError}
            </p>
          )}
          {loadError ? (
            <p role="alert" className="text-brass-hi">
              Couldn’t load your events: {loadError}
            </p>
          ) : clubs === null ? (
            <p className="text-stone-mute">Loading your events…</p>
          ) : clubs.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-stone-dim">
                This account isn’t set up to edit events. Sign in with your club’s account, or email {CONTACT.email}.
              </p>
              {signOut}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-stone-dim">{clubNames}</p>
                {signOut}
              </div>
              {shown.length === 0 ? (
                <p className="text-stone-dim">
                  Your club has no events listed yet. Email {CONTACT.email} to add one.
                </p>
              ) : (
                shown.map((e) => (
                  <EventEditor
                    key={e.id}
                    event={e}
                    edit={edits[e.id]}
                    onSaved={(row) => setEdits((prev) => ({ ...prev, [row.event_id]: row }))}
                  />
                ))
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
