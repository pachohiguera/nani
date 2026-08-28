"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { babies, caregivers, event_categories } from "@/lib/db/schema";

interface CreateBabyResult {
  data: { babyId: string } | null;
  error: { message: string } | null;
}

// Mismo set de categorías que usa cualquier bebé nuevo en la app — así cada
// familia que se suma arranca con exactamente lo mismo que Nani ya trae.
const DEFAULT_CATEGORIES = [
  { nombre: "Seno izquierdo", tipo: "duracion" as const, color: "#ec4899", icono: "breast-left", orden: 1 },
  { nombre: "Seno derecho", tipo: "duracion" as const, color: "#db2777", icono: "breast-right", orden: 2 },
  { nombre: "Biberón", tipo: "duracion" as const, color: "#f59e0b", icono: "bottle", orden: 3 },
  { nombre: "Pañal - pipí", tipo: "instantaneo" as const, color: "#38bdf8", icono: "droplet", orden: 4 },
  { nombre: "Pañal - popó", tipo: "instantaneo" as const, color: "#a16207", icono: "diaper", orden: 5 },
  { nombre: "Pañal - pipí y popó", tipo: "instantaneo" as const, color: "#78716c", icono: "diaper-mix", orden: 6 },
  { nombre: "Sueño", tipo: "duracion" as const, color: "#6366f1", icono: "moon", orden: 7 },
  { nombre: "Medicina", tipo: "instantaneo" as const, color: "#14b8a6", icono: "medicine", orden: 8 },
];

// Onboarding self-servicio: la persona logueada que todavía no tiene un
// bebé vinculado arma el suyo. Queda como único caregiver hasta que alguien
// más se vincule (eso hoy se hace por SQL, igual que con Papá/Mamá).
export async function createBabyProfile(
  nombre: string,
  fechaNacimiento: string
): Promise<CreateBabyResult> {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return { data: null, error: { message: "No hay sesión activa" } };

    const trimmedName = nombre.trim();
    if (!trimmedName) return { data: null, error: { message: "Falta el nombre del bebé" } };
    if (!fechaNacimiento) return { data: null, error: { message: "Falta la fecha de nacimiento" } };

    const [baby] = await db
      .insert(babies)
      .values({ nombre: trimmedName, fecha_nacimiento: fechaNacimiento })
      .returning();
    if (!baby) return { data: null, error: { message: "No se pudo crear el bebé" } };

    await db.insert(caregivers).values({
      user_id: session.user.id,
      baby_id: baby.id,
      nombre_display: session.user.name || "Caregiver",
    });

    await db.insert(event_categories).values(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, baby_id: baby.id }))
    );

    return { data: { babyId: baby.id }, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}
