import { Injectable, Inject, Logger } from '@nestjs/common';
import { MESSAGE_BUFFER } from './message-buffer.token';
import type { BufferMessage, MessageBufferPort } from './message-buffer.port';
import { SummarizationService } from '../summarization/summarization.service';

const logger = new Logger('injection service');

@Injectable()
export class IngestionService {
  constructor(
    @Inject(MESSAGE_BUFFER) private readonly buffer: MessageBufferPort,
    private readonly summarization: SummarizationService,
  ) {}

  async ingestTelegramMessage(msg: BufferMessage) {
    await this.buffer.append(msg.chatId, msg);

    // Триггер суммаризации при превышении лимита.
    // Ошибки суммаризации не должны ломать ingestion.
    await this.summarization
      .maybeEnqueue(msg.chatId)
      .catch((e) => logger.error(e));

    logger.log(msg);
  }
}

