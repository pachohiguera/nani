CREATE TABLE "babies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"fecha_nacimiento" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caregivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"baby_id" uuid NOT NULL,
	"nombre_display" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "caregivers_user_id_baby_id_unique" UNIQUE("user_id","baby_id")
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"icono" text DEFAULT 'circle' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_categories_tipo_check" CHECK ("event_categories"."tipo" in ('duracion', 'instantaneo'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"caregiver_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"notas" text,
	"origen" text DEFAULT 'boton' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_origen_check" CHECK ("events"."origen" in ('voz', 'boton')),
	CONSTRAINT "events_ended_at_check" CHECK ("events"."ended_at" is null or "events"."ended_at" >= "events"."started_at")
);
--> statement-breakpoint
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caregivers" ADD CONSTRAINT "caregivers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregivers" ADD CONSTRAINT "caregivers_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_caregiver_id_caregivers_id_fk" FOREIGN KEY ("caregiver_id") REFERENCES "public"."caregivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_caregivers_user_id" ON "caregivers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_caregivers_baby_id" ON "caregivers" USING btree ("baby_id");--> statement-breakpoint
CREATE INDEX "idx_event_categories_baby_id" ON "event_categories" USING btree ("baby_id");--> statement-breakpoint
CREATE INDEX "idx_events_baby_started_at" ON "events" USING btree ("baby_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_events_category_id" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_events_caregiver_id" ON "events" USING btree ("caregiver_id");--> statement-breakpoint
CREATE INDEX "idx_events_open" ON "events" USING btree ("baby_id","category_id") WHERE ended_at is null;