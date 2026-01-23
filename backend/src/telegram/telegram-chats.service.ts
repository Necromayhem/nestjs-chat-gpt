import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from 'src/database/database.module';
import { telegramChats } from 'src/database/schema';

@Injectable()
export class TelegramChatsService {
  constructor(@Inject(DB) private readonly db: any) {}

  async upsertChat(params: {
    chatId: string;
    type: string;
    title?: string | null;
  }) {
    const now = new Date();

    await this.db
      .insert(telegramChats)
      .values({
        chatId: params.chatId,
        type: params.type,
        title: params.title ?? null,
        isActive: true,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: telegramChats.chatId,
        set: {
          type: params.type,
          title: params.title ?? null,
          isActive: true,
          lastSeenAt: now,
        },
      });
  }

  async touch(chatId: string) {
    await this.db
      .update(telegramChats)
      .set({ lastSeenAt: new Date() })
      .where(eq(telegramChats.chatId, chatId));
  }

  /**
   * ВАЖНО: делаем upsert, чтобы:
   * - если записи о чате ещё нет -> она создастся (type обязателен)
   * - если запись есть -> isActive точно станет false
   */
  async markInactive(chatId: string) {
    const now = new Date();

    await this.db
      .insert(telegramChats)
      .values({
        chatId,
        type: 'unknown', // type NOT NULL — без этого insert упадёт
        title: null,
        isActive: false,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: telegramChats.chatId,
        set: {
          isActive: false,
          lastSeenAt: now,
        },
      });
  }
}
