import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import * as userRepo from '../repositories/user.js';

export type { UploadableFile } from '../types/message.js';

export const getClientBaseUrl = (): string =>
  env.CLIENT_URL || 'http://localhost:5173';

/** Socket.IO room name for a connected chat. */
export const chatRoom = (chatId: string): string => `chat:${chatId}`;

export const getBase64 = (file: {
  mimetype: string;
  buffer: Buffer;
}): string => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

/** Base64url encoding — required by Gmail API `messages.send` raw payload. */
export const toBase64Url = (raw: string): string =>
  Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const deriveUsername = async (displayName: string): Promise<string> => {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20) || 'user';

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? base : `${base}_${randomInt(1000, 9999)}`;
    const taken = await userRepo.findByUsername(candidate);
    if (!taken) return candidate;
  }

  return `${base}_${Date.now().toString(36)}`;
};
