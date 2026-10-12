CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"village" text DEFAULT 'smokuc' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_ok_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sent_logs" ADD COLUMN "channel" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "push_endpoint_uq" ON "push_subscriptions" USING btree ("endpoint");
