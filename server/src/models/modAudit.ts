import mongoose, { Schema, model, type Document } from 'mongoose';

export type ModAuditFields = {
  actorKind: 'mod' | 'admin';
  /** Alias in-room, or 'admin'. Never an anonId beyond what reporters hold. */
  actorLabel: string;
  actorUserId?: string | null;
  actorGid?: string | null;
  /** delete | mute | kick | shadowmute | lock | unlock | slow | ban | unban | close | feature */
  action: string;
  target?: string | null;
  roomSlug?: string | null;
  instanceId?: string | null;
  detail?: string | null;
  createdAt: Date;
};

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
