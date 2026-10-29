import type { Types } from 'mongoose';
import { Connection } from '../models/connection.js';
import type { ConnectionLean, CreateConnectionInput } from '../types/connection.js';

/** Order-independent key for a user pair, so [A,B] and [B,A] collapse to one value. */
export const pairKeyFor = (
  a: Types.ObjectId | string,
  b: Types.ObjectId | string
): string => [a.toString(), b.toString()].sort().join('_');

export const create = async (params: CreateConnectionInput): Promise<ConnectionLean> => {
  const doc = await Connection.create({
    users: params.users,
    pairKey: pairKeyFor(params.users[0], params.users[1]),
    chat: params.chatId,
    originAnonSession: params.originAnonSession,
    originNames: params.originNames,
    originVibeTags: params.originVibeTags,
  });
  return doc.toObject() as unknown as ConnectionLean;
};

export const findByUsers = async (
  userId1: string,
  userId2: string
): Promise<ConnectionLean | null> =>
  Connection.findOne({ pairKey: pairKeyFor(userId1, userId2) }).lean<ConnectionLean>();

/**
 * Every account this user already keeps — so anonymous matching can skip them.
 * One indexed query per queue join (signed-in users only); the caller holds
 * the set for the scan window instead of looking up per candidate.
 */
export const listPartnerUserIds = async (userId: string): Promise<Set<string>> => {
  const rows = await Connection.find({ users: userId }, { users: 1 }).lean<
    Array<{ users: Types.ObjectId[] }>
  >();
  const partners = new Set<string>();
  for (const row of rows) {
    for (const member of row.users) {
      const id = member.toString();
      if (id !== userId) partners.add(id);
    }
  }
  return partners;
};

/** Re-point a connection at a (re)created chat when its original was deleted. */
export const updateChat = async (
  id: Types.ObjectId | string,
  chatId: Types.ObjectId | string
): Promise<void> => {
  await Connection.updateOne({ _id: id }, { $set: { chat: chatId } });
};

/**
 * Which of these chats began as an anonymous match — one indexed query for
 * the whole inbox page, so the list can mark whisper-origin rows.
 */
export const findChatsWithConnections = async (chatIds: string[]): Promise<Set<string>> => {
  if (chatIds.length === 0) return new Set();
  const rows = await Connection.find({ chat: { $in: chatIds } }, { chat: 1 }).lean<
    Array<{ chat: Types.ObjectId }>
  >();
  return new Set(rows.map((r) => r.chat.toString()));
};

/**
 * Find the Whisper connection behind a DM, with both members populated.
 * Purely a query — the caller decides what the "self vs partner" perspective is.
 */
export const findByChatIdPopulated = async (chatId: string, userId: string) =>
  Connection.findOne({ chat: chatId, users: userId })
    .populate('users', 'name username avatar')
    .lean();
