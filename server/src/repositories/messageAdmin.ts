import { Message } from '../models/message.js';
import type { DayCount } from '../types/user.js';
import { escapeRegex } from '../utils/normalize.js';

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
 * fileType is usually 'media' | 'document' (R2 uploads) or a full MIME (GIFs).
 * Image vs video: Cloudinary path OR file extension (R2 / ImageKit URLs).
 */
const IMAGE_EXT = /\.(png|jpe?g|webp|heic|heif|avif|bmp|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|aac|m4a|flac|wma)(\?|#|$)/i;
const GIF_EXT = /\.gif(\?|#|$)/i;

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
    filter.attachments = {
      $elemMatch: {
        $nor: [{ fileType: /^image\/gif$/i }, { name: GIF_EXT }, { url: GIF_EXT }],
        $or: [
          { fileType: { $regex: /^image\//i } },
          { url: /\/image\/upload\//i },
          { name: IMAGE_EXT },
          { url: IMAGE_EXT },
        ],
      },
    };
  } else if (kind === 'videos') {
    filter.attachments = {
      $elemMatch: {
        $nor: [{ name: AUDIO_EXT }, { url: AUDIO_EXT }, { fileType: { $regex: /^audio\//i } }],
        $or: [
          { fileType: { $regex: /^video\//i } },
          { url: /\/video\/upload\//i },
          { name: VIDEO_EXT },
          { url: VIDEO_EXT },
        ],
      },
    };
  } else if (kind === 'gifs') {
    filter.attachments = {
      $elemMatch: {
        $or: [
          { fileType: { $regex: /^image\/gif$/i } },
          { name: GIF_EXT },
          { url: GIF_EXT },
        ],
      },
    };
  } else if (kind === 'docs') {
    filter.attachments = {
      $elemMatch: {
        $or: [
          { fileType: 'document' },
          { fileType: { $regex: /^(application|text)\//i } },
        ],
      },
    };
  } else if (kind === 'links') {
    filter.content = { $regex: /https?:\/\//i };
  } else if (kind === 'deleted') {
    filter.isDeleted = true;
    filter.$or = [
      { 'attachments.0': { $exists: true } },
      { content: { $regex: /https?:\/\//i } },
    ];
  } else {
    filter['attachments.0'] = { $exists: true };
  }

  if (senderId) filter.sender = senderId;
  const term = q?.trim();
  if (term) {
    if (kind === 'links') {
      filter.content = { $regex: escapeRegex(term), $options: 'i' };
    } else if (kind === 'deleted') {
      const deletedScope = filter.$or;
      delete filter.$or;
      filter.$and = [
        { $or: deletedScope as Record<string, unknown>[] },
        {
          $or: [
            { 'attachments.name': { $regex: escapeRegex(term), $options: 'i' } },
            { content: { $regex: escapeRegex(term), $options: 'i' } },
          ],
        },
      ];
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
    .select('attachments content sender chat createdAt isDeleted')
    .populate('sender', 'name username avatar')
    .populate('chat', 'name groupChat')
    .lean();
};

export const findManyByIds = (ids: string[]) =>
  Message.find({ _id: { $in: ids } }).select('attachments').lean();

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

