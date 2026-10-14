import mongoose, { Schema, model } from 'mongoose';
import { PUSH_DEVICE_TTL_SECONDS } from '../constants/push.js';
import type { IPushDeviceFields } from '../types/push.js';

const pushDeviceSchema = new Schema<IPushDeviceFields>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['web'], default: 'web' },
  userAgent: { type: String, default: '' },
  lastSeenAt: { type: Date, required: true, default: Date.now },
});

// Devices that never check in again expire on their own.
pushDeviceSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: PUSH_DEVICE_TTL_SECONDS });

export const PushDevice =
  (mongoose.models.PushDevice as mongoose.Model<IPushDeviceFields> | undefined) ||
  model<IPushDeviceFields>('PushDevice', pushDeviceSchema);
