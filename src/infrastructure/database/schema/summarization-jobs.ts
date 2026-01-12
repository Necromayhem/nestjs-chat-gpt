import {
  pgTable,
  bigserial,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const summarizationJobs = pgTable(
  'summarization_jobs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),

    chatId: text('chat_id').notNull(),

    status: text('status').notNull(), // pending | running | done | failed
    attempts: integer('attempts').default(0).notNull(),

    lastError: text('last_error'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
  },
  (t) => ({
    statusCreatedIdx: index('summarization_jobs_status_created_idx').on(
      t.status,
      t.createdAt,
    ),
    chatIdx: index('summarization_jobs_chat_idx').on(t.chatId),
  }),
);
