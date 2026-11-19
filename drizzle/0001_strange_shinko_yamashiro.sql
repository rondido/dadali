-- pg_trgm이 있어야 trigram 색인을 만들 수 있다 (supabase/extensions.sql과 같은 내용)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;--> statement-breakpoint
CREATE TYPE "public"."dictionary_kind" AS ENUM('region', 'age', 'industry', 'topic');--> statement-breakpoint
CREATE TYPE "public"."dictionary_source" AS ENUM('bjd', 'ksic', 'manual');--> statement-breakpoint
CREATE TABLE "dictionary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"kind" "dictionary_kind" NOT NULL,
	"value" text NOT NULL,
	"ambiguous_with" text[] DEFAULT '{}' NOT NULL,
	"source" "dictionary_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unknown_term" (
	"term" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_reviewed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unknown_term_len" CHECK (char_length("unknown_term"."term") > 2),
	CONSTRAINT "unknown_term_not_number" CHECK ("unknown_term"."term" !~ '^[0-9]+$')
);
--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "link_path" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "sigungu_code" text;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "summary_text" text;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "topics" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(org, '') || ' ' || coalesce(summary_text, ''))) STORED;--> statement-breakpoint
CREATE UNIQUE INDEX "dictionary_term_kind_uniq" ON "dictionary" USING btree ("term","kind");--> statement-breakpoint
CREATE INDEX "dictionary_term_trgm_idx" ON "dictionary" USING gin ("term" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "notice_apply_end_idx" ON "notice" USING btree ("apply_end");--> statement-breakpoint
CREATE INDEX "notice_search_idx" ON "notice" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "notice_title_trgm_idx" ON "notice" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_start_month" CHECK ("event"."start_month" between 1 and 12);--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_end_month" CHECK ("event"."end_month" between 1 and 12);--> statement-breakpoint
ALTER TABLE "notice" ADD CONSTRAINT "notice_summary_len" CHECK (char_length("notice"."summary_text") <= 300);--> statement-breakpoint
ALTER TABLE "region_agency" ADD CONSTRAINT "region_agency_official_url" CHECK ("region_agency"."url" ~* '^https?://([a-z0-9-]+\.)*(go\.kr|or\.kr|gov\.kr|sbiz24\.kr)(/|$)');--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_summary_len" CHECK (char_length("site"."summary") <= 60);--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_official_url" CHECK ("site"."url" ~* '^https?://([a-z0-9-]+\.)*(go\.kr|or\.kr|gov\.kr|sbiz24\.kr)(/|$)');