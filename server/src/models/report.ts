import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IReportFields } from '../types/match.js';

export type IReport = IReportFields & Document;

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reporterAnonId: { type: String, default: null },
    targetType: { type: String, enum: ['user', 'anonSession'], required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    targetAnonId: { type: String, default: null },
    sessionId: { type: String, default: null },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', default: null },
    reason: {
      type: String,
      enum: ['inappropriate_content', 'harassment', 'spam', 'underage', 'other'],
      required: true,
    },
    details: { type: String, maxlength: 500, default: null },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reportSchema.index({ reviewed: 1, createdAt: -1 }); // admin review queue
reportSchema.index({ targetAnonId: 1 }); // look up reports against an anonId
reportSchema.index({ targetUserId: 1 }); // look up reports against a user

export const Report =
  (mongoose.models.Report as mongoose.Model<IReport> | undefined) ||
  model<IReport>('Report', reportSchema);
