import {
  pgTable,
  bigserial,
  text,
  bigint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const conversationSummaries = pgTable(
  'conversation_summaries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    chatId: text('chat_id').notNull(),

    // границы суммаризируемого куска (по времени сообщений)
    fromTsMs: bigint('from_ts_ms', { mode: 'number' }).notNull(),
    toTsMs: bigint('to_ts_ms', { mode: 'number' }).notNull(),

    summary: text('summary').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    chatCreatedIdx: index('conversation_summaries_chat_created_idx').on(
      t.chatId,
      t.createdAt,
    ),
  }),
);
