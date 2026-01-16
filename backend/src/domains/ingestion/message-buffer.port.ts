export interface BufferMessage {
  chatId: string;
  userId: string | null;
  messageId: string;
  text: string;
  ts: number;
}

// сообщение из буфера + внутренний id строки в БД
export interface BufferedMessage extends BufferMessage {
  bufferId: number;
}

export interface MessageBufferPort {
  append(chatId: string, msg: BufferMessage): Promise<void>;

  // вернуть сообщения по порядку
  getBatch(chatId: string, limit?: number): Promise<BufferedMessage[]>;

  // удалить все (может пригодиться админке/тестам)
  clear(chatId: string): Promise<void>;

  // удалить только то, что обработали
  clearUpTo(chatId: string, maxBufferId: number): Promise<void>;

  // сколько сейчас в буфере
  count(chatId: string): Promise<number>;
}
