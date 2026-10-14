import type { Types } from 'mongoose';
import * as connectionRepo from '../../repositories/connection.js';
import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import { logger } from '../../utils/logger.js';
import type { VibeTag } from '../../types/match.js';
import type { ConnectionLean } from '../../types/connection.js';

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

/**
 * Resolve the DM for a pair: reuse an existing 1-1 chat when these two accounts
 * already talk, otherwise create one. `Chat.name` is required by the schema (DM
 * titles are recomputed from members on read), so it is seeded with the vibe
 * names they met under. `created` tells the caller whether it owns cleanup.
 */
const resolveDirectChat = async (
  userIdA: Types.ObjectId,
  userIdB: Types.ObjectId,
  seedName: string
): Promise<{ chatId: Types.ObjectId; created: boolean }> => {
  const existing = await chatRepo.findDirectChatBetween(
    userIdA.toString(),
    userIdB.toString()
  );
  if (existing) return { chatId: existing._id, created: false };
  const chat = await chatRepo.create({
    name: seedName,
    creator: userIdA,
    members: [userIdA, userIdB],
  });
  return { chatId: chat._id, created: true };
};

/** Compensating delete for a Chat/ChatRead pair this attempt created but could not attach. */
const discardOrphanChat = async (chatId: Types.ObjectId): Promise<void> => {
  await Promise.all([
    chatRepo.deleteById(chatId.toString()),
    chatReadRepo.deleteByChatId(chatId.toString()),
  ]).catch((err: unknown) =>
    logger.error({ err, chatId }, 'Failed to clean up orphaned chat after connection failure')
  );
};

/**
 * Find-or-create the Connection for a pair, idempotently.
 * - An existing Connection is reused (its chat is re-created if it vanished).
 * - A duplicate-key race on `pairKey` resolves to the winner's Connection.
 * - Chat/ChatRead docs created for a Connection that never materialises are removed.
 */
export const ensureConnection = async (params: {
  userIdA: Types.ObjectId;
  userIdB: Types.ObjectId;
  sessionId: string;
  names: [string, string];
  tags: [VibeTag[], VibeTag[]];
}): Promise<ConnectionLean> => {
  const { userIdA, userIdB, sessionId, names, tags } = params;
  const memberIds = [userIdA.toString(), userIdB.toString()];
  const seedName = `${names[0]} & ${names[1]}`;

  const existing = await connectionRepo.findByUsers(memberIds[0], memberIds[1]);
  if (existing) {
    const chat = await chatRepo.findByIdLean(existing.chat.toString());
    if (chat) {
      await chatReadRepo.initForMembers(existing.chat, memberIds);
      return existing;
    }
    // The DM was deleted out from under the Connection — rebuild and re-point it.
    const rebuilt = await resolveDirectChat(userIdA, userIdB, seedName);
    await chatReadRepo.initForMembers(rebuilt.chatId, memberIds);
    await connectionRepo.updateChat(existing._id, rebuilt.chatId);
    return { ...existing, chat: rebuilt.chatId };
  }

  const { chatId, created } = await resolveDirectChat(userIdA, userIdB, seedName);
  try {
    // Both parties have seen everything so far, so seed their read state.
    await chatReadRepo.initForMembers(chatId, memberIds);
    return await connectionRepo.create({
      users: [userIdA, userIdB],
      chatId,
      originAnonSession: sessionId,
      originNames: names,
      originVibeTags: tags,
    });
  } catch (err) {
    if (created) await discardOrphanChat(chatId);
    if (isDuplicateKeyError(err)) {
      // Lost a race on pairKey — the winner's Connection is the answer.
      const winner = await connectionRepo.findByUsers(memberIds[0], memberIds[1]);
      if (winner) return winner;
    }
    throw err;
  }
};
