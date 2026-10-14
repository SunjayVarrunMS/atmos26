-- Club PORs keep their own events current: venue, day and time, team size,
-- description and poster. events.ts stays the base; a row here overrides those
-- fields on the site, live, with no deploy.
--
-- Who may edit is decided here, not in the browser: an email in `editors` is
-- tied to a club slug (the same slugs as CLUB_LIST in src/data/events.ts), and
-- may write only events whose `event_clubs.clubs` include that club. Admin rows
-- may write every event. Sign-in is Google only (see can_edit_event).

-- ---------------------------------------------------------------------------
-- editors: the allowlist. Filled by hand in the SQL editor, never from the site.
-- ---------------------------------------------------------------------------
create table public.editors (
  email     text    not null check (email = lower(btrim(email))),
  club_slug text    not null,
  is_admin  boolean not null default false,
  primary key (email, club_slug)
);

alter table public.editors enable row level security;

-- a signed-in editor sees only their own rows, so /manage knows which clubs to show
create policy editors_read_own on public.editors
  for select to authenticated
  using (
    email in (
      select lower(i.identity_data ->> 'email')
      from auth.identities i
      where i.user_id = (select auth.uid()) and i.provider = 'google'
    )
  );

-- ---------------------------------------------------------------------------
-- event_clubs: which club runs which event, mirrored from events.ts by
-- scripts/seed_event_clubs.mjs. Public, like the site itself.
-- ---------------------------------------------------------------------------
create table public.event_clubs (
  event_id text   primary key,
  clubs    text[] not null default '{}'
);

alter table public.event_clubs enable row level security;

create policy event_clubs_read on public.event_clubs
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- can_edit_event
-- ---------------------------------------------------------------------------
-- Definer so it can read `editors` and auth.identities past RLS. It only ever
-- answers for the caller. The email comes from the caller's Google identity,
-- not the JWT: a user can change auth.users.email, but not what Google said.
-- So an email/password account, or a changed email, can't borrow a club address.
create function public.can_edit_event(target text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.event_clubs c where c.event_id = target)
    and exists (
      select 1
      from auth.identities i
      join public.editors e on e.email = lower(i.identity_data ->> 'email')
      where i.user_id = (select auth.uid())
        and i.provider = 'google'
        and (
          e.is_admin
          or exists (
            select 1 from public.event_clubs c
            where c.event_id = target and e.club_slug = any (c.clubs)
          )
        )
    );
$$;

revoke execute on function public.can_edit_event(text) from public, anon;
grant  execute on function public.can_edit_event(text) to authenticated;

-- ---------------------------------------------------------------------------
-- has_contact: the site carries no phone numbers, people's emails or handles,
-- and no outside links (AGENTS.md rules 3 and 4). The form checks the same.
-- ---------------------------------------------------------------------------
create function public.has_contact(t text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    -- ten or more digits once spaces, dashes and brackets between them go
    -- (dots stay, so dates and times like 24.10.2026 9.30 pass)
    regexp_replace(t, '(?<=\d)[ ()-]+(?=\d)', '', 'g') ~ '\d{10,}'
    -- emails and @handles (a club name like Traders@BPHC is neither)
    or t ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]'
    or t ~ '(^|\s)@[A-Za-z0-9_.]'
    -- links: a scheme, www., or a bare domain
    or t ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|in|io|org|net|co|me|ly|gg|app|dev|xyz|link|site|page)\M)';
$$;

-- ---------------------------------------------------------------------------
-- event_edits: the overrides. Public read; writes only through can_edit_event.
-- ---------------------------------------------------------------------------
create table public.event_edits (
  -- restrict: renaming an event in events.ts must not silently drop its club's edits
  event_id   text primary key references public.event_clubs (event_id) on delete restrict,
  venue      text check (char_length(venue)   <= 80),
  "when"     text check (char_length("when")  <= 60),
  team       text check (char_length(team)    <= 40),
  about      text check (char_length(about)   <= 600),
  -- a file in the posters bucket, inside this event's own folder
  image_path text check (
    starts_with(image_path, event_id || '/')
    and substr(image_path, length(event_id) + 2) ~ '^[A-Za-z0-9._-]+\.(webp|jpe?g|png)$'
  ),
  updated_at timestamptz not null default now(),
  -- the editor's user id, not their email: this table is public
  updated_by uuid,
  constraint event_edits_no_contacts check (
    -- joined with newlines so one field's digits can't run into the next's
    not public.has_contact(concat_ws(E'\n', venue, "when", team, about))
  )
);

alter table public.event_edits enable row level security;

create policy event_edits_read on public.event_edits
  for select to anon, authenticated
  using (true);

create policy event_edits_insert on public.event_edits
  for insert to authenticated
  with check (public.can_edit_event(event_id));

create policy event_edits_update on public.event_edits
  for update to authenticated
  using (public.can_edit_event(event_id))
  with check (public.can_edit_event(event_id));

-- no delete policy: clearing a field means saving it empty

-- who saved last and when come from the session, not the request
create function public.event_edits_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create trigger event_edits_stamp
  before insert or update on public.event_edits
  for each row execute function public.event_edits_stamp();

-- ---------------------------------------------------------------------------
-- posters bucket: public read; uploads only into posters/<event_id>/ for an
-- event the caller may edit. Each upload gets a new file name, so no upsert
-- and no overwrite policy is needed (and no stale poster in a CDN cache).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posters', 'posters', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy posters_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'posters'
    and public.can_edit_event((storage.foldername(name))[1])
  );

-- ---------------------------------------------------------------------------
-- Auth hook: only allowlisted emails may create an account at all.
-- Turn it on in Dashboard -> Authentication -> Hooks -> Before User Created,
-- pointing at public.hook_editor_signup.
-- ---------------------------------------------------------------------------
create function public.hook_editor_signup(event jsonb)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.editors
    where email = lower(event -> 'user' ->> 'email')
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'This account isn''t set up to edit ATMOS events.'
  ));
end;
$$;

revoke execute on function public.hook_editor_signup(jsonb) from public, anon, authenticated;
grant  execute on function public.hook_editor_signup(jsonb) to supabase_auth_admin;
grant  usage on schema public to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Table privileges: Supabase grants everything on new tables to anon and
-- authenticated. RLS already limits rows; this limits verbs too.
-- ---------------------------------------------------------------------------
revoke all on public.editors     from anon, authenticated;
grant  select on public.editors  to authenticated;
revoke all on public.event_clubs from anon, authenticated;
grant  select on public.event_clubs to anon, authenticated;
revoke all on public.event_edits from anon, authenticated;
grant  select on public.event_edits to anon;
grant  select, insert, update on public.event_edits to authenticated;
revoke execute on function public.has_contact(text) from public, anon;
-- the check constraint runs it as the saving editor
grant  execute on function public.has_contact(text) to authenticated;
