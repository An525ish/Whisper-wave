import { markChallengePassed } from '../challenge.js';
import { joinInstance } from '../registry.js';
import type { IRoomFields, RoomRole } from '../../../types/room.js';

/** Small caps so overflow is cheap to provoke (registry tests). `seat` uses roomy caps. */
export const template: Pick<IRoomFields, 'slug' | 'title' | 'capSoft' | 'capHard'> = {
  slug: 'test-room',
  title: 'Test Room',
  capSoft: 2,
  capHard: 3,
};

const roomy = { ...template, capSoft: 50, capHard: 60 };

export const guest = (gid: string) => ({ kind: 'guest' as const, gid });

/**
 * Seat a guest who has already cleared the first-post challenge. Module-level
 * state (mutes, challenge passes, limiters) is keyed by identity, so each test
 * uses fresh gids rather than resetting production state.
 */
export const seat = (gid: string, alias: string, role: RoomRole = 'member') => {
  markChallengePassed(gid);
  return joinInstance({ template: roomy, identity: guest(gid), alias, color: '#fff', role });
};
