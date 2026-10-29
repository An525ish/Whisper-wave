import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose, { Types } from 'mongoose';
import { env } from '../../../config/env.js';
import { Chat } from '../../../models/chat.js';
import * as messageRepo from '../../../repositories/message.js';
import * as messageReactionRepo from '../../../repositories/messageReaction.js';
import { toggleMessageReaction } from '../reactions.js';

/**
 * Message reaction toggle, against a real MongoDB.
 *
 * Mongo is not optional here: the invariants under test live in the *queries*
 * (`arrayFilters`, `$pull` on a whole entry, `$addToSet` ordering). A stubbed
 * repository would only re-assert the branch order this file already spells out,
 * while the bug that actually bites users — an orphaned `{ emoji, users: [] }`
 * entry that renders forever — only exists in the database.
 *
 * SAFETY: every run gets its own throwaway database, named `*_test`, and drops
 * it on the way out. `env.DB_URI` is used for the server address only; the
 * database name is always overridden, so this suite can never touch a
 * developer's real data even when DB_URI points at it.
 */

const TEST_DB_NAME = 'whisperwave_test_message_reactions';

let mongoUp = false;
const SKIP_REASON = 'MongoDB unavailable — skipping integration test';

before(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Refusing to run: this suite writes to MongoDB outside NODE_ENV=test');
  }
  try {
    // Short timeout — a missing Mongo must skip the suite, not stall the run.
    await mongoose.connect(env.DB_URI, {
      dbName: TEST_DB_NAME,
      serverSelectionTimeoutMS: 1500,
    });
    mongoUp = true;
  } catch (err) {
    mongoUp = false;
    await mongoose.disconnect().catch(() => undefined);
    console.warn(
      `[test] MongoDB unavailable (${err instanceof Error ? err.message : 'unknown'}) — skipping integration tests`
    );
  }
});

after(async () => {
  if (!mongoUp) return;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

/**
 * `t.skip()` only labels the test — it does not stop the body, so throw after it
 * (same pattern as match/__tests__/redisHarness.ts `skipUnlessRedis`). Resolved at
 * run time, after `before()` has had its chance to connect.
 */
const mongoIt = (name: string, fn: () => Promise<void>): void => {
  void it(name, async (t) => {
    if (!mongoUp) {
      t.skip(SKIP_REASON);
      throw new Error(SKIP_REASON);
    }
    await fn();
  });
};

const newUserId = (): string => new Types.ObjectId().toString();

/** The two members of every seeded chat — only members may react. */
const ALICE = newUserId();
const BOB = newUserId();

/** A message in `chatId` (a chat with members ALICE and BOB) with no reactions yet. */
const seedMessage = async (chatId: Types.ObjectId): Promise<string> => {
  await Chat.create({ _id: chatId, name: 'test', creator: ALICE, members: [ALICE, BOB] });
  const record = await messageRepo.create({
    content: 'hello',
    sender: new Types.ObjectId(),
    chat: chatId,
  });
  return record._id.toString();
};

/** Read the stored entries straight back out of Mongo, un-mapped. */
const stored = async (messageId: string) =>
  (await messageReactionRepo.findReactions(messageId)).map((r) => ({
    emoji: r.emoji,
    users: r.users.map(String),
  }));

describe('toggleMessageReaction (MongoDB integration)', () => {
  mongoIt('adds, and reports the reacting user by id', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;

    const reactions = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🔥',
      userId: alice,
    });

    assert.deepEqual(reactions, [{ emoji: '🔥', users: [alice] }]);
    assert.deepEqual(await stored(messageId), [{ emoji: '🔥', users: [alice] }]);
  });

  mongoIt('toggles the same emoji back off and leaves no entry behind', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    const after = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🔥',
      userId: alice,
    });

    // An empty `{ emoji: '🔥', users: [] }` would render as a permanent bubble.
    assert.deepEqual(after, [], 'the emptied entry must be pruned, not left as an orphan');
    assert.deepEqual(await stored(messageId), []);
  });

  mongoIt('keeps other users on the emoji when one toggles off', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;
    const bob = BOB;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: bob });
    const after = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🔥',
      userId: alice,
    });

    assert.deepEqual(after, [{ emoji: '🔥', users: [bob] }]);
  });

  mongoIt('moves a user between emojis without accumulating', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    const after = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🎉',
      userId: alice,
    });

    assert.deepEqual(after, [{ emoji: '🎉', users: [alice] }]);
    assert.deepEqual(await stored(messageId), [{ emoji: '🎉', users: [alice] }]);
  });

  mongoIt('prunes the old emoji when its last user switches away', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;
    const bob = BOB;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: bob });

    // Alice leaves 🔥 (Bob stays) and joins 🎉.
    const after = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🎉',
      userId: alice,
    });

    assert.deepEqual(after, [
      { emoji: '🔥', users: [bob] },
      { emoji: '🎉', users: [alice] },
    ]);
  });

  mongoIt('lets two users hold different reactions on one message', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;
    const bob = BOB;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    const after = await toggleMessageReaction({
      messageId,
      chatId: chatId.toString(),
      emoji: '🎉',
      userId: bob,
    });

    assert.deepEqual(after, [
      { emoji: '🔥', users: [alice] },
      { emoji: '🎉', users: [bob] },
    ]);
  });

  mongoIt('does not add the same user twice to a shared emoji', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const alice = ALICE;
    const bob = BOB;

    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: alice });
    await toggleMessageReaction({ messageId, chatId: chatId.toString(), emoji: '🔥', userId: bob });
    // Bob races: his write is already in, so a concurrent re-add must be a no-op.
    await messageReactionRepo.addUserToEmoji(messageId, '🔥', bob);

    assert.deepEqual(await stored(messageId), [{ emoji: '🔥', users: [alice, bob] }]);
  });

  mongoIt('writes nothing when the message belongs to a different chat', async () => {
    const realChatId = new Types.ObjectId();
    const messageId = await seedMessage(realChatId);
    const alice = ALICE;

    // Surfacing this as an error would tell a user their own tap failed; the
    // guard exists to stop writes, not to report. Silent, and nothing broadcast.
    const result = await toggleMessageReaction({
      messageId,
      chatId: new Types.ObjectId().toString(),
      emoji: '🔥',
      userId: alice,
    });

    assert.equal(result, null, 'cross-chat ids must resolve to null so the caller stays quiet');
    assert.deepEqual(await stored(messageId), [], 'and must not have written anything');
  });

  mongoIt('rejects a user who is not a member of the chat with a 403', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);

    await assert.rejects(
      () =>
        toggleMessageReaction({
          messageId,
          chatId: chatId.toString(),
          emoji: '🔥',
          userId: newUserId(),
        }),
      (err: unknown) => (err as { statusCode?: number }).statusCode === 403
    );
    assert.deepEqual(await stored(messageId), []);
  });

  mongoIt('throws a 404 for a message that does not exist', async () => {
    await assert.rejects(
      () =>
        toggleMessageReaction({
          messageId: new Types.ObjectId().toString(),
          chatId: new Types.ObjectId().toString(),
          emoji: '🔥',
          userId: newUserId(),
        }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal((err as { statusCode?: number }).statusCode, 404);
        return true;
      }
    );
  });

  mongoIt('keeps exactly one reaction per user when the same user toggles concurrently', async () => {
    const chatId = new Types.ObjectId();
    const messageId = await seedMessage(chatId);
    const base = { messageId, chatId: chatId.toString(), userId: ALICE };

    await Promise.all([
      toggleMessageReaction({ ...base, emoji: '🔥' }),
      toggleMessageReaction({ ...base, emoji: '🎉' }),
      toggleMessageReaction({ ...base, emoji: '👍' }),
    ]);

    const entries = await stored(messageId);
    assert.equal(entries.length, 1, 'one reaction per user, no orphaned empty entries');
    assert.deepEqual(entries[0]?.users, [ALICE]);
  });
});
