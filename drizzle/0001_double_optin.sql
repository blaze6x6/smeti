ALTER TABLE "subscribers" ADD COLUMN "confirmed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "pending_village" text;
