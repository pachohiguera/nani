"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { baby_invites, caregivers } from "@/lib/db/schema";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O, 1/I/L

function generateCode(length = 8): string {
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join("");
}

interface InviteResult {
  data: { code: string } | null;
  error: { message: string } | null;
}

// Idempotente: si el bebé ya tiene un código, lo reutiliza en vez de crear
// uno nuevo cada vez que alguien abre la pantalla de invitar.
export async function getOrCreateInviteCode(babyId: string): Promise<InviteResult> {
  try {
    const existing = await db.query.baby_invites.findFirst({
      where: eq(baby_invites.baby_id, babyId),
    });
    if (existing) return { data: { code: existing.code }, error: null };

    const [created] = await db
      .insert(baby_invites)
      .values({ baby_id: babyId, code: generateCode() })
      .returning();
    if (!created) return { data: null, error: { message: "No se pudo generar el código" } };
    return { data: { code: created.code }, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

interface JoinResult {
  data: { babyId: string } | null;
  error: { message: string } | null;
}

// Usado al registrarse con un código de invitación: suma a la persona
// logueada como otro caregiver del mismo bebé en vez de crearle uno nuevo.
export async function joinBabyWithCode(
  code: string,
  nombreDisplay: string
): Promise<JoinResult> {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return { data: null, error: { message: "No hay sesión activa" } };

    const invite = await db.query.baby_invites.findFirst({
      where: eq(baby_invites.code, code.trim().toUpperCase()),
    });
    if (!invite) return { data: null, error: { message: "Código de invitación inválido" } };

    const alreadyLinked = await db.query.caregivers.findFirst({
      where: eq(caregivers.user_id, session.user.id),
    });
    if (alreadyLinked) {
      return { data: null, error: { message: "Tu cuenta ya está vinculada a un bebé" } };
    }

    await db.insert(caregivers).values({
      user_id: session.user.id,
      baby_id: invite.baby_id,
      nombre_display: nombreDisplay,
    });

    return { data: { babyId: invite.baby_id }, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}
