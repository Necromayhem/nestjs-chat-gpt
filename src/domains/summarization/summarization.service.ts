import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DB } from 'src/database/database.module';

import type { MessageBufferPort } from 'src/domains/ingestion/message-buffer.port';
import { MESSAGE_BUFFER } from 'src/domains/ingestion/message-buffer.token';

import type { LlmPort } from './llm.port';
import { LLM } from './summarization.token';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);
  private readonly limit = Number(process.env.SUMMARIZATION_LIMIT ?? 10);

  constructor(
    @Inject(DB) private readonly db: NodePgDatabase,
    @Inject(MESSAGE_BUFFER) private readonly buffer: MessageBufferPort,
    @Inject(LLM) private readonly llm: LlmPort,
  ) {}

  /**
   * Called by ingestion after each message append.
   * Creates a job only when buffer size >= limit AND no active job exists.
   */
  async maybeEnqueue(chatId: string): Promise<void> {
    const startedAt = Date.now();
    this.logger.log(`maybeEnqueue:start chatId=${chatId}`);

    try {
      const cnt = await this.buffer.count(chatId);
      this.logger.log(`maybeEnqueue:count chatId=${chatId} cnt=${cnt}`);

      if (cnt < this.limit) {
        this.logger.log(
          `maybeEnqueue:skip chatId=${chatId} reason=cnt<limit limit=${this.limit}`,
        );
        return;
      }

      // Prevent duplicate jobs for same chat
      const active = await this.db.execute(sql<{ id: number }>`
        SELECT id
        FROM summarization_jobs
        WHERE chat_id = ${chatId}
          AND status IN ('pending', 'running')
        LIMIT 1;
      `);

      if (active.rows.length > 0) {
        this.logger.log(
          `maybeEnqueue:skip chatId=${chatId} reason=active_job jobId=${active.rows[0].id}`,
        );
        return;
      }

      await this.db.execute(sql`
        INSERT INTO summarization_jobs (chat_id, status, attempts, last_error, created_at, locked_at)
        VALUES (${chatId}, 'pending', 0, NULL, NOW(), NULL);
      `);

      this.logger.log(
        `maybeEnqueue:enqueued chatId=${chatId} ms=${Date.now() - startedAt}`,
      );
    } catch (e: any) {
      this.logger.error(
        `maybeEnqueue:error chatId=${chatId} msg=${String(e?.message ?? e)}`,
        e?.stack,
      );
      // ingestion пусть решает, глотать или падать; я бы не валил ingestion из-за enqueue
    }
  }

  /**
   * Called by worker after it atomically marks job as running.
   */
  async runJob(jobId: number): Promise<void> {
    const startedAt = Date.now();
    this.logger.log(`runJob:start jobId=${jobId}`);

    // 1) load job
    const jobRes = await this.db.execute(sql<{
      id: number;
      chat_id: string;
      status: string;
      attempts: number;
      locked_at: string | null;
    }>`
      SELECT id, chat_id, status, attempts, locked_at
      FROM summarization_jobs
      WHERE id = ${jobId}
      LIMIT 1;
    `);

    const job = jobRes.rows?.[0];
    if (!job) {
      this.logger.warn(`runJob:job not found jobId=${jobId}`);
      return;
    }

    const chatId = String(job.chat_id);

    try {
      // 2) read batch from buffer
      const batch = await this.buffer.getBatch(chatId, this.limit);
      this.logger.log(
        `runJob:batch chatId=${chatId} size=${batch.length} limit=${this.limit}`,
      );

      if (batch.length === 0) {
        // nothing to do; mark done to avoid infinite running
        await this.db.execute(sql`
          UPDATE summarization_jobs
          SET status = 'done',
              locked_at = NULL,
              last_error = NULL
          WHERE id = ${jobId};
        `);
        this.logger.warn(`runJob:empty batch -> done jobId=${jobId}`);
        return;
      }

      const fromTs = Math.min(...batch.map((m) => m.ts));
      const toTs = Math.max(...batch.map((m) => m.ts));
      const maxBufferId = Math.max(...batch.map((m) => m.bufferId));

      this.logger.log(
        `runJob:llm:start jobId=${jobId} chatId=${chatId} fromTs=${fromTs} toTs=${toTs} maxBufferId=${maxBufferId}`,
      );

      // 3) call LLM
      const summary = await this.llm.summarize(chatId, batch);

      this.logger.log(
        `runJob:llm:done jobId=${jobId} chatId=${chatId} summaryLen=${summary.length}`,
      );

      // 4) write summary
      await this.db.execute(sql`
        INSERT INTO conversation_summaries (chat_id, from_ts_ms, to_ts_ms, summary, created_at)
        VALUES (${chatId}, ${fromTs}, ${toTs}, ${summary}, NOW());
      `);

      // 5) clear processed messages
      await this.buffer.clearUpTo(chatId, maxBufferId);

      // 6) mark done
      await this.db.execute(sql`
        UPDATE summarization_jobs
        SET status = 'done',
            locked_at = NULL,
            last_error = NULL
        WHERE id = ${jobId};
      `);

      this.logger.log(
        `runJob:done jobId=${jobId} chatId=${chatId} ms=${Date.now() - startedAt}`,
      );
    } catch (e: any) {
      const msg = String(e?.message ?? e);

      this.logger.error(
        `runJob:failed jobId=${jobId} chatId=${chatId} ms=${Date.now() - startedAt} err=${msg}`,
        e?.stack,
      );

      // IMPORTANT: unlock + fail, so it doesn't get stuck at running
      await this.db.execute(sql`
        UPDATE summarization_jobs
        SET status = 'failed',
            locked_at = NULL,
            last_error = ${msg}
        WHERE id = ${jobId};
      `);

      // пробрасываем, чтобы воркер тоже видел ошибку в логах
      throw e;
    }
  }
}
