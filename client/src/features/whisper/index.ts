/**
 * Whisper feature — anonymous matchmaking.
 * PUBLIC API: only what pages, the app shell and other features consume.
 */

// ── Hooks ──
export { useWhisperFlow } from './hooks/useWhisperFlow';
export { useWhisperConnectResume } from './hooks/useWhisperConnectResume';
export { useWhisperConnectionReady } from './hooks/useOpenWhisperDm';
export { useWhisperAuthIntent } from './hooks/useWhisperAuthIntent';
export { useWhisperSession } from './hooks/useWhisperSession';
export { usePendingConnectionsQuery, useRedeemClaimMutation, useCancelPendingMutation } from './hooks/usePendingConnections';
export { useWhisperQuota } from './hooks/useWhisperQuota';

// ── Components ──
export { default as VibePicker } from './components/VibePicker';
export { default as WaitingRoom } from './components/WaitingRoom';
export { default as AnonChatRoom } from './components/AnonChatRoom';
export { default as PendingGhostRows } from './components/PendingGhostRows';
export { default as WhisperSessionProvider } from './components/WhisperSessionProvider';
export { default as LiveWhisperPill } from './components/LiveWhisperPill';
export { default as WhisperConnectNotice } from './components/WhisperConnectNotice';
export { default as ConnectionOriginStrip } from './components/ConnectionOriginStrip';
