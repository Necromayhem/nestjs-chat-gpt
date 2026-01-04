import { Start, Update, On, Ctx } from 'nestjs-telegraf';

@Update()
export class BotUpdate {
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
      console.log('Бота добавили в группу:', chatId);

      await ctx.reply('Привет, я в группе 👋');
    }
  }

  @On('message')
  onAnyMessage(@Ctx() ctx) {
    console.log('message update:', ctx.update);
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
