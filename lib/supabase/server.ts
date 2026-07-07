import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client used inside Server Components (homepage, article pages,
// category pages, sitemap). It only ever reads with the anon key, so it can
// only see what RLS already exposes publicly (status = 'published').
// This is what makes SEO work: the fetch happens before HTML is sent to
// the browser, so crawlers and link-preview bots see real content immediately.
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});
