import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Cliente de navegador. La sesión se persiste en localStorage y el token
// se refresca automáticamente en background para que papá/mamá no tengan
// que volver a loguearse (requisito de sesión de larga duración).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
