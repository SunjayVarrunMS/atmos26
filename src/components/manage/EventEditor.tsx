import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ImageUp } from 'lucide-react';
import { CLUBS, type FestEvent } from '../../data/events';
import { LIMITS, contactProblem, posterUrl, refreshEdits, type EventEdit } from '../../data/eventEdits';
import { supabase } from '../../lib/supabase';
import { toWebp } from '../../lib/poster';

type Field = keyof typeof LIMITS;

const INPUT =
  'w-full border border-stone/20 bg-transparent px-3 text-[0.95rem] text-stone placeholder:text-stone-mute focus:border-brass';

const FIELDS: { key: Field; label: string; placeholder: string }[] = [
  { key: 'venue', label: 'Venue', placeholder: 'Where it happens, e.g. F-block, room 105' },
  { key: 'when', label: 'Day and time', placeholder: 'e.g. Sat 24 Oct, 10:00' },
  { key: 'team', label: 'Team size', placeholder: 'e.g. 2–4, or Solo' },
];

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason: unknown) => {
        clearTimeout(timer);
        reject(reason instanceof Error ? reason : new Error(String(reason)));
      },
    );
  });
}

function looksOffline(err: unknown): boolean {
  const name = err instanceof Error ? err.name : '';
  const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
  return name === 'AbortError' || name === 'TimeoutError' || /fetch|network|abort|timeout/i.test(message);
}

export function EventEditor({
  event,
  edit,
  onSaved,
}: {
  event: FestEvent;
  edit: EventEdit | undefined;
  onSaved: (edit: EventEdit) => void;
}) {
  const headingId = useId();
  const [values, setValues] = useState<Record<Field, string>>({
    venue: edit?.venue ?? event.venue ?? '',
    when: edit?.when ?? event.when ?? '',
    team: edit?.team ?? event.team ?? '',
    about: edit?.about ?? event.about ?? '',
  });
  const [problems, setProblems] = useState<Partial<Record<Field, string>>>({});
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posterNote, setPosterNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // the preview URL is revoked when it changes and when the editor goes away
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const over = (Object.keys(LIMITS) as Field[]).some((key) => values[key].length > LIMITS[key]);

  const set = (key: Field, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setPosterNote(null);
    setSaved(false);
    try {
      const out = await toWebp(file);
      setBlob(out);
      setPreview(URL.createObjectURL(out));
      setPosterNote(`${Math.max(1, Math.round(out.size / 1024))} KB, ready to save`);
    } catch (err) {
      setBlob(null);
      setPreview(null);
      setPosterNote(err instanceof Error ? err.message : 'That file isn’t an image this browser can read.');
    }
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!supabase) return;
    setError(null);
    setSaved(false);

    const clean: Record<Field, string> = {
      venue: values.venue.trim(),
      when: values.when.trim(),
      team: values.team.trim(),
      about: values.about.trim(),
    };
    const found: Partial<Record<Field, string>> = {};
    for (const key of Object.keys(clean) as Field[]) {
      const problem = contactProblem(clean[key]);
      if (problem) found[key] = problem;
    }
    setProblems(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      let imagePath = edit?.image_path ?? null;
      if (blob) {
        const path = `${event.id}/${Date.now()}.webp`;
        const up = await withTimeout(
          supabase.storage
            .from('posters')
            .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false }),
          45000,
        );
        if (up.error) {
          setError(`The poster didn't upload: ${up.error.message}`);
          return;
        }
        imagePath = path;
      }

      // a field left as events.ts has it isn't stored, so later fixes to events.ts still show
      const changed = (key: Field) => (clean[key] === '' || clean[key] === (event[key] ?? '') ? null : clean[key]);
      const { data, error: err } = await withTimeout(
        supabase
          .from('event_edits')
          .upsert(
            {
              event_id: event.id,
              venue: changed('venue'),
              when: changed('when'),
              team: changed('team'),
              about: changed('about'),
              image_path: imagePath,
            },
            { onConflict: 'event_id' },
          )
          .abortSignal(AbortSignal.timeout(15000))
          .select()
          .single(),
        15000,
      );
      if (err) {
        if (err.code === '23514') setError('That text has a phone number, email or link in it.');
        else if (err.code === '42501' || err.message.includes('row-level security'))
          setError('This account can’t edit this event.');
        else if (looksOffline(err))
          setError('Couldn’t reach the editing service. Check your connection and save again.');
        else setError(`Couldn’t save: ${err.message}`);
        return;
      }
      setBlob(null);
      setSaved(true);
      refreshEdits();
      onSaved(data as EventEdit);
    } catch (thrown) {
      setError(
        looksOffline(thrown)
          ? 'Couldn’t reach the editing service. Check your connection and save again.'
          : 'Couldn’t save. Try again in a minute.',
      );
    } finally {
      setSaving(false);
    }
  };

  const poster = preview ?? (edit?.image_path ? posterUrl(edit.image_path) : event.image);
  const clubs = (event.clubs ?? []).map((slug) => CLUBS[slug].name).join(' × ');

  return (
    <article aria-labelledby={headingId} className="border-t border-stone/12 pt-8">
      <h2 id={headingId} className="display text-[2rem] text-stone">
        {event.title}
      </h2>
      <p className="mt-1 text-stone-mute">
        {clubs}
        {edit &&
          ` · Last saved ${new Date(edit.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`}
      </p>

      <form onSubmit={submit} className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-stone-dim">{f.label}</span>
                <input
                  type="text"
                  value={values[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`${INPUT} mt-1 h-11`}
                />
                <Counter len={values[f.key].length} limit={LIMITS[f.key]} />
                {problems[f.key] && (
                  <span role="alert" className="block text-brass-hi">
                    {problems[f.key]}
                  </span>
                )}
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-stone-dim">Description</span>
            <textarea
              rows={5}
              value={values.about}
              onChange={(e) => set('about', e.target.value)}
              placeholder="One or two plain sentences about the event"
              className={`${INPUT} mt-1 min-h-32 py-2`}
            />
            <Counter len={values.about.length} limit={LIMITS.about} />
            {problems.about && (
              <span role="alert" className="block text-brass-hi">
                {problems.about}
              </span>
            )}
          </label>
        </div>

        <div className="mt-8 lg:mt-0">
          {poster ? (
            <img src={poster} alt={`${event.title} poster`} className="w-full border border-stone/12" />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center border border-stone/12 text-stone-mute">
              No poster yet
            </div>
          )}
          <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 border border-stone/35 px-5 text-[0.95rem] font-medium text-stone hover:border-brass hover:text-brass-hi has-[:focus-visible]:border-brass">
            <ImageUp className="size-4" strokeWidth={1.5} aria-hidden />
            Choose a poster
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {posterNote && <p className="mt-2 text-[0.9rem] text-stone-dim">{posterNote}</p>}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 lg:col-span-2">
          <button
            type="submit"
            disabled={saving || over || !supabase}
            className="inline-flex h-11 items-center justify-center gap-2 bg-stone px-5 font-semibold text-void hover:bg-brass-hi disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <p role="status" className="text-stone-dim">
            {error}
            {saved && (
              <>
                Saved. It’s live on the site.{' '}
                <Link to={`/events/${event.id}`} className="text-stone underline underline-offset-4 hover:text-brass-hi">
                  See it
                </Link>
              </>
            )}
          </p>
        </div>
      </form>
    </article>
  );
}

function Counter({ len, limit }: { len: number; limit: number }) {
  return (
    <span className="mt-1 block text-right text-[0.85rem] text-stone-mute" aria-live={len > limit ? 'polite' : undefined}>
      {len}/{limit}
    </span>
  );
}
