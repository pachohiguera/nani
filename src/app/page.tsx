import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hoursAgoIso } from "@/lib/time";
import { LogoutButton } from "@/components/logout-button";
import { TodayView } from "@/components/today/today-view";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!caregiver) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <header className="flex items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold">Nani</h1>
          <LogoutButton />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 text-center text-zinc-500">
          <p>
            Tu usuario todavía no está vinculado a ningún bebé. Revisa el
            paso 3 del seed (tabla <code>caregivers</code>).
          </p>
        </main>
      </div>
    );
  }

  const [{ data: baby }, { data: caregivers }, { data: categories }, { data: events }] =
    await Promise.all([
      supabase
        .from("babies")
        .select("nombre")
        .eq("id", caregiver.baby_id)
        .maybeSingle(),
      supabase
        .from("caregivers")
        .select("id, nombre_display")
        .eq("baby_id", caregiver.baby_id),
      supabase
        .from("event_categories")
        .select("*")
        .eq("baby_id", caregiver.baby_id)
        .eq("activo", true)
        .order("orden"),
      supabase
        .from("events")
        .select("*")
        .eq("baby_id", caregiver.baby_id)
        .gte("started_at", hoursAgoIso(48))
        .order("started_at", { ascending: false }),
    ]);

  const caregiverNamesById = Object.fromEntries(
    (caregivers ?? []).map((c) => [c.id, c.nombre_display])
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm text-zinc-400">
            {baby ? `Siguiendo a ${baby.nombre}` : "Nani"}
          </p>
          <h1 className="text-2xl font-bold">Hola, {caregiver.nombre_display}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tendencias" className="text-sm font-medium text-zinc-400">
            Tendencias
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 pb-10">
        <TodayView
          babyId={caregiver.baby_id}
          caregiverId={caregiver.id}
          categories={categories ?? []}
          initialEvents={events ?? []}
          caregiverNamesById={caregiverNamesById}
        />
      </main>
    </div>
  );
}
