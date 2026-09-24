import Link from "next/link";
import { and, desc, eq, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { caregivers, event_categories, events } from "@/lib/db/schema";
import { hoursAgoIso } from "@/lib/time";
import { TrendsView } from "@/components/trends/trends-view";

export const dynamic = "force-dynamic";

export default async function TendenciasPage() {
  const { data: session } = await auth.getSession();

  const caregiver = await db.query.caregivers.findFirst({
    where: eq(caregivers.user_id, session!.user.id),
  });

  if (!caregiver) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 px-6 py-5 text-white">
        <p className="text-zinc-500">
          Tu usuario todavía no está vinculado a ningún bebé.
        </p>
      </div>
    );
  }

  const [sameBabyCaregivers, categories, rangeEvents] = await Promise.all([
    db.query.caregivers.findMany({ where: eq(caregivers.baby_id, caregiver.baby_id) }),
    db.query.event_categories.findMany({
      where: and(eq(event_categories.baby_id, caregiver.baby_id), eq(event_categories.activo, true)),
      orderBy: event_categories.orden,
    }),
    db.query.events.findMany({
      where: and(eq(events.baby_id, caregiver.baby_id), gte(events.started_at, hoursAgoIso(30 * 24))),
      orderBy: desc(events.started_at),
    }),
  ]);

  const caregiverNamesById = Object.fromEntries(
    sameBabyCaregivers.map((c) => [c.id, c.nombre_display])
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
          categories={categories}
          events={rangeEvents}
          caregiverNamesById={caregiverNamesById}
        />
      </main>
    </div>
  );
}
