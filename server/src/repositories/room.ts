import type { Types } from 'mongoose';
import { Room } from '../models/room.js';
import { ROOM_CAP_HARD, ROOM_CAP_SOFT } from '../constants/rooms.js';
import type { IRoomFields } from '../types/room.js';

type RoomLean = IRoomFields & { _id: Types.ObjectId };

/** Templates visible in the lobby: official rooms plus approved public ones. */
export const listLobby = async (): Promise<RoomLean[]> =>
  Room.find({ visibility: { $in: ['official', 'public'] } })
    .sort({ official: -1, title: 1 })
    .lean<RoomLean[]>();

/** Every template, any visibility — the admin approval queue reads this. */
export const listAll = async (): Promise<RoomLean[]> =>
  Room.find({}).sort({ official: -1, title: 1 }).lean<RoomLean[]>();

export const findBySlug = async (slug: string): Promise<RoomLean | null> =>
  Room.findOne({ slug: slug.toLowerCase() }).lean<RoomLean>();

export const create = async (params: {
  slug: string;
  title: string;
  description: string;
  rules?: string[];
  lang?: string;
  official?: boolean;
  hours?: IRoomFields['hours'];
  capSoft?: number;
  capHard?: number;
  createdBy?: Types.ObjectId | string | null;
  mods?: Array<Types.ObjectId | string>;
  visibility: IRoomFields['visibility'];
}): Promise<RoomLean> => {
  const doc = await Room.create({
    slug: params.slug.toLowerCase(),
    title: params.title,
    description: params.description,
    rules: params.rules ?? [],
    lang: params.lang ?? 'en',
    official: params.official ?? false,
    hours: params.hours ?? null,
    capSoft: params.capSoft ?? ROOM_CAP_SOFT,
    capHard: params.capHard ?? ROOM_CAP_HARD,
    createdBy: params.createdBy ?? null,
    mods: params.mods ?? [],
    visibility: params.visibility,
  });
  return doc.toObject() as unknown as RoomLean;
};

/** Official-room seeding and admin edits share this: slug is the identity. */
export const upsertBySlug = async (
  params: Parameters<typeof create>[0] & { official: boolean; mods?: string[] }
): Promise<RoomLean> => {
  const doc = await Room.findOneAndUpdate(
    { slug: params.slug.toLowerCase() },
    {
      $set: {
        title: params.title,
        description: params.description,
        rules: params.rules ?? [],
        lang: params.lang ?? 'en',
        official: params.official,
        hours: params.hours ?? null,
        capSoft: params.capSoft ?? ROOM_CAP_SOFT,
        capHard: params.capHard ?? ROOM_CAP_HARD,
        visibility: params.visibility,
        // Mods only move when explicitly passed — reseeds must never wipe them.
        ...(params.mods !== undefined ? { mods: params.mods } : {}),
      },
      $setOnInsert: { slug: params.slug.toLowerCase(), createdBy: params.createdBy ?? null },
    },
    { upsert: true, new: true }
  ).lean<RoomLean>();
  if (!doc) throw new Error('Room upsert returned no document');
  return doc;
};

export const setVisibility = async (
  slug: string,
  visibility: IRoomFields['visibility']
): Promise<boolean> => {
  const res = await Room.updateOne({ slug: slug.toLowerCase() }, { $set: { visibility } });
  return res.modifiedCount > 0;
};

/** Host content edit — never touches slug, caps, type or visibility. */
export const updateContent = async (
  slug: string,
  content: { title: string; description: string; rules: string[] }
): Promise<boolean> => {
  const res = await Room.updateOne({ slug: slug.toLowerCase() }, { $set: content });
  return res.modifiedCount > 0;
};

/**
 * Host requests lobby listing. Unlisted rooms only, one open request at a
 * time (re-requesting refreshes the timestamp). The admin queue reads this.
 */
export const requestListing = async (slug: string): Promise<boolean> => {
  const res = await Room.updateOne(
    { slug: slug.toLowerCase(), visibility: 'unlisted' },
    { $set: { listingRequestedAt: new Date() } }
  );
  return res.modifiedCount > 0;
};

export const deleteBySlug = async (slug: string): Promise<boolean> => {
  const res = await Room.deleteOne({ slug: slug.toLowerCase() });
  return res.deletedCount > 0;
};

/** Clear a consumed listing request (approval path). */
export const clearListingRequest = async (slug: string): Promise<void> => {
  await Room.updateOne({ slug: slug.toLowerCase() }, { $unset: { listingRequestedAt: '' } });
};
