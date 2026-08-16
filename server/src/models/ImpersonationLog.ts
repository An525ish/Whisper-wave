import { Schema, model, type Types } from 'mongoose';

export type ImpersonationLogDoc = {
  _id: Types.ObjectId;
  /** 'admin' — single admin system; preserved for future multi-admin expansion */
  adminId: string;
  targetUserId: Types.ObjectId;
  targetUsername: string;
  targetName: string;
  startedAt: Date;
};

const ImpersonationLogSchema = new Schema<ImpersonationLogDoc>(
  {
    adminId: { type: String, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetUsername: { type: String, required: true },
    targetName: { type: String, required: true },
    startedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false }
);

export const ImpersonationLog = model<ImpersonationLogDoc>(
  'ImpersonationLog',
  ImpersonationLogSchema
);
