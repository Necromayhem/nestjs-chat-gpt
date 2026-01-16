import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial().primaryKey().notNull(),
  title: varchar({ length: 20 }).notNull(),
  content: varchar({ length: 1000 }).notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  ownerId: integer().default(2),
});
