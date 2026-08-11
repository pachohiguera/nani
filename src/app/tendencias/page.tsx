import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hoursAgoIso } from "@/lib/time";
import { TrendsView } from "@/components/trends/trends-view";

export default async function TendenciasPage() {
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
      <div className="flex flex-1 flex-col bg-zinc-950 px-6 py-5 text-white">
        <p className="text-zinc-500">
          Tu usuario todavía no está vinculado a ningún bebé.
        </p>
      </div>
    );
  }

  const [{ data: caregivers }, { data: categories }, { data: events }] =
    await Promise.all([
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
        .gte("started_at", hoursAgoIso(30 * 24))
        .order("started_at", { ascending: false }),
    ]);

  const caregiverNamesById = Object.fromEntries(
    (caregivers ?? []).map((c) => [c.id, c.nombre_display])
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="flex items-center gap-3 px-6 py-5">
        <Link href="/" className="text-2xl text-zinc-400" aria-label="Volver a Hoy">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Tendencias</h1>
      </header>

      <main className="flex-1 px-4 pb-10">
        <TrendsView
          categories={categories ?? []}
          events={events ?? []}
          caregiverNamesById={caregiverNamesById}
        />
      </main>
    </div>
  );
}
