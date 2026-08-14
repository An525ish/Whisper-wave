import type { SharedMediaRow } from '@/types';
import { MAX_FILES } from '@/constants/app';
import dayjs from 'dayjs';

export const getFirstName = (fullName?: string | null): string => {
  if (!fullName) return '';

  const prefixes = [
    'Mr',
    'Mr.',
    'Mrs',
    'Mrs.',
    'Miss',
    'Ms',
    'Ms.',
    'Dr',
    'Dr.',
    'Prof',
    'Prof.',
  ];
  const nameParts = fullName.split(' ');

  if (nameParts.length > 1 && prefixes.includes(nameParts[0])) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }

  return nameParts[0];
};

/** Returns null if valid, or an error message string if invalid. */
export const validateFiles = (
  files: FileList | File[],
  individualLimit = 0,
  cumulativeLimit = 0,
): string | null => {
  const fileType = files[0].type.split('/')[0];

  if (files.length > MAX_FILES) {
    return `You can only upload up to ${MAX_FILES} ${fileType}`;
  }

  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalSize += file.size;

    if (individualLimit > 0 && file.size > individualLimit) {
      return `${fileType} size cannot exceed ${individualLimit / 1024 / 1024} MB`;
    }
  }

  if (cumulativeLimit > 0 && totalSize > cumulativeLimit) {
    return `${fileType} file size cannot exceed ${cumulativeLimit / 1024 / 1024} MB`;
  }

  return null;
};

export const getLocalStorage = <T>(key: string): T | null => {
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : null;
};

export const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

/** Chat day separator: Today / Yesterday / D MMM / D MMM, YYYY */
export const formatChatDayLabel = (iso?: string | null): string => {
  if (!iso) return '';

  const date = dayjs(iso);
  if (!date.isValid()) return '';

  const today = dayjs().startOf('day');
  const day = date.startOf('day');

  if (day.isSame(today)) return 'Today';
  if (day.isSame(today.subtract(1, 'day'))) return 'Yesterday';
  if (day.year() === today.year()) return date.format('D MMM');
  return date.format('D MMM, YYYY');
};

/** WhatsApp-style chat list time: hh:mm A / Yesterday / ddd / D MMM / D MMM, YYYY */
export const formatChatTime = (time?: string): string => {
  if (!time) return '';
  const messageDate = dayjs(time);
  const now = dayjs();

  if (messageDate.isSame(now, 'day')) {
    return messageDate.format('hh:mm A');
  }
  if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }
  if (messageDate.isSame(now, 'week')) {
    return messageDate.format('ddd');
  }
  if (messageDate.isSame(now, 'year')) {
    return messageDate.format('D MMM');
  }
  return messageDate.format('D MMM, YYYY');
};

/** Single canonical Mongo ObjectId validator. */
export const isValidMongoId = (id?: string | null): boolean =>
  Boolean(id && /^[a-f\d]{24}$/i.test(id));

// Aliases for semantic clarity at call sites — no import changes needed elsewhere.
export const isValidChatId = isValidMongoId;
export const isValidMessageId = isValidMongoId;

type ChatMemberRef =
  | string
  | { _id?: string | { toString(): string } };

/** Socket fan-out expects member id strings, not populated user objects. */
export const normalizeMemberIds = (
  members?: ChatMemberRef[] | null,
): string[] => {
  if (!members?.length) return [];

  return members
    .map((member) => {
      if (typeof member === 'string') return member;
      const id = member._id;
      if (typeof id === 'string') return id;
      return id?.toString() ?? null;
    })
    .filter((id): id is string => Boolean(id));
};

/** WhatsApp-style last seen label. */
export const formatLastSeen = (iso?: string | null): string | null => {
  if (!iso) return null;

  const date = dayjs(iso);
  if (!date.isValid()) return null;

  const time = date.format('h:mm A');
  const today = dayjs().startOf('day');
  const day = date.startOf('day');

  if (day.isSame(today)) return `last seen today at ${time}`;
  if (day.isSame(today.subtract(1, 'day'))) {
    return `last seen yesterday at ${time}`;
  }
  if (day.year() === today.year()) {
    return `last seen ${date.format('D MMM')} at ${time}`;
  }
  return `last seen ${date.format('D MMM, YYYY')} at ${time}`;
};


export const normalizeMediaAttachments = (
  data:
    | SharedMediaRow[]
    | { attachments?: SharedMediaRow[]; links?: unknown[] }
    | undefined,
): SharedMediaRow[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.attachments ?? [];
};

export const getInitial = (label: string): string =>
  (label.trim()[0] || '?').toUpperCase();
