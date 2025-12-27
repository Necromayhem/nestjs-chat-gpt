import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './telegram/telegram.module';
import { BlogModule } from './blog/blog.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './blog/entities/post.entity';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TelegramModule,
    BlogModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '0000',
      database: 'blog',
      entities: [Post],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {}

  onModuleInit() {
    console.log('DB connected: ', this.dataSource.isInitialized);
  }
}
