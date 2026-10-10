import { createContext, useContext } from 'react';
import type { WhisperSession } from '../types';

export const WhisperSessionContext =
  createContext<WhisperSession | null>(null);

/** Session access for screens under `WhisperSessionProvider`. */
export function useWhisperSession(): WhisperSession {
  const ctx = useContext(WhisperSessionContext);
  if (!ctx) {
    throw new Error('useWhisperSession must be used within WhisperSessionProvider');
  }
  return ctx;
}
