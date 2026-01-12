import type { BufferedMessage } from '../ingestion/message-buffer.port';

export interface LlmPort {
  summarize(chatId: string, messages: BufferedMessage[]): Promise<string>;
}
