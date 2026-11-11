import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { caregivers } from "@/lib/db/schema";
import { getOrCreateInviteCode } from "@/lib/invites/actions";
import { InviteCodeCard } from "@/components/invite/invite-code-card";

export const dynamic = "force-dynamic";

export default async function InvitarPage() {
  const { data: session } = await auth.getSession();

  const caregiver = await db.query.caregivers.findFirst({
    where: eq(caregivers.user_id, session!.user.id),
  });

  if (!caregiver) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 px-6 py-5 text-white">
        <p className="text-zinc-500">
          Primero creá el perfil del bebé para poder invitar a alguien más.
        </p>
      </div>
    );
  }

  const { data, error } = await getOrCreateInviteCode(caregiver.baby_id);

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="flex items-center gap-3 px-6 py-5">
        <Link href="/" className="text-2xl text-zinc-400" aria-label="Volver a Hoy">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Invitar</h1>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-10">
        {error || !data ? (
          <p className="text-red-300">{error?.message ?? "No se pudo generar el código."}</p>
        ) : (
          <InviteCodeCard code={data.code} />
        )}
      </main>
    </div>
  );
}
