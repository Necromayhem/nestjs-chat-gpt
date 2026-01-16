import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../database/database.module';
import { posts } from '../database/schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class BlogService {
  constructor(@Inject(DB) private readonly db: any) {}

  findAll() {
    return this.db.select().from(posts);
  }

  async findOne(id: number) {
    const rows = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(posts).where(eq(posts.id, id));
  }

  async create(dto: CreatePostDto) {
    const rows = await this.db
      .insert(posts)
      .values({
        title: dto.title,
        content: dto.content,
      })
      .returning();

    return rows[0];
  }
}
