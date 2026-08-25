ALTER TABLE "events" ADD COLUMN "session_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_events_session_id" ON "events" USING btree ("session_id") WHERE session_id is not null;