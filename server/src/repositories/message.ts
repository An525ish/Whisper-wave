import { Types } from 'mongoose';
import { Message } from '../models/message.js';
import { Chat } from '../models/chat.js';
import type {
  CreateMessageInput,
  FindReceiptsResult,
  MessageReceiptUser,
  MessageRecord,
  UpdateMessagePatch,
} from '../types/message.js';

export const findByChatPage = async (
  chatId: string,
  skip: number,
  limit: number,
  clearedAt?: Date,
) => {
  const filter: Record<string, unknown> = { chat: chatId, status: { $ne: 'failed' } };
  if (clearedAt) filter.createdAt = { $gt: clearedAt };
  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .populate('sender', 'name avatar')
    .populate('chat', 'groupChat');
};

export const countByChat = async (chatId: string, clearedAt?: Date): Promise<number> => {
  const filter: Record<string, unknown> = { chat: chatId, status: { $ne: 'failed' } };
  if (clearedAt) filter.createdAt = { $gt: clearedAt };
  return Message.countDocuments(filter);
};

export const create = async (
  input: CreateMessageInput
): Promise<MessageRecord> => {
  const message = await Message.create({
    content: input.content,
    attachments: input.attachments ?? [],
    sender: input.sender,
    chat: input.chat,
    status: input.status ?? 'sent',
    replyTo: input.replyTo,
  });

  return message.toObject() as MessageRecord;
};

export const updateById = async (
  id: string | Types.ObjectId,
  patch: UpdateMessagePatch
): Promise<MessageRecord | null> =>
  Message.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' }).lean<MessageRecord>();

export const findByIdLean = async (
  id: string
): Promise<MessageRecord | null> =>
  Message.findById(id).lean<MessageRecord>();

export const findByIdsInChat = async (
  chatId: string,
  ids: string[]
): Promise<MessageRecord[]> => {
  const objectIds = ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) return [];

  return Message.find({
    chat: chatId,
    _id: { $in: objectIds },
    isDeleted: { $ne: true },
    status: { $ne: 'failed' },
  })
    .sort({ createdAt: 1 })
    .lean<MessageRecord[]>();
};

export const softDeleteById = async (
  id: string | Types.ObjectId
): Promise<MessageRecord | null> =>
  Message.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { returnDocument: 'after' }
  ).lean<MessageRecord>();

export const softDeleteManyByIds = async (
  ids: string[],
  options?: { senderId?: string; chatId?: string }
): Promise<string[]> => {
  const objectIds = ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) return [];

  const filter: Record<string, unknown> = {
    _id: { $in: objectIds },
    isDeleted: { $ne: true },
  };
  if (options?.senderId) {
    filter.sender = options.senderId;
  }
  if (options?.chatId) {
    filter.chat = options.chatId;
  }

  const result = await Message.updateMany(filter, {
    $set: { isDeleted: true },
  });

  if (result.modifiedCount === 0) return [];

  const updated = await Message.find({
    _id: { $in: objectIds },
    isDeleted: true,
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  return updated.map((row) => row._id.toString());
};

export const deleteById = async (
  id: string | Types.ObjectId
): Promise<boolean> => {
  const result = await Message.findByIdAndDelete(id);
  return Boolean(result);
};

export const deleteManyByIds = async (
  ids: string[]
): Promise<void> => {
  await Message.deleteMany({ _id: { $in: ids } });
};

export const deleteByChatId = async (chatId: string): Promise<void> => {
  await Message.deleteMany({ chat: chatId });
};

export const findAttachmentsByChat = async (chatId: string, limit = 200) =>
  Message.find({
    chat: chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
    attachments: { $exists: true, $not: { $size: 0 } },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean<MessageRecord[]>();

/** Text messages that likely contain URLs (for shared-links panel). */
export const findTextContentsByChat = async (chatId: string) =>
  Message.find({
    chat: chatId,
    content: { $regex: /https?:\/\//i },
  })
    .select('_id content createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<Array<{ _id: Types.ObjectId; content?: string; createdAt: Date }>>();

export const countAll = async (): Promise<number> => Message.countDocuments();

/** Unread = messages from others after lastReadAt; missing cursor counts all from others.
 *  Single aggregation instead of N separate countDocuments round-trips. */
export const countUnreadByChats = async (
  userId: string,
  chatIds: Array<string | Types.ObjectId>,
  lastReadByChat: Map<string, Date>
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (chatIds.length === 0) return counts;

  const userOid = new Types.ObjectId(userId);
  const chatOids = chatIds.map((id) =>
    typeof id === 'string' ? new Types.ObjectId(id) : id
  );

  // Build per-chat $or conditions so each chat uses its own lastReadAt cursor.
  const perChatConditions = chatOids.map((chatOid) => {
    const chatKey = chatOid.toString();
    const lastReadAt = lastReadByChat.get(chatKey);
    const cond: Record<string, unknown> = {
      chat: chatOid,
      sender: { $ne: userOid },
      status: { $ne: 'failed' },
      isDeleted: { $ne: true },
    };
    if (lastReadAt) cond.createdAt = { $gt: lastReadAt };
    return cond;
  });

  type AggRow = { _id: Types.ObjectId; count: number };
  const rows = await Message.aggregate<AggRow>([
    { $match: { $or: perChatConditions } },
    { $group: { _id: '$chat', count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    counts.set(row._id.toString(), row.count);
  }
  // Chats not in the result have 0 unread
  for (const chatOid of chatOids) {
    if (!counts.has(chatOid.toString())) counts.set(chatOid.toString(), 0);
  }

  return counts;
};

export const findLatestInChat = async (
  chatId: string
): Promise<MessageRecord | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean<MessageRecord>();

export const findReadStateByIds = async (
  ids: Array<string | Types.ObjectId>
): Promise<Array<{ _id: Types.ObjectId; readBy: Types.ObjectId[] }>> => {
  const objectIds = ids
    .map((id) => String(id))
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) return [];

  return Message.find({ _id: { $in: objectIds } })
    .select('_id readBy')
    .lean<Array<{ _id: Types.ObjectId; readBy: Types.ObjectId[] }>>();
};

export const markReadByUserInChats = async (
  userId: string,
  chatIds: Array<string | Types.ObjectId>,
  lastReadAt: Date
): Promise<void> => {
  if (chatIds.length === 0) return;

  await Message.updateMany(
    {
      chat: { $in: chatIds },
      sender: { $ne: userId },
      createdAt: { $lte: lastReadAt },
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );
};

/** Count messages in a chat that are newer than the given timestamp (used to compute page number). */
export const countNewerThan = async (
  chatId: string,
  createdAt: Date
): Promise<number> =>
  Message.countDocuments({
    chat: chatId,
    status: { $ne: 'failed' },
    createdAt: { $gt: createdAt },
  });

/** Mark others' messages as read up to lastReadAt. */
export const markReadByUser = async (
  chatId: string,
  userId: string,
  lastReadAt: Date
): Promise<void> => {
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      createdAt: { $lte: lastReadAt },
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );
};

export const findReceipts = async (
  messageId: string,
  requesterId: string
): Promise<FindReceiptsResult> => {
  const msg = await Message.findById(messageId)
    .select('sender chat readBy')
    .populate<{ readBy: MessageReceiptUser[] }>('readBy', 'name avatar')
    .lean();

  if (!msg) return { readers: [], isAuthorized: false };

  // Verify the requester is either the message sender or the chat creator.
  const isSender = msg.sender.toString() === requesterId;
  const chatData = await Chat.findById(msg.chat).select('creator').lean();
  const isCreator = chatData?.creator?.toString() === requesterId;
  const isAuthorized = isSender || isCreator;

  const readers = (msg.readBy as unknown as MessageReceiptUser[])
    .filter((u) => u._id.toString() !== msg.sender.toString());

  return { readers, isAuthorized };
};
