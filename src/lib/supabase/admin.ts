import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client service_role : contourne RLS. Réservé aux mutations serveur pour les invités et
 * photographes, qui n'ont pas de session Supabase Auth (accès par code événement / cookie).
 * Ne jamais importer ce module depuis un Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
