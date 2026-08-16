import { Types } from 'mongoose';
import { Message } from '../models/message.js';
import type {
  CreateMessageInput,
  MessageRecord,
  UpdateMessagePatch,
} from '../types/message.js';
import type { DayCount } from '../types/user.js';

export const findByChatPage = async (
  chatId: string,
  skip: number,
  limit: number
) =>
  Message.find({ chat: chatId, status: { $ne: 'failed' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .populate('sender', 'name avatar')
    .populate('chat', 'groupChat');

export const countByChat = async (chatId: string): Promise<number> =>
  Message.countDocuments({ chat: chatId, status: { $ne: 'failed' } });

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
  Message.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<MessageRecord>();

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
    { $set: { isDeleted: true, content: undefined, attachments: [] } },
    { new: true }
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
    $set: { isDeleted: true, content: undefined, attachments: [] },
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

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type SearchMessagesFilter = {
  chatId: string;
  query?: string;
  scope?: 'all' | 'text' | 'media' | 'links';
  senderId?: string;
  excludeSenderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
};

export const searchInChat = async (
  input: SearchMessagesFilter
): Promise<MessageRecord[]> => {
  const query = (input.query ?? '').trim();
  const hasQuery = query.length >= 1;
  const hasDate = Boolean(input.dateFrom || input.dateTo);
  if (!hasQuery && !hasDate && input.scope !== 'media' && input.scope !== 'links') {
    return [];
  }

  const limit = Math.min(Math.max(input.limit ?? 40, 1), 80);
  const filter: Record<string, unknown> = {
    chat: input.chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
  };

  if (input.senderId) {
    filter.sender = input.senderId;
  } else if (input.excludeSenderId) {
    filter.sender = { $ne: input.excludeSenderId };
  }

  if (input.dateFrom || input.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (input.dateFrom) createdAt.$gte = input.dateFrom;
    if (input.dateTo) createdAt.$lte = input.dateTo;
    filter.createdAt = createdAt;
  }

  const scope = input.scope ?? 'all';
  if (hasQuery) {
    const escaped = escapeRegex(query);
    const textMatch = { content: { $regex: escaped, $options: 'i' } };
    const attachmentMatch = {
      'attachments.name': { $regex: escaped, $options: 'i' },
    };

    if (scope === 'text') {
      filter.content = { $regex: escaped, $options: 'i' };
    } else if (scope === 'media') {
      Object.assign(filter, {
        attachments: { $exists: true, $not: { $size: 0 } },
        $or: [textMatch, attachmentMatch],
      });
    } else if (scope === 'links') {
      Object.assign(filter, {
        $and: [
          { content: { $regex: 'https?:\\/\\/', $options: 'i' } },
          { content: { $regex: escaped, $options: 'i' } },
        ],
      });
    } else {
      filter.$or = [textMatch, attachmentMatch];
    }
  } else if (scope === 'media') {
    filter.attachments = { $exists: true, $not: { $size: 0 } };
  } else if (scope === 'links') {
    filter.content = { $regex: 'https?:\\/\\/', $options: 'i' };
  }

  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar')
    .lean<MessageRecord[]>();
};

/** First message on/after date — lean `_id`/`createdAt` only (jump-to-date). */
export const findFirstOnOrAfter = async (
  chatId: string,
  dateFrom: Date
): Promise<{ _id: { toString(): string }; createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
    createdAt: { $gte: dateFrom },
  })
    .sort({ createdAt: 1 })
    .select('_id createdAt')
    .lean();

/** First message within a calendar day only. */
export const findFirstInDay = async (
  chatId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<{ _id: { toString(): string }; createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
    createdAt: { $gte: dayStart, $lte: dayEnd },
  })
    .sort({ createdAt: 1 })
    .select('_id createdAt')
    .lean();

/** Distinct local calendar days (YYYY-MM-DD) that have messages in range. */
export const listActiveDatesInRange = async (
  chatId: string,
  from: Date,
  to: Date,
  timeZone: string
): Promise<string[]> => {
  if (!Types.ObjectId.isValid(chatId)) return [];

  const rows = await Message.aggregate<{ date: string }>([
    {
      $match: {
        chat: new Types.ObjectId(chatId),
        status: { $ne: 'failed' },
        isDeleted: { $ne: true },
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: timeZone || 'UTC',
          },
        },
      },
    },
    { $project: { _id: 0, date: '$_id' } },
  ]);

  return rows.map((row) => row.date).filter(Boolean);
};

/** Oldest message in a chat — O(1) index seek on { chat, createdAt: 1 }. */
export const findOldestMessage = async (
  chatId: string
): Promise<{ createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: 1 })
    .select('createdAt')
    .lean();

/** First message on/after day start; `exactDay` if it falls within the day. */
export const findJumpTargetForDay = async (
  chatId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<{
  _id: { toString(): string };
  createdAt: Date;
  exactDay: boolean;
} | null> => {
  const inDay = await findFirstInDay(chatId, dayStart, dayEnd);
  if (!inDay) return null;
  return { ...inDay, exactDay: true };
};
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

const adminMessageFilter = ({
  status,
  q,
  senderId,
}: {
  status?: 'all' | 'sent' | 'failed';
  q?: string;
  senderId?: string;
}): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  const term = q?.trim();
  if (term) filter.content = { $regex: escapeRegex(term), $options: 'i' };
  if (senderId) filter.sender = senderId;
  return filter;
};

export const countForAdmin = async ({
  status,
  q,
  senderId,
}: {
  status?: 'all' | 'sent' | 'failed';
  q?: string;
  senderId?: string;
}): Promise<number> => Message.countDocuments(adminMessageFilter({ status, q, senderId }));

export const listForAdminPage = async ({
  limit,
  before,
  status,
  q,
  senderId,
}: {
  limit: number;
  before?: Date;
  status?: 'all' | 'sent' | 'failed';
  q?: string;
  senderId?: string;
}) => {
  const filter: Record<string, unknown> = { ...adminMessageFilter({ status, q, senderId }) };
  if (before) filter.createdAt = { $lt: before };

  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name username avatar')
    .populate('chat', 'name groupChat')
    .lean();
};

/** @deprecated Use listForAdminPage */
export const listForAdmin = async () => listForAdminPage({ limit: 50 });

/**
 * fileType stored by upload middleware is 'media' (images/video/audio) or
 * 'document'. GIFs from the Klip service are stored with their MIME type
 * (e.g. 'image/gif'). Differentiate images vs videos by Cloudinary URL path.
 */
const adminAttachmentFilter = ({
  q,
  senderId,
  kind,
}: {
  q?: string;
  senderId?: string;
  kind?: string;
}): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (kind === 'images') {
    // fileType='media' + Cloudinary image path + not a GIF filename
    filter.attachments = {
      $elemMatch: {
        fileType: 'media',
        url: { $regex: /\/image\/upload\//i },
        name: { $not: /\.gif$/i },
      },
    };
  } else if (kind === 'videos') {
    // fileType='media' + Cloudinary video path + not an audio extension
    filter.attachments = {
      $elemMatch: {
        fileType: 'media',
        url: { $regex: /\/video\/upload\//i },
        name: { $not: /\.(mp3|wav|ogg|aac|m4a|flac|wma)$/i },
      },
    };
  } else if (kind === 'gifs') {
    // GIF MIME type (Klip) OR .gif filename (uploaded)
    filter.attachments = {
      $elemMatch: {
        $or: [
          { fileType: { $regex: /^image\/gif$/i } },
          { name: { $regex: /\.gif$/i } },
        ],
      },
    };
  } else if (kind === 'docs') {
    filter.attachments = { $elemMatch: { fileType: 'document' } };
  } else if (kind === 'links') {
    filter.content = { $regex: /https?:\/\//i };
  } else {
    // 'all' — any message with at least one attachment
    filter['attachments.0'] = { $exists: true };
  }

  if (senderId) filter.sender = senderId;
  const term = q?.trim();
  if (term) {
    if (kind === 'links') {
      filter.content = { $regex: escapeRegex(term), $options: 'i' };
    } else {
      filter['attachments.name'] = { $regex: escapeRegex(term), $options: 'i' };
    }
  }
  return filter;
};

export const countAttachmentsForAdmin = async ({
  q,
  senderId,
  kind,
}: {
  q?: string;
  senderId?: string;
  kind?: string;
}): Promise<number> =>
  Message.countDocuments(adminAttachmentFilter({ q, senderId, kind }));

export const listAttachmentsForAdmin = async ({
  limit,
  before,
  q,
  senderId,
  kind,
}: {
  limit: number;
  before?: Date;
  q?: string;
  senderId?: string;
  kind?: string;
}) => {
  const filter: Record<string, unknown> = { ...adminAttachmentFilter({ q, senderId, kind }) };
  if (before) filter.createdAt = { $lt: before };

  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('attachments content sender chat createdAt')
    .populate('sender', 'name username avatar')
    .populate('chat', 'name groupChat')
    .lean();
};

export const listRecentForActivity = async ({
  limit,
  before,
}: {
  limit: number;
  before?: Date;
}) => {
  const filter: Record<string, unknown> = {};
  if (before) filter.createdAt = { $lt: before };

  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('content attachments status createdAt sender chat')
    .populate('sender', 'name username avatar')
    .populate('chat', 'name groupChat')
    .lean();
};

export const countCreatedByDay = async (
  start: Date,
  end: Date
): Promise<DayCount[]> =>
  Message.aggregate<DayCount>([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
