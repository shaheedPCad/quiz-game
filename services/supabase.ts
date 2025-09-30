import { ENV } from "@/config/env";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  ENV.EXPO_PUBLIC_SUPABASE_URL,
  ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// one-liner to ensure we have a user (anonymous sign-in)
export async function ensureAnon() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.signInAnonymously();
}
