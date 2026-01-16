CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(20) NOT NULL,
	"content" varchar(1000) NOT NULL,
	"ownerId" integer DEFAULT 1,
	"is_published" boolean DEFAULT false NOT NULL,
	"test_1" varchar DEFAULT 'первая тестовая миграция' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
