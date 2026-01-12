import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TelegramModule } from './telegram/telegram.module';
import { BlogModule } from './blog/blog.module';
import { DatabaseModule } from './database/database.module';
import { SummarizationModule } from './domains/summarization/summarization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TelegramModule,
    BlogModule,
    SummarizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
