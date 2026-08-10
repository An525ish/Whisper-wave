import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/user.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { Request } from '../models/request.js';

export const connectDb = async (): Promise<void> => {
  await mongoose.connect(env.DB_URI, { dbName: 'WhisperWave' });
  logger.info('Database connected');
  await ensureIndexes();
};

const ensureIndexes = async (): Promise<void> => {
  await Promise.all([
    User.collection.createIndex({ username: 1 }, { unique: true }),
    User.collection.createIndex({ name: 'text' }),
    Chat.collection.createIndex({ members: 1, updatedAt: -1 }),
    Message.collection.createIndex({ chat: 1, createdAt: -1 }),
    Request.collection.createIndex(
      { sender: 1, receiver: 1 },
      { unique: true }
    ),
  ]);
  logger.info('Database indexes ensured');
};
