import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { WHISPER_CONNECT_INTENT, WHISPER_CONNECT_TOKEN_KEY } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { readAliases } from '../utils/connectToken';
import { whisperAuthCopy } from '../utils/whisperAuthCopy';

/** True when the router state says we arrived from the mutual-vibe reveal flow. */
const isWhisperConnectState = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  'intent' in state &&
  state.intent === WHISPER_CONNECT_INTENT;

/**
 * Everything the auth screen needs to know about a whisper-connect arrival: the
 * flag, the headline copy, and the two aliases. Live store values win over the
 * stashed token, because they reflect what the user actually matched as.
 */
export function useWhisperAuthIntent() {
  const active = isWhisperConnectState(useLocation().state);
  const storeAlias = useAnonStore((s) => s.displayName);
  const partnerAlias = useAnonStore((s) => s.partnerName);
  // Read once on mount — storage is an external system, not a render input.
  const [tokenAliases] = useState(() =>
    readAliases(sessionStorage.getItem(WHISPER_CONNECT_TOKEN_KEY))
  );

  const self = storeAlias || tokenAliases?.self;
  const them = partnerAlias || tokenAliases?.partner;

  return {
    active,
    copy: whisperAuthCopy(active, self, them),
    names: active && self && them ? { self, them } : null,
  };
}
