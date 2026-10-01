import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AnonChatHeader from './AnonChatHeader';
import AnonMessageList from './AnonMessageList';
import AnonComposer from './AnonComposer';
import PartnerLeftPrompt from './PartnerLeftPrompt';
import MutualVibeModal from './MutualVibeModal';
import ReportSheet from './ReportSheet';
import {
  VibePrompt,
  VibeNudge,
  VibeWaiting,
  MutualBar,
  ChatAlert,
} from './VibePrompts';
import { useVibeUnlock } from '../hooks/useVibeUnlock';
import { useScrollToBottom } from '../hooks/useScrollToBottom';
import { MAX_MESSAGE_LENGTH } from '../constants';
import type { AnonMessage, VibeTag } from '../types';

import './anonChatRoom.css';
import './anonChatRoomMessages.css';
import './anonChatRoomControls.css';
import './anonChatRoomPrompts.css';

type Props = {
  myName: string;
  partnerName: string;
  partnerTags: VibeTag[];
  messages: AnonMessage[];
  draft: string;
  partnerTyping: boolean;
  likeSent: boolean;
  mutualLike: boolean;
  partnerVibed: boolean;
  connectToken: string | null;
  showMutualModal: boolean;
  matchedAt: number | null;
  sessionId: string | null;
  socketConnected: boolean;
  sessionNotice: string | null;
  error: string | null;
  /** Partner left: the composer is replaced by the find-someone prompt. */
  partnerLeft: boolean;
  partnerLeftPromptExpanded: boolean;
  onFindSomeoneNew: () => void;
  onStayOnEndedThread: () => void;
  onDraftChange: (value: string) => void;
  onSend: (content: string) => void;
  onLike: () => void;
  onNext: () => void;
  onClearDraft: () => void;
  onRetry: (id: string) => void;
  onCloseMutualModal: () => void;
  onOpenMutualModal: () => void;
  onDismissError: () => void;
};

const likeTitle = (
  vibeUnlocked: boolean,
  likeSent: boolean,
  mutualLike: boolean
): string => {
  if (mutualLike) return 'It’s a vibe — open a DM';
  if (likeSent) return 'Vibe sent — waiting for them';
  return vibeUnlocked
    ? 'Send a vibe'
    : 'Chat a little longer to unlock vibes';
};

/**
 * The anonymous chat surface.
 *
 * Pure composition: every decision (unlock gate, autosize, scroll, delivery
 * state) lives in a hook or util, so this file reads as a description of the UI.
 */
export default function AnonChatRoom({
  myName,
  partnerName,
  partnerTags,
  messages,
  draft,
  partnerTyping,
  likeSent,
  mutualLike,
  partnerVibed,
  connectToken,
  showMutualModal,
  matchedAt,
  sessionId,
  socketConnected,
  sessionNotice,
  error,
  onDraftChange,
  onSend,
  onLike,
  onNext,
  onClearDraft,
  onRetry,
  onCloseMutualModal,
  onOpenMutualModal,
  onDismissError,
  partnerLeft,
  partnerLeftPromptExpanded,
  onFindSomeoneNew,
  onStayOnEndedThread,
}: Props) {
  const { vibeUnlocked, showVibePrompt } = useVibeUnlock(messages, matchedAt, {
    likeSent,
    mutualLike,
    partnerVibed,
    ended: partnerLeft,
  });

  // Local, dismissible mirrors. The underlying facts (partner liked, prompt
  // eligibility) stay in the store; these only control what is on screen. The
  // header heart stays enabled regardless, so dismissing the one-shot prompt
  // can never trap a user who changes their mind.
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Reset per match via the render-time comparison pattern — a new match must
  // clear the previous one's dismissals without a cascading render.
  const [dismissedFor, setDismissedFor] = useState(partnerName);
  if (dismissedFor !== partnerName) {
    setDismissedFor(partnerName);
    setNudgeDismissed(false);
    setPromptDismissed(false);
  }

  const reconnecting = Boolean(sessionNotice?.toLowerCase().includes('reconnect'));
  const socketDegraded = reconnecting || !socketConnected;
  const overLimit = draft.length > MAX_MESSAGE_LENGTH;
  // `onLike` guards the gate itself and reports why, so keep the button
  // enabled pre-unlock — a control that explains itself beats one that refuses.
  const likeDisabled = likeSent || mutualLike;

  const bottomRef = useScrollToBottom(`${messages.length}:${partnerTyping}`);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || overLimit) return;
    onSend(text);
    onClearDraft();
  };

  return (
    <div className="acr-root">
      <Helmet>
        <title>{`Whispering with ${partnerName} · Whisper Wave`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="acr-ambience" aria-hidden>
        <div className="acr-ambience__glow acr-ambience__glow--a" />
        <div className="acr-ambience__glow acr-ambience__glow--b" />
        <div className="acr-ambience__grain" />
        <div className="acr-ambience__vignette" />
      </div>

      <AnonChatHeader
        partnerName={partnerName}
        partnerTags={partnerTags}
        socketDegraded={socketDegraded}
        sessionNotice={sessionNotice}
        likeDisabled={likeDisabled}
        likeSent={likeSent}
        mutualLike={mutualLike}
        partnerVibed={partnerVibed}
        vibeUnlocked={vibeUnlocked}
        likeTitle={likeTitle(vibeUnlocked, likeSent, mutualLike)}
        onLike={onLike}
        onNext={onNext}
        onReport={() => setReportOpen(true)}
      />

      <main className="acr-scroll">
        {/* Transient "why can't I like yet" style notices get their own compact
            row; persistent socket errors use the alert. */}
        {sessionNotice && !reconnecting && (
          <p className="acr-hint" role="status">
            {sessionNotice}
          </p>
        )}
        {error && <ChatAlert message={error} onDismiss={onDismissError} />}
        <AnonMessageList
          myName={myName}
          partnerName={partnerName}
          messages={messages}
          partnerTyping={partnerTyping}
          onRetry={onRetry}
          bottomRef={bottomRef}
        />
      </main>

      {/* The one-shot prompt. Once dismissed the header heart is the only
          path to liking — which is deliberate, so a "not really" is never
          permanent. */}
      {showVibePrompt && !promptDismissed && (
        <VibePrompt
          partnerName={partnerName}
          onLike={onLike}
          onDismiss={() => setPromptDismissed(true)}
        />
      )}

      {vibeUnlocked && partnerVibed && !likeSent && !mutualLike && !nudgeDismissed && (
        <VibeNudge
          partnerName={partnerName}
          onLike={onLike}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {likeSent && !mutualLike && <VibeWaiting />}

      {mutualLike && !showMutualModal && connectToken && (
        <MutualBar onOpen={onOpenMutualModal} />
      )}

      {partnerLeft ? (
        <PartnerLeftPrompt
          expanded={partnerLeftPromptExpanded}
          partnerName={partnerName}
          onFindSomeoneNew={onFindSomeoneNew}
          onStay={onStayOnEndedThread}
        />
      ) : (
        <AnonComposer
          draft={draft}
          overLimit={overLimit}
          onDraftChange={onDraftChange}
          onSend={handleSend}
        />
      )}

      {connectToken && (
        <MutualVibeModal
          open={showMutualModal}
          myName={myName}
          partnerName={partnerName}
          partnerTags={partnerTags}
          connectToken={connectToken}
          onClose={onCloseMutualModal}
        />
      )}

      <ReportSheet
        open={reportOpen}
        sessionId={sessionId}
        onClose={() => setReportOpen(false)}
        onReported={onNext}
      />
    </div>
  );
}
