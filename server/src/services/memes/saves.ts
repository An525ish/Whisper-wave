import * as memeSaveRepo from '../../repositories/memeSave.js';
import type { MemeBlockSource } from '../../types/memeBlock.js';

/** Member save sync — thin pass-through so controllers never touch repositories. */
export const listSavedIds = (userId: string, source: MemeBlockSource): Promise<number[]> =>
  memeSaveRepo.listSavedIds(userId, source);

export const saveMeme = (userId: string, source: MemeBlockSource, externalId: number): Promise<void> =>
  memeSaveRepo.save({ userId, source, externalId });

export const unsaveMeme = (
  userId: string,
  source: MemeBlockSource,
  externalId: number
): Promise<boolean> => memeSaveRepo.unsave({ userId, source, externalId });
