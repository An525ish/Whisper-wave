import { AppError } from '../../utils/AppError.js';
import * as reportRepo from '../../repositories/report.js';
import { hideMessage } from '../rooms/registry.js';
import { banIdentity } from './rooms.js';
import type { AdminReportActionBody } from '../../types/adminInput.js';
import type { ReportActionResult } from '../../types/roomAdmin.js';

/**
 * One-click offender action straight from a room report. Uses the identity
 * the server resolved at filing (`targetGid` / `targetUserId`) — the admin
 * never types it. Does not mark the report reviewed; that is its own step
 * (with an action note). The controller evicts live sockets and audits.
 */
export const applyReportAction = async (
  id: string,
  body: AdminReportActionBody
): Promise<ReportActionResult> => {
  const report = await reportRepo.findById(id);
  if (!report) throw new AppError(404, 'Report not found');
  if (report.targetType !== 'roomMessage') {
    throw new AppError(400, 'Only room-message reports support this action');
  }

  if (body.action === 'hide') {
    if (!report.roomInstanceId || !report.roomMessageId) {
      throw new AppError(409, 'This report has no live message reference');
    }
    // False = already hidden or the instance is gone — evidence is unaffected.
    const applied = hideMessage(report.roomInstanceId, report.roomMessageId);
    return {
      report,
      applied,
      audit: { action: 'report-hide', target: report.roomMessageId, roomSlug: report.roomSlug, detail: `report ${id}` },
    };
  }

  const gid = report.targetGid ?? null;
  const userId = report.targetUserId ? String(report.targetUserId) : null;
  if (!gid && !userId) throw new AppError(409, 'This report has no offender identity to ban');
  const roomSlug = body.scope === 'global' ? null : report.roomSlug;
  if (body.scope === 'room' && !roomSlug) throw new AppError(409, 'This report has no room to ban from');

  await banIdentity({
    roomSlug,
    gid,
    userId,
    minutes: body.durationMin,
    reason: `Report ${id}: ${report.reason}`,
  });
  return {
    report,
    applied: true,
    evict: { ...(gid ? { gid } : {}), ...(userId ? { userId } : {}), ...(roomSlug ? { slug: roomSlug } : {}) },
    audit: {
      action: 'ban',
      target: gid ?? userId,
      roomSlug,
      detail: `${body.durationMin} min — report ${id} (${report.reason})`,
    },
  };
};
