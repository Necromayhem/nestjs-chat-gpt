import {
  pgTable,
  bigserial,
  text,
  bigint,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const bufferedMessages = pgTable(
  'buffered_messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),

    chatId: text('chat_id').notNull(),
    userId: text('user_id'), // может быть null

    messageId: text('message_id').notNull(),
    text: text('text').notNull(),

    tsMs: bigint('ts_ms', { mode: 'number' }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // не даём записать один и тот же message дважды в рамках чата
    uniqChatMsg: uniqueIndex('buffered_messages_uniq_chat_msg').on(
      t.chatId,
      t.messageId,
    ),

    // ускоряет getBatch: фильтр по чату + сортировка
    chatTsIdx: index('buffered_messages_chat_ts_idx').on(
      t.chatId,
      t.tsMs,
      t.id,
    ),
  }),
);
