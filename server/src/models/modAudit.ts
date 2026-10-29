import mongoose, { Schema, model, type Document } from 'mongoose';
import type { ModAuditFields } from '../types/roomAdmin.js';

export type IModAudit = ModAuditFields & Document;

/**
 * Who did what, to whom, where. Bans lists and report states cover outcomes;
 * this covers the ACTS — the runbook's "what did we do and when" question.
 * Capped reads, unbounded writes: moderation actions are rare, audits many.
 */
const modAuditSchema = new Schema<IModAudit>(
  {
    actorKind: { type: String, enum: ['mod', 'admin'], required: true },
    actorLabel: { type: String, required: true },
    actorUserId: { type: String, default: null },
    actorGid: { type: String, default: null },
    action: { type: String, required: true },
    target: { type: String, default: null },
    roomSlug: { type: String, default: null },
    instanceId: { type: String, default: null },
    detail: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

modAuditSchema.index({ createdAt: -1 });
modAuditSchema.index({ roomSlug: 1, createdAt: -1 });

export const ModAudit =
  (mongoose.models.ModAudit as mongoose.Model<IModAudit> | undefined) ||
  model<IModAudit>('ModAudit', modAuditSchema);
