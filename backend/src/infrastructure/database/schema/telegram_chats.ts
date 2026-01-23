import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const telegramChats = pgTable('telegram_chats', {
  chatId: text('chat_id').primaryKey(),
  type: text('type').notNull(), // group/supergroup/private/channel
  title: text('title'),
  isActive: boolean('is_active').notNull().default(true),

  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
