CREATE TABLE "buffered_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text,
	"message_id" text NOT NULL,
	"text" text NOT NULL,
	"ts_ms" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "buffered_messages_uniq_chat_msg" ON "buffered_messages" USING btree ("chat_id","message_id");--> statement-breakpoint
CREATE INDEX "buffered_messages_chat_ts_idx" ON "buffered_messages" USING btree ("chat_id","ts_ms","id");