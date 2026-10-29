import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IReportFields } from '../types/report.js';

export type IReport = IReportFields & Document;

/**
 * Evidence snapshot subdocument: the reported message plus neighbours, alias
 * + text + timestamp only. This is the narrow, disclosed exception to "rooms
 * leave no transcript" — kept only when someone reports.
 */
const evidenceItemSchema = new Schema(
  {
    alias: { type: String, required: true },
    // Empty for a photo/GIF-only message.
    text: { type: String, default: '' },
    media: {
      type: new Schema({ kind: { type: String, enum: ['image', 'gif', 'meme'] }, url: String }, { _id: false }),
      default: undefined,
    },
    ts: { type: Number, required: true },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reporterAnonId: { type: String, default: null },
    reporterGid: { type: String, default: null },
    targetType: { type: String, enum: ['user', 'anonSession', 'roomMessage'], required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    targetGid: { type: String, default: null },
    targetAnonId: { type: String, default: null },
    sessionId: { type: String, default: null },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', default: null },
    roomSlug: { type: String, default: null },
    roomInstanceId: { type: String, default: null },
    roomMessageId: { type: String, default: null },
    evidence: { type: [evidenceItemSchema], default: null },
    reason: {
      type: String,
      enum: ['inappropriate_content', 'harassment', 'spam', 'underage', 'impersonation', 'other'],
      required: true,
    },
    details: { type: String, maxlength: 500, default: null },
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date, default: null },
    actionNote: { type: String, maxlength: 500, default: null },
    retainUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ reviewed: 1, createdAt: -1 }); // admin review queue
reportSchema.index({ targetAnonId: 1 }); // look up reports against an anonId
reportSchema.index({ targetUserId: 1 }); // look up reports against a user
reportSchema.index({ reporterGid: 1, roomMessageId: 1 }); // room-report dedupe
/**
 * Evidence retention (legal): a resolved report expires at `retainUntil`
 * (90 d after review, 1 y for child safety). Unresolved reports and legacy
 * docs without the field are never expired — Mongo's TTL monitor skips
 * documents where the field is missing or null, so this is migration-safe.
 */
reportSchema.index({ retainUntil: 1 }, { expireAfterSeconds: 0 });

export const Report =
  (mongoose.models.Report as mongoose.Model<IReport> | undefined) ||
  model<IReport>('Report', reportSchema);
