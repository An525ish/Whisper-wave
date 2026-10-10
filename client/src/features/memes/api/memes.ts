import { api } from '@/shared/lib/api/client';
import type { MemeCategory, MemeFeedResponse } from '../types';

/** One shuffle batch. `page` maps to a provider id range server-side;
 * `exclude` carries already-seen provider ids so the random tail of the
 * feed pours around them instead of recycling duplicates. */
export const listMemes = (category: MemeCategory, page: number, exclude: number[] = []) =>
  api.get<MemeFeedResponse>('/memes', {
    cat: category,
    page,
    ...(exclude.length > 0 ? { exclude: exclude.join(',') } : {}),
  });

/** Saved ids for sync (members only). */
export const listSaves = () =>
  api.get<{ success: boolean; data: { ids: number[] } }>('/memes/saves');
export const saveMeme = (externalId: number) =>
  api.post<{ success: boolean }>('/memes/saves', { source: 'jokeapi', externalId });

export const unsaveMeme = (externalId: number) =>
  api.delete<{ success: boolean }>(`/memes/saves/jokeapi/${externalId}`);

/** This member's unfiltered opt-in. Members only — guests never call this. */
export const getMemeMode = () =>
  api.get<{ success: boolean; data: { unfiltered: boolean } }>('/memes/mode');

/**
 * Flip the opt-in. Enabling requires the 18+ self-declaration in the same
 * call (server-enforced); disabling needs nothing.
 */
export const setMemeMode = (unfiltered: boolean, confirmAdult = false) =>
  api.post<{ success: boolean; data: { unfiltered: boolean } }>('/memes/mode', {
    unfiltered,
    confirmAdult,
  });
