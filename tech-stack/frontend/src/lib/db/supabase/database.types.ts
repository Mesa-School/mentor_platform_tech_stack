/**
 * Generated table types. Regenerate AFTER every migration, never before:
 *
 *     npx supabase gen types typescript --linked > src/lib/db/supabase/database.types.ts
 *
 * Generating against a database you have not just migrated means the types
 * describe a schema you do not have — correct code then fails to compile and
 * the temptation is to "fix" working code.
 *
 * This placeholder keeps the app compiling before your first migration.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
