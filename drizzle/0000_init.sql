CREATE TYPE "public"."link_status" AS ENUM('ok', 'broken');--> statement-breakpoint
CREATE TYPE "public"."parse_status" AS ENUM('ok', 'no_date', 'check');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('kstartup', 'gov24', 'manual');--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color_token" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"start_month" integer,
	"end_month" integer,
	"site_id" text,
	"note" text,
	"age_groups" text[] DEFAULT '{}' NOT NULL,
	"region_codes" text[] DEFAULT '{}' NOT NULL,
	"industries" text[] DEFAULT '{}' NOT NULL,
	"verified_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source" NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"org" text NOT NULL,
	"category_id" text NOT NULL,
	"apply_start" date,
	"apply_end" date,
	"is_always" boolean DEFAULT false NOT NULL,
	"detail_url" text NOT NULL,
	"age_groups" text[] DEFAULT '{}' NOT NULL,
	"region_codes" text[] DEFAULT '{}' NOT NULL,
	"sigungu_code" text,
	"industries" text[] DEFAULT '{}' NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"parse_status" "parse_status" DEFAULT 'ok' NOT NULL,
	"link_status" "link_status",
	"raw_payload" jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region_agency" (
	"id" text PRIMARY KEY NOT NULL,
	"region_code" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"verified_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"summary" text NOT NULL,
	"target" text[] DEFAULT '{}' NOT NULL,
	"url" text NOT NULL,
	"operator" text NOT NULL,
	"verified_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"fetched" integer DEFAULT 0 NOT NULL,
	"inserted" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"ok" boolean DEFAULT false NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice" ADD CONSTRAINT "notice_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notice_source_uniq" ON "notice" USING btree ("source","source_id");