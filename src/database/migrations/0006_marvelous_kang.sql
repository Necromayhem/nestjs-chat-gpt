CREATE TABLE "summarization_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation_summaries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"from_ts_ms" bigint NOT NULL,
	"to_ts_ms" bigint NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "summarization_jobs_status_created_idx" ON "summarization_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "summarization_jobs_chat_idx" ON "summarization_jobs" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "conversation_summaries_chat_created_idx" ON "conversation_summaries" USING btree ("chat_id","created_at");