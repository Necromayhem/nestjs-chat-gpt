import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),

  title: varchar('title', { length: 20 }).notNull(),
  content: varchar('content', { length: 1000 }).notNull(),
  ownerId: integer('ownerId').default(1),
  isPublished: boolean('is_published').notNull().default(false),
  test1: varchar('test_1').notNull().default('первая тестовая миграция'),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
