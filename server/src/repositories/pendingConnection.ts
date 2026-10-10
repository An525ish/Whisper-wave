import { Types } from 'mongoose';
import { PendingConnection } from '../models/pendingConnection.js';
import type {
  IPendingConnectionDocFields,
  PendingConnectionSideDoc,
  PendingConnectionStatusDoc,
} from '../types/connection.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** A 'processing' claim older than this is treated as abandoned and may be re-taken. */
export const STALE_PROCESSING_MS = 60 * 1000;

type PendingLean = IPendingConnectionDocFields & { _id: Types.ObjectId };

/**
 * Atomic find-or-create: two simultaneous first arrivals can't collide on the
 * unique `sessionId` index.
 */
export const findOrCreate = async (
  sessionId: string,
  sides: [PendingConnectionSideDoc, PendingConnectionSideDoc]
): Promise<PendingLean> => {
  const doc = await PendingConnection.findOneAndUpdate(
    { sessionId },
    {
      $setOnInsert: {
        sessionId,
        sides,
        status: 'pending',
        processingAt: null,
        expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
      },
    },
    { upsert: true, new: true }
  ).lean<PendingLean>();
  if (!doc) throw new Error('PendingConnection upsert returned no document');
  return doc;
};

export const findBySessionId = async (sessionId: string): Promise<PendingLean | null> =>
  PendingConnection.findOne({ sessionId }).lean<PendingLean>();

/**
 * Rows where this account is bound and the partner is not — "waiting for
 * them". Only `pending` rows: `processing` is mid-completion (the announce
 * will resolve it), `completed` is already a DM, `expired` is dead.
 */
export const findWaitingForUser = async (userId: string): Promise<PendingLean[]> =>
  PendingConnection.find({
    status: 'pending',
    $or: [
      { 'sides.0.userId': new Types.ObjectId(userId), 'sides.1.userId': null },
      { 'sides.1.userId': new Types.ObjectId(userId), 'sides.0.userId': null },
    ],
  })
    .sort({ createdAt: -1 })
    .lean<PendingLean[]>();

/**
 * Release this account's seat (cancel flow). The partner's side is left alone
 * to expire — they get no signal, per the neutral-copy rule.
 */
export const unbindUser = async (sessionId: string, userId: string): Promise<boolean> => {
  const id = new Types.ObjectId(userId);
  const res = await PendingConnection.updateOne(
    { sessionId, $or: [{ 'sides.0.userId': id }, { 'sides.1.userId': id }] },
    [
      {
        $set: {
          sides: {
            $map: {
              input: '$sides',
              as: 'side',
              in: {
                $mergeObjects: [
                  '$$side',
                  {
                    userId: {
                      $cond: [{ $eq: ['$$side.userId', id] }, null, '$$side.userId'],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]
  );
  return res.modifiedCount > 0;
};

/**
 * Atomically claim processing rights — prevents two simultaneous /connection/complete
 * calls from both trying to create the final Connection document.
 *
 * Also re-takes a claim stuck in 'processing' longer than STALE_PROCESSING_MS,
 * so a crash mid-completion cannot wedge the session forever.
 *
 * Returns the document BEFORE the update (so we know whether we won the race).
 */
export const claimForProcessing = async (sessionId: string): Promise<PendingLean | null> => {
  const now = new Date();
  return PendingConnection.findOneAndUpdate(
    {
      sessionId,
      $or: [
        { status: 'pending' },
        {
          status: 'processing',
          processingAt: { $lt: new Date(now.getTime() - STALE_PROCESSING_MS) },
        },
      ],
    },
    { $set: { status: 'processing', processingAt: now } },
    { new: false }
  ).lean<PendingLean>();
};

/**
 * Bind `userId` to seat `side` (0 | 1) of the session.
 *
 * Atomic and replay-safe: the seat is updated only while its userId is still
 * null or already this same user, so a connect token can never be re-bound to
 * a different account. Returns null when the seat is taken by someone else (or
 * the session is gone).
 */
export const bindSideToUser = async (
  sessionId: string,
  side: 0 | 1,
  userIdRaw: Types.ObjectId | string
): Promise<PendingLean | null> => {
  const userId = new Types.ObjectId(userIdRaw);
  const field = `sides.${side}.userId`;
  return PendingConnection.findOneAndUpdate(
    { sessionId, [field]: { $in: [null, userId] } },
    { $set: { [field]: userId } },
    { new: true }
  ).lean<PendingLean>();
};

export const markCompleted = async (sessionId: string) =>
  PendingConnection.findOneAndUpdate(
    { sessionId },
    { $set: { status: 'completed', processingAt: null } },
    { new: true }
  ).lean();

export const updateStatus = async (sessionId: string, status: PendingConnectionStatusDoc) =>
  PendingConnection.findOneAndUpdate(
    { sessionId },
    { $set: { status, processingAt: null } },
    { new: true }
  ).lean();
