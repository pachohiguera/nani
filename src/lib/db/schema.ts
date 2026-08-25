import {
  boolean,
  check,
  date,
  index,
  integer,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { EventOrigin, EventType } from "@/types/database";

// Tabla de usuarios gestionada por Neon Managed Better Auth. No la creamos
// nosotros (Neon ya la provisionó); la declaramos solo para poder referenciarla
// desde `caregivers.user_id` con tipado.
const neonAuth = pgSchema("neon_auth");
export const neonAuthUser = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
});

// Los nombres de propiedad usan snake_case a propósito, igual que las
// columnas: así las filas que devuelve Drizzle calzan directo con los tipos
// de src/types/database.ts (heredados de Supabase) sin mapeos intermedios.
export const babies = pgTable("babies", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  fecha_nacimiento: date("fecha_nacimiento", { mode: "string" }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const caregivers = pgTable(
  "caregivers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => neonAuthUser.id, { onDelete: "cascade" }),
    baby_id: uuid("baby_id")
      .notNull()
      .references(() => babies.id, { onDelete: "cascade" }),
    nombre_display: text("nombre_display").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.user_id, table.baby_id),
    index("idx_caregivers_user_id").on(table.user_id),
    index("idx_caregivers_baby_id").on(table.baby_id),
  ]
);

export const event_categories = pgTable(
  "event_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    baby_id: uuid("baby_id")
      .notNull()
      .references(() => babies.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    tipo: text("tipo").notNull().$type<EventType>(),
    color: text("color").notNull().default("#6366f1"),
    icono: text("icono").notNull().default("circle"),
    activo: boolean("activo").notNull().default(true),
    orden: integer("orden").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_event_categories_baby_id").on(table.baby_id),
    check("event_categories_tipo_check", sql`${table.tipo} in ('duracion', 'instantaneo')`),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    baby_id: uuid("baby_id")
      .notNull()
      .references(() => babies.id, { onDelete: "cascade" }),
    category_id: uuid("category_id")
      .notNull()
      .references(() => event_categories.id, { onDelete: "restrict" }),
    caregiver_id: uuid("caregiver_id")
      .notNull()
      .references(() => caregivers.id, { onDelete: "restrict" }),
    started_at: timestamp("started_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    ended_at: timestamp("ended_at", { withTimezone: true, mode: "string" }),
    duration_seconds: integer("duration_seconds"),
    paused_seconds: integer("paused_seconds").notNull().default(0),
    paused_at: timestamp("paused_at", { withTimezone: true, mode: "string" }),
    notas: text("notas"),
    origen: text("origen").notNull().default("boton").$type<EventOrigin>(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_events_baby_started_at").on(table.baby_id, table.started_at),
    index("idx_events_category_id").on(table.category_id),
    index("idx_events_caregiver_id").on(table.caregiver_id),
    // Acelera la búsqueda del cronómetro abierto por categoría.
    index("idx_events_open").on(table.baby_id, table.category_id).where(sql`ended_at is null`),
    check("events_origen_check", sql`${table.origen} in ('voz', 'boton')`),
    check(
      "events_ended_at_check",
      sql`${table.ended_at} is null or ${table.ended_at} >= ${table.started_at}`
    ),
  ]
);
