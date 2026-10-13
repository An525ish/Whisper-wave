import { Types } from 'mongoose';
import type { UpdateWithAggregationPipeline } from 'mongoose';
import { Message } from '../models/message.js';
import type { MessageReactionDb } from '../types/message.js';

/**
 * Persistence for the message `reactions` sub-document.
 *
 * Split out from `repositories/message.ts` by concern, not by collection: the
 * reaction toggle is the one write path on a message that has to reason about
 * arrayFilters and prune-empty-entries, and it needs none of the pagination,
 * search, receipts or admin-listing machinery that file has grown into.
 */

/** The one field the toggle's pre-checks read: which chat the message is in. */
export type ReactionState = {
  chat: Types.ObjectId;
};

export const findReactionState = async (id: string): Promise<ReactionState | null> =>
  Message.findById(id).select('chat').lean<ReactionState>();

/** Add one user to the existing entry for `emoji`. No-op if the entry is absent. */
export const addUserToEmoji = async (
  id: string,
  emoji: string,
  userId: string
): Promise<void> => {
  await Message.updateOne(
    { _id: id },
    { $addToSet: { 'reactions.$[elem].users': userId } },
    { arrayFilters: [{ 'elem.emoji': emoji }] }
  );
};

/**
 * Atomically toggle `userId`'s reaction `emoji` on a message of `chatId`.
 *
 * ONE aggregation-pipeline update, so two concurrent toggles by the same user
 * cannot interleave (the old pull/prune/push sequence could). In order, on the
 * server: remember whether the user already holds `emoji`; drop the user from every
 * entry and prune entries left empty; if they did NOT hold `emoji`, add them to its
 * entry (appending the entry when absent). Entry and user order are preserved.
 *
 * Returns the resulting reactions, or `null` when no message `id` exists in `chatId`.
 */
export const toggleUserReaction = async (
  id: string,
  chatId: string,
  emoji: string,
  userId: string
): Promise<MessageReactionDb[] | null> => {
  const uid = new Types.ObjectId(userId);
  const e = { $literal: emoji };
  const current = { $ifNull: ['$reactions', []] };
  const emojiMatches = { $eq: ['$$r.emoji', e] };

  const pipeline: UpdateWithAggregationPipeline = [
    {
      $set: {
        __had: {
          $anyElementTrue: [
            {
              $map: {
                input: current,
                as: 'r',
                in: { $and: [emojiMatches, { $in: [uid, { $ifNull: ['$$r.users', []] }] }] },
              },
            },
          ],
        },
      },
    },
    {
      $set: {
        reactions: {
          $filter: {
            input: {
              $map: {
                input: current,
                as: 'r',
                in: {
                  emoji: '$$r.emoji',
                  users: {
                    $filter: {
                      input: { $ifNull: ['$$r.users', []] },
                      as: 'u',
                      cond: { $ne: ['$$u', uid] },
                    },
                  },
                },
              },
            },
            as: 'r',
            cond: { $gt: [{ $size: '$$r.users' }, 0] },
          },
        },
      },
    },
    {
      $set: {
        reactions: {
          $cond: [
            '$__had',
            '$reactions',
            {
              $cond: [
                {
                  $anyElementTrue: [
                    { $map: { input: '$reactions', as: 'r', in: emojiMatches } },
                  ],
                },
                {
                  $map: {
                    input: '$reactions',
                    as: 'r',
                    in: {
                      $cond: [
                        emojiMatches,
                        { emoji: '$$r.emoji', users: { $concatArrays: ['$$r.users', [uid]] } },
                        '$$r',
                      ],
                    },
                  },
                },
                { $concatArrays: ['$reactions', [{ emoji: e, users: [uid] }]] },
              ],
            },
          ],
        },
      },
    },
    { $unset: '__had' },
  ];

  const updated = await Message.findOneAndUpdate({ _id: id, chat: chatId }, pipeline, {
    new: true,
    projection: 'reactions',
    // Mongoose 9 rejects array (aggregation-pipeline) updates unless opted in.
    updatePipeline: true,
  }).lean<{ reactions?: MessageReactionDb[] }>();
  return updated ? (updated.reactions ?? []) : null;
};

/** Re-read after a write, for the broadcast payload. */
export const findReactions = async (id: string): Promise<MessageReactionDb[]> => {
  const msg = await Message.findById(id)
    .select('reactions')
    .lean<{ reactions?: MessageReactionDb[] }>();
  return msg?.reactions ?? [];
};