import { ImpersonationLog, type ImpersonationLogDoc } from '../models/ImpersonationLog.js';

export type CreateLogInput = Omit<ImpersonationLogDoc, '_id'>;

export const create = async (input: CreateLogInput): Promise<ImpersonationLogDoc> => {
  const doc = await ImpersonationLog.create(input);
  return doc.toObject() as ImpersonationLogDoc;
};

export type ImpersonationLogPage = {
  logs: ImpersonationLogDoc[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export const findPaginated = async (
  limit: number,
  before?: Date
): Promise<ImpersonationLogPage> => {
  const filter = before ? { startedAt: { $lt: before } } : {};

  const [logs, total] = await Promise.all([
    ImpersonationLog.find(filter)
      .sort({ startedAt: -1 })
      .limit(limit + 1)
      .lean<ImpersonationLogDoc[]>(),
    before ? Promise.resolve(undefined) : ImpersonationLog.countDocuments(),
  ]);

  const hasMore = logs.length > limit;
  if (hasMore) logs.pop();

  const nextCursor = hasMore ? logs[logs.length - 1]?.startedAt.toISOString() ?? null : null;

  return { logs, nextCursor, hasMore, total };
};
