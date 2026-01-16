ALTER TABLE "posts" ADD COLUMN "test_1" varchar DEFAULT 'первая тестовая миграция' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "test_!";