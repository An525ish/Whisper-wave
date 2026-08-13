import toast from 'react-hot-toast';
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

export const validateFiles = (
  files: FileList | File[],
  individualLimit = 0,
  cumulativeLimit = 0,
): boolean => {
  const fileType = files[0].type.split('/')[0];

  if (files.length > 5) {
    toast.error(`You can only upload up to 5 ${fileType}`);
    return false;
  }

  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalSize += file.size;

    if (individualLimit > 0 && file.size > individualLimit) {
      toast.error(
        `${fileType} size cannot exceed ${individualLimit / 1024 / 1024} MB`,
      );
      return false;
    }
  }

  if (cumulativeLimit > 0 && totalSize > cumulativeLimit) {
    toast.error(
      `${fileType} file size cannot exceed ${cumulativeLimit / 1024 / 1024} MB`,
    );
    return false;
  }

  return true;
};

type LocalStorageHandlerArgs = {
  key: string;
  value?: unknown;
  get?: boolean;
};

export const localStorageHandler = ({
  key,
  value,
  get,
}: LocalStorageHandlerArgs): unknown => {
  if (get) {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } else {
    return localStorage.setItem(key, JSON.stringify(value));
  }
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

/** Mongo ObjectId string — rejects empty / "undefined" route params */
export const isValidChatId = (id?: string | null): boolean =>
  Boolean(id && /^[a-f\d]{24}$/i.test(id));

/** Persisted message id (Mongo ObjectId). */
export const isValidMessageId = (id?: string | null): boolean =>
  Boolean(id && /^[a-f\d]{24}$/i.test(id));

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
