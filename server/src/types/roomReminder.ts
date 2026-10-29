import type { Types } from 'mongoose';
import type { IRoomFields } from './room.js';

export type IRoomReminderFields = {
  userId: Types.ObjectId;
  slug: string;
  createdAt: Date;
};

/** Everything the reminder tick needs, injected so the decision logic is testable. */
export type ReminderDispatchDeps = {
  distinctSlugs: () => Promise<string[]>;
  findRoom: (slug: string) => Promise<{ title: string; hours?: IRoomFields['hours'] } | null>;
  takeUserIds: (slug: string) => Promise<string[]>;
  isOpen: (hours: IRoomFields['hours'], now: Date) => boolean;
  notify: (slug: string, title: string, userIds: string[]) => void;
};
