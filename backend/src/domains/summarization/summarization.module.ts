import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';

import { SummarizationService } from './summarization.service';
import { SummarizationWorker } from './summarization.worker';

import { MESSAGE_BUFFER } from '../ingestion/message-buffer.token';
import { PostgresMessageBuffer } from 'src/infrastructure/database/postgres/postgres-message-buffer';

import { LLM } from '../summarization/summarization.token';
// временная заглушка — заменишь на реальный openai-gateway
import { OpenAiLlm } from '../../infrastructure/llm/openai-llm';
import { SummarizationController } from './summarization.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SummarizationController],
  providers: [
    SummarizationService,
    SummarizationWorker,

    // буфер
    { provide: MESSAGE_BUFFER, useClass: PostgresMessageBuffer },

    // llm
    { provide: LLM, useClass: OpenAiLlm },
  ],
  exports: [SummarizationService],
})
export class SummarizationModule {}
