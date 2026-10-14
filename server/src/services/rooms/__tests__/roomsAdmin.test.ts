import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeRetainUntil } from '../../admin/report.js';
import { assertIsEditableByHost } from '../lobby.js';
import { adminRoomBanSchema, adminRoomUpsertSchema, roomCreateSchema } from '../../../validators/rooms.js';
import { adminReportActionSchema, adminReportReviewSchema } from '../../../validators/admin.js';
import { AppError } from '../../../utils/AppError.js';

const DAY = 24 * 3_600_000;
const ID = 'a'.repeat(24);

const statusOf = (fn: () => void): number | undefined => {
  try {
    fn();
  } catch (err) {
    return err instanceof AppError ? err.statusCode : undefined;
  }
  return undefined;
};

describe('report retention', () => {
  const at = new Date('2026-01-01T00:00:00Z');
  it('keeps resolved reports 90 days, child safety 1 year', () => {
    assert.equal(computeRetainUntil('harassment', at).getTime() - at.getTime(), 90 * DAY);
    assert.equal(computeRetainUntil('underage', at).getTime() - at.getTime(), 365 * DAY);
  });
});

describe('host-only room edits', () => {
  const room = { official: false, createdBy: { toString: () => ID } as never };
  it('lets only the host through; others get 404, official 403', () => {
    assert.equal(statusOf(() => assertIsEditableByHost(room, ID)), undefined);
    assert.equal(statusOf(() => assertIsEditableByHost(room, 'b'.repeat(24))), 404);
    assert.equal(statusOf(() => assertIsEditableByHost(null, ID)), 404);
    assert.equal(statusOf(() => assertIsEditableByHost({ ...room, official: true }, ID)), 403);
  });
});

describe('room validators', () => {
  const create = { slug: 'my-room', title: 'T', description: 'D', rules: ['r'], rulesAccepted: true };
  it('requires rulesAccepted and rejects reserved slugs', () => {
    assert.equal(roomCreateSchema.safeParse(create).success, true);
    assert.equal(roomCreateSchema.safeParse({ ...create, rulesAccepted: false }).success, false);
    assert.equal(roomCreateSchema.safeParse({ ...create, rulesAccepted: undefined }).success, false);
    assert.equal(roomCreateSchema.safeParse({ ...create, slug: 'support' }).success, false);
  });

  const upsert = { slug: 'r', title: 'T', description: 'D', visibility: 'official' as const };
  const hours = (tz: string) => ({ days: [1], start: '10:00', end: '11:00', tz });
  it('validates hours.tz and mod ObjectIds', () => {
    assert.equal(adminRoomUpsertSchema.safeParse({ ...upsert, hours: hours('Asia/Kolkata') }).success, true);
    assert.equal(adminRoomUpsertSchema.safeParse({ ...upsert, hours: hours('Mars/Base') }).success, false);
    assert.equal(adminRoomUpsertSchema.safeParse({ ...upsert, mods: [ID] }).success, true);
    assert.equal(adminRoomUpsertSchema.safeParse({ ...upsert, mods: ['nope'] }).success, false);
  });

  it('validates the ban userId as an ObjectId', () => {
    const ban = { roomSlug: null, minutes: 5, reason: 'x' };
    assert.equal(adminRoomBanSchema.safeParse({ ...ban, userId: ID }).success, true);
    assert.equal(adminRoomBanSchema.safeParse({ ...ban, userId: 'nope' }).success, false);
  });
});

describe('admin report validators', () => {
  it('requires an action note to resolve, not to reopen', () => {
    assert.equal(adminReportReviewSchema.safeParse({}).success, false);
    assert.equal(adminReportReviewSchema.safeParse({ actionNote: 'banned 24h' }).success, true);
    assert.equal(adminReportReviewSchema.safeParse({ reviewed: false }).success, true);
  });

  it('accepts ban/hide only, with bounded duration', () => {
    assert.equal(adminReportActionSchema.safeParse({ action: 'ban' }).success, true);
    assert.equal(adminReportActionSchema.safeParse({ action: 'delete' }).success, false);
    assert.equal(adminReportActionSchema.safeParse({ action: 'ban', durationMin: 0 }).success, false);
  });
});
