import { Body, Controller, Get, Post } from '@nestjs/common';
import { TelegramAuthService } from '../telegram/telegram-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly telegramAuth: TelegramAuthService) {}

  @Get('ping')
  ping() {
    return { ok: true, ts: Date.now() };
  }

  @Post('telegram')
  async telegram(@Body() body: { initData: string }) {
    return this.telegramAuth.verifyAndIssueToken(body.initData);
  }
}

