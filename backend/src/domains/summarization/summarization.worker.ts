import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { DB } from 'src/database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

import { SummarizationService } from './summarization.service';

@Injectable()
export class SummarizationWorker implements OnModuleInit {
  private readonly logger = new Logger(SummarizationWorker.name);
  private timer: NodeJS.Timeout | null = null;

  // как часто опрашиваем таблицу джобов
  private readonly pollMs = Number(process.env.SUMMARIZATION_POLL_MS ?? 1000);

  constructor(
    @Inject(DB) private readonly db: NodePgDatabase,
    private readonly summarization: SummarizationService,
  ) {}

  onModuleInit() {
    this.logger.log(`started pollMs=${this.pollMs}`);
    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollMs);
  }

  private async tick() {
    try {
      // Забираем 1 job, который pending и не залочен
      const res = await this.db.execute(sql<{
        id: number;
      }>`
        UPDATE summarization_jobs
        SET status = 'running',
            locked_at = NOW(),
            attempts = attempts + 1
        WHERE id = (
          SELECT id
          FROM summarization_jobs
          WHERE status = 'pending'
            AND locked_at IS NULL
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id;
      `);

      const jobId = res.rows?.[0]?.id;
      if (!jobId) return;

      this.logger.log(`picked jobId=${jobId}`);

      await this.summarization.runJob(jobId);

      this.logger.log(`job done jobId=${jobId}`);
    } catch (e: any) {
      const cause = e?.cause;
      this.logger.error(`tick error: ${e?.message ?? e}`);

      if (cause) {
        this.logger.error(
          `pg cause: ${cause?.message ?? cause} (code=${cause?.code ?? 'n/a'})`,
        );
      }

      this.logger.error(e?.stack ?? String(e));
    }
  }
}
