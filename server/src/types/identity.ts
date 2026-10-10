/**
 * Who is behind a request or socket, resolved from cookies — never a DB read.
 *
 * Two cookies, two jobs (see docs/HUB_PLAN.md §6.3):
 * - `anonId` (24 h): one anonymous *session* — queue, match, blocks.
 * - `gid` (30 d): stable guest id for *abuse control* — bans, rate-limit
 *   continuity, persona restore. A tracking-class identifier: disclosed in the
 *   Cookie policy, used only for safety/continuity.
 */
export type GuestIdentity = {
  kind: 'guest';
  gid: string;
  anonId?: string;
};

export type MemberIdentity = {
  kind: 'member';
  userId: string;
  gid?: string;
  anonId?: string;
};

export type Identity = GuestIdentity | MemberIdentity;
