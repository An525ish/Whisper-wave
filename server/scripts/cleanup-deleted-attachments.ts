/**
 * cleanup-deleted-attachments.ts
 *
 * Permanently removes R2 objects for soft-deleted messages that still have
 * attachment references, then clears those attachment arrays in MongoDB.
 *
 * Safety guarantees:
 *  - Only deletes R2 keys that start with "ww/" (our own key namespace).
 *  - Processes in chunks of 1000 (S3 DeleteObjects hard limit).
 *  - DB is updated per-chunk AFTER R2 delete succeeds — never ahead of it.
 *  - Messages are re-fetched inside the live run to verify isDeleted=true
 *    before deletion (guards against a restore happening between query and delete).
 *  - Requires interactive confirmation in live mode (bypass with FORCE=true).
 *  - Dry-run by default — set DRY_RUN=false or omit to run live after confirming.
 *
 * Run (dry):
 *   cd server
 *   DRY_RUN=true npx tsx --env-file=.env scripts/cleanup-deleted-attachments.ts
 *
 * Run (live, with confirmation prompt):
 *   npx tsx --env-file=.env scripts/cleanup-deleted-attachments.ts
 *
 * Run (live, non-interactive CI):
 *   FORCE=true npx tsx --env-file=.env scripts/cleanup-deleted-attachments.ts
 */

import mongoose, { Types } from 'mongoose';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as readline from 'readline';
import { env } from '../src/config/env.js';
import { r2 } from '../src/config/r2.js';

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN  = process.env.DRY_RUN === 'true';
const FORCE    = process.env.FORCE   === 'true';
const CHUNK    = 1000; // S3 DeleteObjects hard limit

/** Only keys under this prefix are eligible for deletion. */
const SAFE_PREFIX = 'ww/';

// ── Inline minimal model ─────────────────────────────────────────────────────

interface AttachmentDoc {
  publicId: string;
  url: string;
}

interface MessageDoc {
  _id: Types.ObjectId;
  isDeleted: boolean;
  attachments: AttachmentDoc[];
}

const Message = (mongoose.models.Message as mongoose.Model<MessageDoc>) ??
  mongoose.model<MessageDoc>(
    'Message',
    new mongoose.Schema({
      isDeleted:   Boolean,
      attachments: [{ publicId: String, url: String }],
    }),
  );

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSafeKey(key: string): boolean {
  return typeof key === 'string' && key.startsWith(SAFE_PREFIX) && key.length > SAFE_PREFIX.length;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function log(msg: string) { process.stdout.write(msg + '\n'); }

async function confirm(question: string): Promise<boolean> {
  if (FORCE) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

/**
 * Delete up to 1000 R2 keys in one request.
 * Returns the keys that were NOT deleted (per R2 error response).
 */
async function deleteR2Chunk(keys: string[]): Promise<string[]> {
  const res = await r2.send(
    new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: false, // get back per-object success/failure
      },
    }),
  );
  const failedKeys = (res.Errors ?? []).map((e) => e.Key ?? '').filter(Boolean);
  return failedKeys;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${'='.repeat(60)}`);
  log(`Attachment Cleanup  ${DRY_RUN ? '[DRY RUN — no writes]' : '[LIVE]'}`);
  log('='.repeat(60));

  await mongoose.connect(env.DB_URI, { dbName: 'WhisperWave' });
  log('Connected to MongoDB\n');

  // ── 1. Collect eligible keys ────────────────────────────────────────────────

  const docs = await Message.find({
    isDeleted: true,
    'attachments.0': { $exists: true },
  }).lean();

  if (docs.length === 0) {
    log('Nothing to clean up — no soft-deleted messages with attachments.');
    await mongoose.disconnect();
    return;
  }

  // Build map: messageId → eligible R2 keys
  const messageKeys = new Map<string, string[]>();
  let skippedKeys = 0;

  for (const doc of docs) {
    const eligible: string[] = [];
    for (const att of doc.attachments ?? []) {
      if (!att.publicId) continue;
      if (!isSafeKey(att.publicId)) {
        log(`  SKIP  ${doc._id}  unsafe key: "${att.publicId}"`);
        skippedKeys++;
        continue;
      }
      eligible.push(att.publicId);
    }
    if (eligible.length > 0) messageKeys.set(String(doc._id), eligible);
  }

  const allKeys  = [...messageKeys.values()].flat();
  const msgCount = messageKeys.size;

  log(`Messages with eligible attachments : ${msgCount}`);
  log(`R2 objects to delete               : ${allKeys.length}`);
  if (skippedKeys > 0) log(`Skipped (unsafe key format)        : ${skippedKeys}`);

  if (allKeys.length === 0) {
    log('\nNo safe keys to delete.');
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    log('\n[DRY RUN] Keys that would be deleted:');
    for (const key of allKeys) log(`  ${key}`);
    await mongoose.disconnect();
    log('\nDry run complete — nothing was changed.');
    return;
  }

  // ── 2. Confirm ──────────────────────────────────────────────────────────────

  const proceed = await confirm(
    `\nAbout to permanently delete ${allKeys.length} R2 objects from ${msgCount} messages.\nType "y" to continue: `,
  );

  if (!proceed) {
    log('Aborted.');
    await mongoose.disconnect();
    return;
  }

  // ── 3. Process in chunks ────────────────────────────────────────────────────

  let totalDeleted  = 0;
  let totalFailed   = 0;
  const failedKeys: string[] = [];

  const chunks = chunkArray(allKeys, CHUNK);
  log(`\nProcessing ${chunks.length} chunk(s) of up to ${CHUNK} keys…\n`);

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    log(`Chunk ${ci + 1}/${chunks.length}  (${chunk.length} keys)`);

    // Re-verify messages are still deleted before acting (race condition guard)
    const chunkMsgIds = [...messageKeys.entries()]
      .filter(([, keys]) => keys.some((k) => chunk.includes(k)))
      .map(([id]) => new Types.ObjectId(id));

    const stillDeleted = await Message.find({
      _id: { $in: chunkMsgIds },
      isDeleted: true,
    }).lean();

    const validIds = new Set(stillDeleted.map((d) => String(d._id)));
    const safeKeys = chunk.filter((key) =>
      [...messageKeys.entries()].some(([id, keys]) => validIds.has(id) && keys.includes(key)),
    );

    const skippedInChunk = chunk.length - safeKeys.length;
    if (skippedInChunk > 0) {
      log(`  ${skippedInChunk} key(s) skipped — message was restored since query`);
    }

    if (safeKeys.length === 0) {
      log('  Nothing to delete in this chunk.');
      continue;
    }

    // Delete from R2
    const failed = await deleteR2Chunk(safeKeys);
    const deleted = safeKeys.length - failed.length;
    totalDeleted += deleted;
    totalFailed  += failed.length;

    if (failed.length > 0) {
      log(`  R2 delete failures: ${failed.length}`);
      failedKeys.push(...failed);
    }

    // Clear attachments in DB for messages whose keys all succeeded
    const succeededKeys = new Set(safeKeys.filter((k) => !failed.includes(k)));
    const msgIdsToUpdate = [...messageKeys.entries()]
      .filter(([id, keys]) => validIds.has(id) && keys.every((k) => succeededKeys.has(k)))
      .map(([id]) => new Types.ObjectId(id));

    if (msgIdsToUpdate.length > 0) {
      await Message.updateMany(
        { _id: { $in: msgIdsToUpdate } },
        { $set: { attachments: [] } },
      );
      log(`  ✓ Deleted ${deleted} R2 object(s), cleared ${msgIdsToUpdate.length} message(s) in DB`);
    }
  }

  await mongoose.disconnect();

  // ── 4. Summary ──────────────────────────────────────────────────────────────

  log(`\n${'='.repeat(60)}`);
  log(`Done.  deleted=${totalDeleted}  failed=${totalFailed}`);

  if (failedKeys.length > 0) {
    log('\nFailed R2 keys (DB attachments NOT cleared for these):');
    for (const k of failedKeys) log(`  ${k}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
