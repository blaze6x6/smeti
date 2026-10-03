CREATE TABLE "imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"filename" text,
	"method" text DEFAULT 'unknown' NOT NULL,
	"events_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"types" text[] NOT NULL,
	"note" text,
	"year" integer NOT NULL,
	"village" text DEFAULT 'smokuc' NOT NULL,
	"source" text DEFAULT 'seed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"target_date" text NOT NULL,
	"village" text DEFAULT 'smokuc' NOT NULL,
	"recipients" integer DEFAULT 0 NOT NULL,
	"types" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'ok' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"village" text DEFAULT 'smokuc' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_date_village_uq" ON "schedules" USING btree ("date","village");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_uq" ON "subscribers" USING btree ("email");