import Link from "next/link";
import { and, desc, eq, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { babies, caregivers, event_categories, events } from "@/lib/db/schema";
import { hoursAgoIso } from "@/lib/time";
import { LogoutButton } from "@/components/logout-button";
import { TodayView } from "@/components/today/today-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();

  const caregiver = await db.query.caregivers.findFirst({
    where: eq(caregivers.user_id, session!.user.id),
  });

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

  const [baby, sameBabyCaregivers, categories, recentEvents] = await Promise.all([
    db.query.babies.findFirst({ where: eq(babies.id, caregiver.baby_id) }),
    db.query.caregivers.findMany({ where: eq(caregivers.baby_id, caregiver.baby_id) }),
    db.query.event_categories.findMany({
      where: and(eq(event_categories.baby_id, caregiver.baby_id), eq(event_categories.activo, true)),
      orderBy: event_categories.orden,
    }),
    db.query.events.findMany({
      where: and(eq(events.baby_id, caregiver.baby_id), gte(events.started_at, hoursAgoIso(48))),
      orderBy: desc(events.started_at),
    }),
  ]);

  const caregiverNamesById = Object.fromEntries(
    sameBabyCaregivers.map((c) => [c.id, c.nombre_display])
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
          categories={categories}
          initialEvents={recentEvents}
          caregiverNamesById={caregiverNamesById}
        />
      </main>
    </div>
  );
}
