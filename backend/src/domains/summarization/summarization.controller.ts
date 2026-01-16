import { Controller, Get, Query, Logger } from '@nestjs/common';
import { SummarizationService } from './summarization.service';

@Controller('summaries')
export class SummarizationController {
  private readonly logger = new Logger(SummarizationController.name);

  constructor(private readonly summarization: SummarizationService) {}

  @Get('latest')
  async latest(@Query('chatId') chatId?: string) {
    this.logger.log(`GET /summaries/latest chatId=${chatId}`);

    const safeChatId = String(chatId ?? '').trim();
    if (!safeChatId) return { chatId: '', summary: '' };

    const row = await this.summarization.getLatestSummary(safeChatId);
    return row ?? { chatId: safeChatId, summary: '' };
  }
}
