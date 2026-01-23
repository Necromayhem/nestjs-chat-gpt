import { Controller, Get, Query } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DB } from 'src/database/database.module';
import { telegramChats } from 'src/database/schema';
import { desc, eq } from 'drizzle-orm';

@Controller('telegram-chats')
export class TelegramChatsController {
  constructor(@Inject(DB) private readonly db: any) {}

  @Get()
  async list(@Query('active') active?: string) {
    const onlyActive = active === 'true';
    const q = this.db.select().from(telegramChats);

    const rows = onlyActive
      ? await q
          .where(eq(telegramChats.isActive, true))
          .orderBy(desc(telegramChats.lastSeenAt))
      : await q.orderBy(desc(telegramChats.lastSeenAt));

    return rows;
  }
}
