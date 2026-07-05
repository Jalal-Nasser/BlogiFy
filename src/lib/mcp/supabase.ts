import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Lazy per-invocation client. Do NOT create at module scope — env vars are not
// available during build-time manifest extraction or Worker cold-start module eval.
export function getPublicSupabase(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const POST_COLUMNS =
  "id,title,slug,excerpt,featured_image_url,author,category_slug,tags,published_at,read_time_minutes";
