import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("*, babies(nombre)")
    .eq("user_id", user!.id)
    .maybeSingle();

  const baby = caregiver?.babies;

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm text-zinc-400">
            {baby ? `Siguiendo a ${baby.nombre}` : "Nani"}
          </p>
          <h1 className="text-2xl font-bold">
            Hola, {caregiver?.nombre_display ?? user?.email}
          </h1>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 text-center text-zinc-500">
        {caregiver ? (
          <p>La vista &quot;Hoy&quot; con el timeline y los botones va aquí.</p>
        ) : (
          <p>
            Tu usuario todavía no está vinculado a ningún bebé. Revisa el
            paso 3 del seed (tabla <code>caregivers</code>).
          </p>
        )}
      </main>
    </div>
  );
}
