/**
 * Whisper feature — anonymous matchmaking.
 * PUBLIC API: the only surface other slices may import. Everything here is
 * deliberately explicit; internal helpers and unexported components stay inside.
 */

// ── Hooks ──
export { useAnonSocket } from './hooks/useAnonSocket';
export { useAnonChat } from './hooks/useAnonChat';
export { useConnectionOrigin } from './hooks/useConnectionOrigin';
export { useReportMutation } from './hooks/useReportMutation';
export {
  useJoinQueueMutation,
  useLeaveQueueMutation,
} from './hooks/useMatchQueueMutations';
export { useWhisperFlow, useWhisperConnectResume } from './hooks/useWhisperFlow';
export type { AnonSocketRef } from './hooks/useAnonSocketLifecycle';

// ── Components (consumed by pages/Whisper.tsx + other features) ──
export { default as VibePicker } from './components/VibePicker';
export { default as WaitingRoom } from './components/WaitingRoom';
export { default as AnonChatRoom } from './components/AnonChatRoom';
export { default as Icebreakers } from './components/Icebreakers';
export { default as ThreadSummaryCard } from './components/ThreadSummaryCard';
export { default as WhisperConnectNotice } from './components/WhisperConnectNotice';
export { default as ConnectionOriginStrip } from './components/ConnectionOriginStrip';
export { whisperAuthCopy } from './utils/whisperAuthCopy';
export { aliasFirstName } from './utils/alias';
export { ICEBREAKERS, pickIcebreaker } from './utils/icebreakers';
export { deriveThreadSummary, formatThreadDuration } from './utils/threadSummary';
export {
  MAX_WHISPER_HISTORY,
  appendWhisperHistory,
  clearWhisperHistory,
  formatWhisperHistoryEntry,
  readWhisperHistory,
} from './utils/whisperHistory';

// ── Store ──
export { useAnonStore } from './stores/anonStore';

// ── Constants + utils used by other features ──
export {
  ALL_VIBE_TAGS,
  MAX_TAGS,
  MAX_MESSAGE_LENGTH,
  WHISPER_CONNECT_TOKEN_KEY,
} from './constants';
export { vibeTagLabel } from './utils/vibeTag';

// ── Types ──
export type {
  VibeTag,
  Gender,
  AnonMatchStatus,
  AnonMessage,
  DeliveryState,
  JoinQueuePayload,
  JoinQueueResponse,
  ReportReason,
  SubmitReportPayload,
  CompleteConnectionResponse,
  ConnectionOrigin,
} from './types';
export type { Icebreaker } from './utils/icebreakers';
export type { ThreadSummary } from './utils/threadSummary';
export type { WhisperHistoryEntry } from './utils/whisperHistory';
