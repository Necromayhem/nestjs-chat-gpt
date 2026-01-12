import { Injectable, Inject } from '@nestjs/common';
import { eq, asc, and, lte, sql } from 'drizzle-orm';
import { DB } from 'src/database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type {
  MessageBufferPort,
  BufferMessage,
  BufferedMessage,
} from '../../../domains/ingestion/message-buffer.port';

import { bufferedMessages } from '../schema/buffered-messages';

@Injectable()
export class PostgresMessageBuffer implements MessageBufferPort {
  constructor(@Inject(DB) private readonly db: NodePgDatabase) {}

  async append(chatId: string, msg: BufferMessage): Promise<void> {
    await this.db
      .insert(bufferedMessages)
      .values({
        chatId,
        userId: msg.userId,
        messageId: msg.messageId,
        text: msg.text,
        tsMs: msg.ts,
      })
      .onConflictDoNothing({
        target: [bufferedMessages.chatId, bufferedMessages.messageId],
      });
  }

  async getBatch(chatId: string, limit = 200): Promise<BufferedMessage[]> {
    const rows = await this.db
      .select({
        bufferId: bufferedMessages.id,
        chatId: bufferedMessages.chatId,
        userId: bufferedMessages.userId,
        messageId: bufferedMessages.messageId,
        text: bufferedMessages.text,
        ts: bufferedMessages.tsMs,
      })
      .from(bufferedMessages)
      .where(eq(bufferedMessages.chatId, chatId))
      .orderBy(asc(bufferedMessages.tsMs), asc(bufferedMessages.id))
      .limit(limit);

    return rows;
  }

  async clear(chatId: string): Promise<void> {
    await this.db
      .delete(bufferedMessages)
      .where(eq(bufferedMessages.chatId, chatId));
  }

  async clearUpTo(chatId: string, maxBufferId: number): Promise<void> {
    await this.db
      .delete(bufferedMessages)
      .where(
        and(
          eq(bufferedMessages.chatId, chatId),
          lte(bufferedMessages.id, maxBufferId),
        ),
      );
  }

  async count(chatId: string): Promise<number> {
    const rows = await this.db
      .select({ c: sql<number>`count(*)` })
      .from(bufferedMessages)
      .where(eq(bufferedMessages.chatId, chatId));

    return Number(rows[0]?.c ?? 0);
  }
}
