import { Start, Update, On, Ctx, Command } from 'nestjs-telegraf';
import { IngestionService } from 'src/domains/ingestion/ingestion.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('bot update');
@Update()
export class BotUpdate {
  constructor(private readonly ingestionService: IngestionService) {}

  @Command('app')
  async openApp(@Ctx() ctx) {
    const url = process.env.TG_MINIAPP_URL; // сюда вставим ngrok URL
    await ctx.reply('Открыть интерфейс:', {
      reply_markup: {
        inline_keyboard: [[{ text: '📊 Открыть Summary', web_app: { url } }]],
      },
    });
  }

  @Start()
  firstStart(@Ctx() ctx) {
    ctx.reply('Привет! Чтобы увидеть все команды напишите "меню"');
  }

  @On('new_chat_members')
  async onNewMembers(@Ctx() ctx) {
    const members = ctx.message?.new_chat_members ?? [];
    const myBotId = ctx.botInfo?.id;
    const addedMe = myBotId
      ? members.some((m) => m.id === myBotId)
      : members.some((m) => m.is_bot);

    if (addedMe) {
      const chatId = ctx.chat.id;
      logger.log('Бота добавили в группу:', chatId);

      await ctx.reply('Привет, я в группе 👋');
    }
  }

  @On('message')
  async onAnyMessage(@Ctx() ctx) {
    const msg = ctx.message;
    if (!msg) return;
    logger.log(msg);

    await this.ingestionService.ingestTelegramMessage({
      chatId: String(msg.chat.id),
      userId: msg.from?.id ? String(msg.from.id) : null,
      text: msg.text,
      messageId: String(msg.message_id),
      ts: msg.date ? msg.date * 1000 : Date.now(),
    });
  }

  @On('text')
  async showMenu(@Ctx() ctx) {
    const text = ctx.message?.text?.trim().toLowerCase();
    if (text === 'меню') {
      ctx.reply('Выбери пункт:', {
        reply_markup: {
          keyboard: [
            [{ text: 'Пункт 1' }],
            [{ text: 'Пункт 2' }],
            [{ text: 'Получить кота' }],
          ],
          resize_keyboard: true,
        },
      });
    } else if (text === 'пункт 1') {
      ctx.reply('Вы выбрали пункт 1');
    } else if (text === 'пункт 2') {
      ctx.reply('Вы выбрали пункт 2');
    } else if (text === 'получить кота' || text === 'кот') {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      ctx.reply(data[0]?.url);
    }
  }
}
