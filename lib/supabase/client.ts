import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { url, publishableKey } = getSupabasePublicEnvironment();

  return createBrowserClient<Database>(url, publishableKey);
}
