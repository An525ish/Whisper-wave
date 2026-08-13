import { Types } from 'mongoose';
import { ChatRead } from '../models/chatRead.js';
import type { ChatReadRecord, UpsertChatReadInput } from '../types/chat.js';

export const upsert = async (
  input: UpsertChatReadInput
): Promise<ChatReadRecord> => {
  const doc = await ChatRead.findOneAndUpdate(
    { chat: input.chat, user: input.user },
    {
      $set: {
        lastReadAt: input.lastReadAt,
        ...(input.lastReadMessageId
          ? { lastReadMessageId: input.lastReadMessageId }
          : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<ChatReadRecord>();

  return doc!;
};

export const findByUserAndChats = async (
  userId: string,
  chatIds: Array<string | Types.ObjectId>
): Promise<ChatReadRecord[]> =>
  ChatRead.find({
    user: userId,
    chat: { $in: chatIds },
  }).lean<ChatReadRecord[]>();

export const upsertMany = async (
  inputs: UpsertChatReadInput[]
): Promise<void> => {
  if (inputs.length === 0) return;

  await ChatRead.bulkWrite(
    inputs.map((input) => {
      const chatOid =
        typeof input.chat === 'string'
          ? new Types.ObjectId(input.chat)
          : input.chat;
      const userOid =
        typeof input.user === 'string'
          ? new Types.ObjectId(input.user)
          : input.user;
      const lastReadMessageId = input.lastReadMessageId
        ? typeof input.lastReadMessageId === 'string'
          ? new Types.ObjectId(input.lastReadMessageId)
          : input.lastReadMessageId
        : undefined;

      return {
        updateOne: {
          filter: { chat: chatOid, user: userOid },
          update: {
            $set: {
              lastReadAt: input.lastReadAt,
              ...(lastReadMessageId ? { lastReadMessageId } : {}),
            },
          },
          upsert: true,
          setDefaultsOnInsert: true,
        },
      };
    })
  );
};

export const initForMembers = async (
  chatId: string | Types.ObjectId,
  memberIds: Array<string | Types.ObjectId>,
  lastReadAt: Date = new Date()
): Promise<void> => {
  if (memberIds.length === 0) return;

  const chatOid =
    typeof chatId === 'string' ? new Types.ObjectId(chatId) : chatId;

  await ChatRead.bulkWrite(
    memberIds.map((userId) => {
      const userOid =
        typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
      return {
        updateOne: {
          filter: { chat: chatOid, user: userOid },
          update: {
            $setOnInsert: {
              chat: chatOid,
              user: userOid,
              lastReadAt,
            },
          },
          upsert: true,
        },
      };
    })
  );
};

export const deleteByChatId = async (chatId: string): Promise<void> => {
  await ChatRead.deleteMany({ chat: chatId });
};

export const findPeerRead = async (
  chatId: string,
  peerUserId: string
): Promise<ChatReadRecord | null> =>
  ChatRead.findOne({ chat: chatId, user: peerUserId }).lean<ChatReadRecord>();
