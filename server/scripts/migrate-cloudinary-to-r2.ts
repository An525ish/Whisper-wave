/**
 * migrate-cloudinary-to-r2.ts
 *
 * One-off script: fetch every Cloudinary asset stored in MongoDB and
 * re-upload it to Cloudflare R2, then update the DB record in-place.
 *
 * Run:
 *   cd server
 *   npx tsx --env-file=.env scripts/migrate-cloudinary-to-r2.ts
 *
 * Dry-run (no writes):
 *   DRY_RUN=true npx tsx --env-file=.env scripts/migrate-cloudinary-to-r2.ts
 */

import mongoose from 'mongoose';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { env } from '../src/config/env.js';
import { r2 } from '../src/config/r2.js';
import { buildDeliveryUrl } from '../src/utils/storage.js';

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH   = 1;   // sequential — avoids Cloudinary rate-limiting
const TIMEOUT = 60_000; // fetch timeout per asset (ms)

const CLOUDINARY_HOST = 'res.cloudinary.com';

// ── Minimal inline models (avoids importing the full app bootstrap) ────────────

const avatarSchema = new mongoose.Schema({ publicId: String, url: String }, { _id: false });

const User    = mongoose.models.User    ?? mongoose.model('User',    new mongoose.Schema({ avatar: avatarSchema }));
const Chat    = mongoose.models.Chat    ?? mongoose.model('Chat',    new mongoose.Schema({ avatar: avatarSchema }));
const Message = mongoose.models.Message ?? mongoose.model('Message', new mongoose.Schema({
  attachments: [{ publicId: String, url: String, name: String, fileType: String }],
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isCloudinary = (url?: string | null): boolean =>
  typeof url === 'string' && url.includes(CLOUDINARY_HOST);

const extFromMime = (mime: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm',
    'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
  };
  return map[mime] ?? mime.split('/')[1]?.split(';')[0] ?? 'bin';
};

interface MigrateResult {
  newPublicId: string;
  newUrl: string;
}

async function migrateAsset(
  cloudinaryUrl: string,
  keyPrefix: string,
): Promise<MigrateResult> {
  await sleep(500);
  const res = await fetch(cloudinaryUrl, {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${cloudinaryUrl}`);

  const mime    = res.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
  const ext     = extFromMime(mime);
  const key     = `${keyPrefix}/${uuid()}.${ext}`;
  const buffer  = Buffer.from(await res.arrayBuffer());

  if (!DRY_RUN) {
    await r2.send(new PutObjectCommand({
      Bucket:       env.R2_BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }

  return { newPublicId: key, newUrl: buildDeliveryUrl(key, mime) };
}

// ── Counters ──────────────────────────────────────────────────────────────────

const stats = { migrated: 0, skipped: 0, failed: 0 };
const failures: { collection: string; id: string; url: string; error: string }[] = [];

function log(msg: string) { process.stdout.write(msg + '\n'); }

// ── Per-collection migration ──────────────────────────────────────────────────

async function migrateUsers() {
  const docs = await User.find({ 'avatar.url': { $regex: CLOUDINARY_HOST } }).lean();
  log(`\nUsers: ${docs.length} with Cloudinary avatar`);

  for (let i = 0; i < docs.length; i += BATCH) {
    await Promise.all(
      docs.slice(i, i + BATCH).map(async (doc: any) => {
        const url = doc.avatar?.url;
        if (!isCloudinary(url)) { stats.skipped++; return; }
        try {
          const { newPublicId, newUrl } = await migrateAsset(url, 'ww/avatars');
          if (!DRY_RUN) {
            await User.updateOne(
              { _id: doc._id },
              { $set: { 'avatar.publicId': newPublicId, 'avatar.url': newUrl } },
            );
          }
          log(`  ✓ User ${doc._id}  →  ${newUrl}`);
          stats.migrated++;
        } catch (err: any) {
          log(`  ✗ User ${doc._id}  ${err.message} (skipped — DB unchanged)`);
          failures.push({ collection: 'users', id: String(doc._id), url, error: err.message });
          stats.failed++;
        }
      }),
    );
  }
}

async function migrateChats() {
  const docs = await Chat.find({ 'avatar.url': { $regex: CLOUDINARY_HOST } }).lean();
  log(`\nChats: ${docs.length} with Cloudinary avatar`);

  for (let i = 0; i < docs.length; i += BATCH) {
    await Promise.all(
      docs.slice(i, i + BATCH).map(async (doc: any) => {
        const url = doc.avatar?.url;
        if (!isCloudinary(url)) { stats.skipped++; return; }
        try {
          const { newPublicId, newUrl } = await migrateAsset(url, 'ww/avatars');
          if (!DRY_RUN) {
            await Chat.updateOne(
              { _id: doc._id },
              { $set: { 'avatar.publicId': newPublicId, 'avatar.url': newUrl } },
            );
          }
          log(`  ✓ Chat ${doc._id}  →  ${newUrl}`);
          stats.migrated++;
        } catch (err: any) {
          log(`  ✗ Chat ${doc._id}  ${err.message} (skipped — DB unchanged)`);
          failures.push({ collection: 'chats', id: String(doc._id), url, error: err.message });
          stats.failed++;
        }
      }),
    );
  }
}

async function migrateMessages() {
  const docs = await Message.find({
    'attachments.url': { $regex: CLOUDINARY_HOST },
  }).lean();
  log(`\nMessages: ${docs.length} with Cloudinary attachment(s)`);

  for (let i = 0; i < docs.length; i += BATCH) {
    await Promise.all(
      docs.slice(i, i + BATCH).map(async (doc: any) => {
        const updates: Record<string, string> = {};
        let changed = false;

        for (let j = 0; j < (doc.attachments ?? []).length; j++) {
          const att = doc.attachments[j];
          if (!isCloudinary(att?.url)) continue;
          try {
            const { newPublicId, newUrl } = await migrateAsset(att.url, 'ww/attachments');
            updates[`attachments.${j}.publicId`] = newPublicId;
            updates[`attachments.${j}.url`]      = newUrl;
            log(`  ✓ Message ${doc._id} attachment[${j}]  →  ${newUrl}`);
            stats.migrated++;
            changed = true;
          } catch (err: any) {
            log(`  ✗ Message ${doc._id} attachment[${j}]  ${err.message}`);
            failures.push({ collection: 'messages', id: String(doc._id), url: att.url, error: err.message });
            stats.failed++;
          }
        }

        if (changed && !DRY_RUN) {
          await Message.updateOne({ _id: doc._id }, { $set: updates });
        }
      }),
    );
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${'='.repeat(60)}`);
  log(`Cloudinary → R2 Migration  ${DRY_RUN ? '[DRY RUN — no writes]' : '[LIVE]'}`);
  log('='.repeat(60));

  await mongoose.connect(env.DB_URI, { dbName: 'WhisperWave' });
  log('Connected to MongoDB');

  await migrateUsers();
  await migrateChats();
  await migrateMessages();

  await mongoose.disconnect();

  log(`\n${'='.repeat(60)}`);
  log(`Done.  migrated=${stats.migrated}  skipped=${stats.skipped}  failed=${stats.failed}`);

  if (failures.length > 0) {
    log('\nFailed assets:');
    for (const f of failures) {
      log(`  [${f.collection}] ${f.id}  ${f.url}`);
      log(`    → ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
