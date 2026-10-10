/**
 * seed-rooms.ts
 *
 * Upserts the official room templates. Idempotent — safe to run on every
 * deploy (slug is the identity; copy updates, instances are untouched since
 * those live only in process memory).
 *
 * The four launch rooms (D4): three always-open, one night-only. Room hours
 * turn the empty-room problem into an event: a closed room shows its hours
 * and a reminder instead of an empty thread.
 *
 * Run:
 *   cd server
 *   npx tsx --env-file=.env scripts/seed-rooms.ts
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDb } from '../src/config/db.js';
import { upsertBySlug } from '../src/repositories/room.js';

const OFFICIAL_ROOMS = [
  {
    slug: 'late-night',
    title: 'Late Night',
    description: 'Insomniacs and deep talks. Quieter, slower, more honest after midnight.',
    rules: ['Be kind — people come here raw.', 'No links.', '18+ only.', 'Listen more than you advise.'],
    lang: 'en',
    official: true as const,
    hours: { days: [0, 1, 2, 3, 4, 5, 6], start: '22:00', end: '03:00', tz: 'Asia/Kolkata' },
    visibility: 'official' as const,
  },
  {
    slug: 'venting',
    title: 'Venting',
    description: 'A listening room. Get it out — no fixing, no judging.',
    rules: [
      'Listening only — no unsolicited advice.',
      'No links, no DMs solicitation.',
      '18+ only.',
      'This is not a crisis service. If you may act on your thoughts, contact a local helpline now.',
    ],
    lang: 'en',
    official: true as const,
    hours: null,
    visibility: 'official' as const,
  },
  {
    slug: 'gaming',
    title: 'Gaming',
    description: 'LFG, banter and post-match breakdowns.',
    rules: ['No links (clips go in chat later).', 'Trash talk the play, not the player.', '18+ only.'],
    lang: 'en',
    official: true as const,
    hours: null,
    visibility: 'official' as const,
  },
  {
    slug: 'hinglish-chill',
    title: 'Hinglish Chill',
    description: 'Casual Hindi-English adda. Sab chalega.',
    rules: ['Hindi, English, Hinglish — all fine.', 'No links.', '18+ only.', 'Respect the vibe.'],
    lang: 'hinglish',
    official: true as const,
    hours: null,
    visibility: 'official' as const,
  },
];

const main = async (): Promise<void> => {
  if (env.NODE_ENV === 'test') {
    throw new Error('REFUSING to seed outside dev/production — check your env file');
  }
  if (env.DB_URI.includes('mongodb+srv') && process.env.FORCE !== 'true') {
    throw new Error(
      'REFUSING to seed a hosted cluster without FORCE=true — point DB_URI at a local Mongo or pass FORCE=true'
    );
  }
  await connectDb();
  for (const room of OFFICIAL_ROOMS) {
    const saved = await upsertBySlug(room);
    console.log(`upserted room: ${saved.slug} (${saved.visibility})`);
  }
  await mongoose.connection.close();
  process.exit(0);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
