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

/** Re-point a connection at a (re)created chat when its original was deleted. */
export const updateChat = async (
  id: Types.ObjectId | string,
  chatId: Types.ObjectId | string
): Promise<void> => {
  await Connection.updateOne({ _id: id }, { $set: { chat: chatId } });
};

/**
 * Find the Whisper connection behind a DM, with both members populated.
 * Purely a query — the caller decides what the "self vs partner" perspective is.
 */
export const findByChatIdPopulated = async (chatId: string, userId: string) =>
  Connection.findOne({ chat: chatId, users: userId })
    .populate('users', 'name username avatar')
    .lean();
