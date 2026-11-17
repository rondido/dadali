ALTER TABLE "notice" ADD COLUMN "content_hash" text;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "tag_hash" text;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "tag_model" text;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "tagged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notice" ADD COLUMN "minors_only" boolean DEFAULT false NOT NULL;