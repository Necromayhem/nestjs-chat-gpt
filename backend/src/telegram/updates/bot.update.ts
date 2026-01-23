import { Start, Update, On, Ctx, Command } from 'nestjs-telegraf';
import { IngestionService } from 'src/domains/ingestion/ingestion.service';
import { Logger } from '@nestjs/common';
import { TelegramChatsService } from '../telegram-chats.service';

const logger = new Logger('bot update');

@Update()
export class BotUpdate {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly telegramChats: TelegramChatsService,
  ) {}

  @Command('app')
  async openApp(@Ctx() ctx) {
    const baseUrl = process.env.TG_MINIAPP_URL;
    if (!baseUrl) return ctx.reply('TG_MINIAPP_URL не задан в .env');

    const chatId = ctx.chat?.id;
    if (!chatId) return ctx.reply('Не удалось определить chatId');

    const cleanBase = String(baseUrl).replace(/\/+$/, '');
    const url = `${cleanBase}?chatId=${encodeURIComponent(String(chatId))}`;

    await ctx.reply('Открыть интерфейс:', {
      reply_markup: {
        inline_keyboard: [[{ text: '📊 Открыть Summary', web_app: { url } }]],
      },
    });
  }

  @Start()
  async firstStart(@Ctx() ctx) {
    await ctx.reply('Привет! Чтобы увидеть все команды напишите "меню"');
  }

  /**
   * ✅ ГЛАВНЫЙ хук: Telegram сообщает, что статус *БОТА* в чате изменился.
   * member/administrator -> бота добавили / вернули
   * left/kicked -> бота удалили / заблокировали
   */
  @On('my_chat_member')
  async onMyChatMember(@Ctx() ctx) {
    const upd = (ctx.update as any)?.my_chat_member;
    if (!upd) return;

    const chat = upd.chat;
    const chatId = String(chat.id);

    const newStatus: string | undefined = upd?.new_chat_member?.status;
    const oldStatus: string | undefined = upd?.old_chat_member?.status;

    logger.log(`my_chat_member: chat=${chatId} ${oldStatus} -> ${newStatus}`);

    // Бота удалили / заблокировали
    if (newStatus === 'left' || newStatus === 'kicked') {
      await this.telegramChats.markInactive(chatId);
      logger.log(`chat deactivated: ${chatId} status=${newStatus}`);
      return;
    }

    // Бота добавили / назначили админом / восстановили
    if (newStatus === 'member' || newStatus === 'administrator') {
      await this.telegramChats.upsertChat({
        chatId,
        type: chat.type ?? 'unknown',
        title: chat.title ?? null,
      });
      logger.log(`chat registered/activated: ${chatId} status=${newStatus}`);
      return;
    }
  }

  /**
   * Fallback: иногда добавление приходит как new_chat_members
   * (можно оставить как запасной вариант)
   */
  @On('new_chat_members')
  async onNewMembers(@Ctx() ctx) {
    const members = (ctx.message as any)?.new_chat_members ?? [];
    const myBotId = ctx.botInfo?.id;

    const addedMe = myBotId
      ? members.some((m) => m.id === myBotId)
      : members.some((m) => m.is_bot);

    if (!addedMe) return;

    const chat = ctx.chat;
    await this.telegramChats.upsertChat({
      chatId: String(chat.id),
      type: (chat as any)?.type ?? 'unknown',
      title: (chat as any)?.title ?? null,
    });

    logger.log('Бота добавили в группу: ' + chat.id);
    await ctx.reply('Привет, я в группе 👋');
  }

  @On('message')
  async onAnyMessage(@Ctx() ctx) {
    const msg = ctx.message as any;
    if (!msg) return;

    const chatId = String(msg.chat.id);

    // поддерживаем lastSeenAt
    await this.telegramChats.touch(chatId);

    const text: string | undefined =
      typeof msg.text === 'string' ? msg.text : undefined;
    if (!text || text.trim().length === 0) return;

    await this.ingestionService.ingestTelegramMessage({
      chatId,
      userId: msg.from?.id ? String(msg.from.id) : null,
      text,
      messageId: String(msg.message_id),
      ts: msg.date ? msg.date * 1000 : Date.now(),
    });
  }

  /**
   * ⚠️ left_chat_member НЕ гарантирован при кике бота админом,
   * поэтому не полагаемся на него.
   * Оставить можно, но он не должен быть единственным способом.
   */
  @On('left_chat_member')
  async onLeftMember(@Ctx() ctx) {
    const msg = ctx.message as any;
    const left = msg?.left_chat_member;
    const myBotId = ctx.botInfo?.id;

    if (!left || !myBotId) return;

    if (left.id === myBotId) {
      await this.telegramChats.markInactive(String(msg.chat.id));
      logger.log(`chat deactivated via left_chat_member: ${msg.chat.id}`);
    }
  }
}
