import type { Types } from 'mongoose';
import { PendingConnection } from '../models/pendingConnection.js';
import type { PendingConnectionSide, PendingConnectionStatus } from '../types/match.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const create = async (
  sessionId: string,
  sides: [PendingConnectionSide, PendingConnectionSide]
) => {
  return PendingConnection.create({
    sessionId,
    sides,
    status: 'pending',
    expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
  });
};

export const findBySessionId = async (sessionId: string) =>
  PendingConnection.findOne({ sessionId }).lean();

/**
 * Atomically claim processing rights — prevents two simultaneous /connection/complete
 * calls from both trying to create the final Connection document.
 *
 * Returns the document BEFORE the update (so we know whether we won the race).
 */
export const claimForProcessing = async (sessionId: string) =>
  PendingConnection.findOneAndUpdate(
    { sessionId, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: false }
  ).lean();

/** Populate one side's userId once the user creates/logs into their account. */
export const populateSideUserId = async (
  sessionId: string,
  anonId: string,
  userId: Types.ObjectId | string
) =>
  PendingConnection.findOneAndUpdate(
    { sessionId, 'sides.anonId': anonId },
    { $set: { 'sides.$.userId': userId } },
    { new: true }
  ).lean();

export const markCompleted = async (sessionId: string) =>
  PendingConnection.findOneAndUpdate(
    { sessionId },
    { $set: { status: 'completed' } },
    { new: true }
  ).lean();

export const updateStatus = async (sessionId: string, status: PendingConnectionStatus) =>
  PendingConnection.findOneAndUpdate({ sessionId }, { $set: { status } }, { new: true }).lean();
