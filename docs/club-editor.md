# Club editor (/manage)

Club PORs keep their own events current at `atmos-bits.com/manage`: venue, day and time, team size, description and poster. A save goes live on `/events` and `/events/<id>` within seconds, with no deploy. Title, fee, prize and clubs stay in `src/data/events.ts`, because they are tied to Flemmingo and the brochure.

How it fits together:
- `src/data/events.ts` stays the base. Supabase holds only the overrides (`event_edits`). The site lays them over `EVENTS` after the first render (`src/data/eventEdits.ts`). If Supabase is down or the env vars are missing, the site shows `events.ts` as it is.
- Sign-in is Google only. An account can edit an event only if its email is in `editors` with one of that event's club slugs. The database enforces this (RLS in `supabase/migrations/0001_event_edits.sql`), not the browser.
- The database refuses phone numbers, emails, @handles and links in any field (AGENTS.md rules 3 and 4). The form checks the same before saving.
- Posters are resized to WebP in the browser (≤ 1200 px wide, about 300 KB) and stored in the public `posters` bucket under `<event_id>/`.

## One-time setup

1. **Supabase project.** Create a free project. In the SQL editor, run `supabase/migrations/0001_event_edits.sql`.
2. **Which club runs which event.** Run `node scripts/seed_event_clubs.mjs > supabase/.local/event_clubs.sql` and paste the output into the SQL editor.
3. **The allowlist.** Add each club's BITS account to `editors`. Keep the SQL with real emails in `supabase/.local/`, which is gitignored:
   ```sql
   insert into public.editors (email, club_slug) values ('<club account>', '<club slug from CLUB_LIST>');
   -- a fest-team admin who can edit every event (the club slug is required but unused)
   insert into public.editors (email, club_slug, is_admin) values ('<admin account>', '<any slug>', true);
   ```
4. **Google sign-in.** In Google Cloud, create an OAuth client (Web application). Set its authorised redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase → Authentication → Sign In / Providers: turn **Google** on with that client ID and secret, and turn **Email off**. Leave "Confirm email" and "Secure email change" on (the defaults).
5. **Redirects.** Supabase → Authentication → URL Configuration: set Site URL to `https://atmos-bits.com`, and add `https://atmos-bits.com/manage` and `http://localhost:5173/manage` to the redirect URLs.
6. **Only allowlisted accounts.** Supabase → Authentication → Hooks → Before User Created: choose the Postgres function `public.hook_editor_signup`.
7. **Env vars.** Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API) in `.env.local`, and in Vercel's project settings for Production and Preview. Then redeploy. See `.env.example`.

## Day to day

- **A new POR or club account:** insert a row into `editors`, and add the same address as a test user in Google Cloud → Google Auth Platform → Audience. The Google app stays in Testing (publishing needs a privacy policy page), so only test users can sign in (up to 100), and each sees a one-time "Google hasn't verified this app" screen. To remove access, delete the `editors` row. The account can still sign in but can't save anything.
- **A new event in `events.ts`:** re-run step 2, so its club can edit it. If an event with saved edits is renamed or removed, the seed's delete stops with an error rather than dropping the club's edits. Move or delete that `event_edits` row first.
- **Undo a bad edit:** in the Table editor, open `event_edits` and clear the field or delete the row. The site falls back to `events.ts`.
- **Share cards** (`/events/<id>` previews on WhatsApp and Instagram) are built from `events.ts` at deploy time, so a POR's edit doesn't change them until the facts are copied into `events.ts`.
