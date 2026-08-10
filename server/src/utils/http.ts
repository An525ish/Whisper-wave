import type { Types } from 'mongoose';

/** Express 5 params can be string | string[]; normalize to a single string. */
export const param = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

export type ObjectIdLike = Types.ObjectId | string;
