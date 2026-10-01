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
export { default as WhisperConnectNotice } from './components/WhisperConnectNotice';
export { default as ConnectionOriginStrip } from './components/ConnectionOriginStrip';
export { whisperAuthCopy } from './utils/whisperAuthCopy';

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
