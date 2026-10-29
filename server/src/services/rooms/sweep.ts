import { logger } from '../../utils/logger.js';
import * as roomRepo from '../../repositories/room.js';
import { isRoomOpen } from './hours.js';
import { allInstanceIds, liveCounts } from './registry.js';

let running = false;

/**
 * Instances of rooms whose hours just lapsed under them. Best-effort and cheap:
 * no live instances → no Mongo read; overlapping sweeps are skipped; a template
 * whose hours cannot be evaluated (bad tz) is logged and treated as CLOSED, so
 * a corrupt row ends its sessions instead of staying open forever.
 */
export const lapsedInstanceIds = async (now: Date = new Date()): Promise<string[]> => {
  if (running || allInstanceIds().length === 0) return [];
  running = true;
  try {
    const lapsed: string[] = [];
    for (const template of await roomRepo.listAll()) {
      if (!template.hours) continue;
      let open: boolean;
      try {
        open = isRoomOpen(template.hours, now);
      } catch (err) {
        logger.warn({ err, slug: template.slug }, 'Room hours unreadable — treating as closed');
        open = false;
      }
      if (!open) lapsed.push(...liveCounts(template.slug).map((c) => c.instanceId));
    }
    return lapsed;
  } catch (err) {
    logger.warn({ err }, 'Hours sweep: template read failed, skipping tick');
    return [];
  } finally {
    running = false;
  }
};
