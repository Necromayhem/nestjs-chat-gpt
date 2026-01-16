import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TelegramAuthService {
  verifyAndIssueToken(initData: string) {
    if (!initData) throw new UnauthorizedException('Missing initData');

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) throw new UnauthorizedException('Missing hash');

    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');

    // ✅ Mini Apps secret key:
    // secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram initData signature');
    }

    const userRaw = urlParams.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    return { ok: true, telegramUser: user };
  }
}

