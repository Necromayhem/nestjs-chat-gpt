import { Module } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './updates/bot.update';
import { IngestionModule } from 'src/domains/ingestion/ingestion.module';
import { AuthController } from './auth.controller';
import { TelegramChatsService } from './telegram-chats.service';
import { TelegramChatsController } from './telegram-chats.controller';

@Module({
  imports: [
    ConfigModule,
    IngestionModule,
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          token: configService.getOrThrow('TELEGRAM_BOT_TOKEN'),
          launchOptions: {
            allowedUpdates: [
              'message',
              'edited_message',
              'my_chat_member',
              'chat_member',
            ],
          },
        };
      },
    }),
  ],
  providers: [TelegramAuthService, BotUpdate, TelegramChatsService],
  controllers: [AuthController, TelegramChatsController],
})
export class TelegramModule {}
