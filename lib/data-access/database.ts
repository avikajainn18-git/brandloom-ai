import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type DatabaseClient = SupabaseClient<Database>;
export type TableName = keyof Database["public"]["Tables"];
export type TableRow<Name extends TableName> =
  Database["public"]["Tables"][Name]["Row"];
export type TableInsert<Name extends TableName> =
  Database["public"]["Tables"][Name]["Insert"];
export type TableUpdate<Name extends TableName> =
  Database["public"]["Tables"][Name]["Update"];

/**
 * Returns the typed server-side database client. Query and mutation methods
 * will be added by later phases; this foundation does not implement CRUD.
 */
export async function getDatabaseClient(): Promise<DatabaseClient> {
  return createSupabaseServerClient();
}
