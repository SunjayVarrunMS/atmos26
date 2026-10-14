import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../data/eventEdits';

// only /manage imports this, so supabase-js stays out of the public pages' bundle.
// null when the project isn't configured (local without .env.local, CI builds).
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
      })
    : null;
