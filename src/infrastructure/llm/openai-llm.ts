import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

import type { LlmPort } from 'src/domains/summarization/llm.port';
import type { BufferedMessage } from 'src/domains/ingestion/message-buffer.port';

@Injectable()
export class OpenAiLlm implements LlmPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenAiLlm.name);

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY.');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30_000,
      maxRetries: 2,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  }

  async summarize(
    chatId: string,
    messages: BufferedMessage[],
  ): Promise<string> {
    const startedAt = Date.now();

    const lines = messages
      .map((m) => {
        const dt = new Date(m.ts).toISOString();
        const text = (m.text ?? '').replace(/\s+/g, ' ').trim();
        if (!text) return null;
        const user = m.userId ? `user=${m.userId}` : 'user=unknown';
        return `${dt} (${user}) — ${text}`;
      })
      .filter(Boolean)
      .join('\n');

    if (!lines.trim()) {
      this.logger.warn(`summarize: empty input chatId=${chatId}`);
      return 'Недостаточно данных для суммаризации.';
    }

    this.logger.log(
      `summarize:start chatId=${chatId} msgs=${messages.length} model=${this.model}`,
    );

    try {
      const instructions =
        'Сделай краткую суммаризацию диалога на русском языке. ' +
        'Формат: 5–10 буллетов и одна строка "Итог". ' +
        'Не выдумывай факты и не добавляй ничего от себя.';

      const response = await this.client.responses.create({
        model: this.model,
        instructions,
        input: `chatId=${chatId}\n\nСообщения:\n${lines}`,
        max_output_tokens: 400,
      });

      const out = (response.output_text ?? '').trim();
      this.logger.log(
        `summarize:done chatId=${chatId} ms=${Date.now() - startedAt} outLen=${out.length}`,
      );

      return out || 'Суммаризация не удалась.';
    } catch (e: any) {
      this.logger.error(
        `summarize:error chatId=${chatId} ms=${Date.now() - startedAt} msg=${String(
          e?.message ?? e,
        )}`,
        e?.stack,
      );
      throw e;
    }
  }
}
