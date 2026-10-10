import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/user.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { Request } from '../models/request.js';
import { PendingSignup } from '../models/pendingSignup.js';
import { Room } from '../models/room.js';
import { RoomBan } from '../models/roomBan.js';
import { MemeSave } from '../models/memeSave.js';

export const connectDb = async (): Promise<void> => {
  await mongoose.connect(env.DB_URI, { dbName: 'WhisperWave' });
  logger.info('Database connected');
  await ensureIndexes();
};

const ensureIndexes = async (): Promise<void> => {
  await Promise.all([
    User.collection.createIndex({ username: 1 }, { unique: true }),
    User.collection.createIndex({ email: 1 }, { unique: true, sparse: true }),
    User.collection.createIndex({ name: 'text' }),
    PendingSignup.collection.createIndex({ email: 1 }, { unique: true }),
    PendingSignup.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    ),
    Chat.collection.createIndex({ members: 1, updatedAt: -1 }),
    Message.collection.createIndex({ chat: 1, createdAt: -1 }),
    Request.collection.createIndex(
      { sender: 1, receiver: 1 },
      { unique: true }
    ),
    // Rooms (Phase 3): slug uniqueness is the duplicate-name guard, the TTL
    // enforces ban expiry, and the lookups back every room join.
    Room.collection.createIndex({ slug: 1 }, { unique: true }),
    Room.collection.createIndex({ visibility: 1 }),
    RoomBan.collection.createIndex({ until: 1 }, { expireAfterSeconds: 0 }),
    RoomBan.collection.createIndex({ roomSlug: 1, gid: 1 }),
    RoomBan.collection.createIndex({ roomSlug: 1, userId: 1 }),
    // Memes (Phase 2): one row per member save, newest-first reads.
    MemeSave.collection.createIndex({ user: 1, source: 1, externalId: 1 }, { unique: true }),
    MemeSave.collection.createIndex({ user: 1, createdAt: -1 }),
  ]);
  logger.info('Database indexes ensured');
};
