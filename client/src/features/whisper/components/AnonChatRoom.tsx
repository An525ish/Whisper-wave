import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AnonChatHeader from './AnonChatHeader';
import AnonMessageList from './AnonMessageList';
import AnonComposer from './AnonComposer';
import AnonProfileShell from './AnonProfileShell';
import ChatAlert from './ChatAlert';
import LeaveConfirm from './LeaveConfirm';
import MutualBar from './MutualBar';
import MutualVibeModal from './MutualVibeModal';
import ReportSheet from './ReportSheet';
import ThreadEndedBar from './ThreadEndedBar';
import ThreadSummaryCard from './ThreadSummaryCard';
import VibeNudge from './VibeNudge';
import VibePrompt from './VibePrompt';
import VibeWaiting from './VibeWaiting';
import { useChannelSignals } from '../hooks/useChannelSignals';
import { useThreadEnd } from '../hooks/useThreadEnd';
import { useVibeUnlock } from '../hooks/useVibeUnlock';
import { ANON_COMPOSER_ID, FRESH_THREAD_MESSAGES, MAX_MESSAGE_LENGTH } from '../constants';
import type {
  AnonMessage,
  AnonReaction,
  LeaveConfirmKind,
  VibeTag,
} from '../types';

import './anonChatRoom.css';
import './anonChatRoomHeader.css';
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
  mutualAt: number | null;
  showMutualModal: boolean;
  matchedAt: number | null;
  sessionId: string | null;
  socketConnected: boolean;
  reconnecting: boolean;
  error: string | null;
  /** Partner left: the composer is replaced by the thread-ended card. */
  partnerLeft: boolean;
  /** "Stay and re-read it" was chosen — the card is collapsed to a bar. */
  partnerLeftDismissed: boolean;
  /** A leave/skip confirmation is open (Back button or the chevron). */
  confirmKind: LeaveConfirmKind | null;
  onResolveConfirm: (accept: boolean) => void;
  onRequestSkip: () => void;
  onFindSomeoneNew: () => void;
  onStayOnEndedThread: () => void;
  onReact: (messageId: string, reaction: AnonReaction) => void;
  onDraftChange: (value: string) => void;
  onSend: (content: string) => void;
  onLike: () => void;
  /** A report succeeded — end this match and move on. */
  onReported: () => void;
  /** The connect window closed — end the match and return to the picker. */
  onLeaveAfterExpiry: () => void;
  onClearDraft: () => void;
  onRetry: (id: string) => void;
  onCloseMutualModal: () => void;
  onOpenMutualModal: () => void;
  onDismissError: () => void;
};

const likeTitle = (
  vibeUnlocked: boolean,
  likeSent: boolean,
  mutualLike: boolean,
  progress: number
): string => {
  if (mutualLike) return 'It’s a vibe — open a DM';
  if (likeSent) return 'Vibe sent — waiting for them';
  return vibeUnlocked
    ? 'Send a vibe'
    : `Vibes unlock as you chat — ${Math.round(progress * 100)}%`;
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
  mutualAt,
  showMutualModal,
  matchedAt,
  sessionId,
  socketConnected,
  reconnecting,
  error,
  partnerLeft,
  partnerLeftDismissed,
  confirmKind,
  onResolveConfirm,
  onRequestSkip,
  onFindSomeoneNew,
  onStayOnEndedThread,
  onReact,
  onDraftChange,
  onSend,
  onLike,
  onReported,
  onLeaveAfterExpiry,
  onClearDraft,
  onRetry,
  onCloseMutualModal,
  onOpenMutualModal,
  onDismissError,
}: Props) {
  const { vibeUnlocked, vibeProgress, showVibePrompt } = useVibeUnlock(messages, matchedAt, {
    likeSent,
    mutualLike,
    partnerVibed,
    ended: partnerLeft,
  });

  const { summary } = useThreadEnd(matchedAt);
  const { sparks, sharedTags } = useChannelSignals();

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

  const scrollRef = useRef<HTMLElement>(null);
  const socketDegraded = reconnecting || !socketConnected;
  const overLimit = draft.length > MAX_MESSAGE_LENGTH;
  // `onLike` guards the gate itself and reports why, so keep the button
  // enabled pre-unlock — a control that explains itself beats one that refuses.
  const likeDisabled = likeSent || mutualLike || partnerLeft;

  const handleSend = () => {
    const text = draft.trim();
    if (!text || overLimit || socketDegraded) return;
    onSend(text);
    onClearDraft();
  };

  // A spark only fills the composer — it never sends, so the words still go out as
  // the user's own after they've had a chance to change them.
  const handlePickSpark = (text: string) => {
    onDraftChange(text);
    document.getElementById(ANON_COMPOSER_ID)?.focus();
  };

  return (
    <AnonProfileShell
      partnerTyping={partnerTyping}
      partnerLeft={partnerLeft}
      onPickSpark={handlePickSpark}
    >
      <Helmet>
        <title>{`Whispering with ${partnerName} · Whisper Wave`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="acr-root">
        <AnonChatHeader
          partnerName={partnerName}
          partnerTags={partnerTags}
          partnerTyping={partnerTyping}
          socketDegraded={socketDegraded}
          reconnecting={reconnecting}
          likeDisabled={likeDisabled}
          likeSent={likeSent}
          mutualLike={mutualLike}
          partnerVibed={partnerVibed}
          vibeUnlocked={vibeUnlocked}
          vibeProgress={vibeProgress}
          likeTitle={likeTitle(vibeUnlocked, likeSent, mutualLike, vibeProgress)}
          onLike={onLike}
          onSkip={onRequestSkip}
          onReport={() => setReportOpen(true)}
        />

        <main className="acr-scroll" ref={scrollRef}>
          <AnonMessageList
            myName={myName}
            partnerName={partnerName}
            messages={messages}
            partnerTyping={partnerTyping}
            startedAt={matchedAt}
            live={!partnerLeft}
            sharedTags={sharedTags}
            sparks={sparks}
            scrollRef={scrollRef}
            onPickSpark={handlePickSpark}
            onRetry={onRetry}
            onReact={onReact}
          />
          {error && <ChatAlert message={error} onDismiss={onDismissError} />}
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

        {vibeUnlocked && !partnerLeft && partnerVibed && !likeSent && !mutualLike && !nudgeDismissed && (
          <VibeNudge
            partnerName={partnerName}
            onLike={onLike}
            onDismiss={() => setNudgeDismissed(true)}
          />
        )}

        {likeSent && !mutualLike && !partnerLeft && <VibeWaiting />}

        {mutualLike && !showMutualModal && connectToken && (
          <MutualBar
            connectToken={connectToken}
            mutualAt={mutualAt}
            partnerLeft={partnerLeft}
            onOpen={onOpenMutualModal}
          />
        )}

        {partnerLeft ? (
          summary && !partnerLeftDismissed ? (
            <ThreadSummaryCard
              summary={summary}
              myAlias={myName}
              partnerAlias={partnerName}
              onFindSomeoneNew={onFindSomeoneNew}
              onClose={onStayOnEndedThread}
              closeLabel="Stay and re-read it"
            />
          ) : (
            <ThreadEndedBar onFindSomeoneNew={onFindSomeoneNew} />
          )
        ) : (
          <AnonComposer
            draft={draft}
            overLimit={overLimit}
            sparks={sparks}
            fresh={messages.length < FRESH_THREAD_MESSAGES}
            disabled={socketDegraded}
            onDraftChange={onDraftChange}
            onSend={handleSend}
            onPickSpark={handlePickSpark}
          />
        )}

        {connectToken && showMutualModal && (
          <MutualVibeModal
            myName={myName}
            partnerName={partnerName}
            partnerTags={partnerTags}
            connectToken={connectToken}
            mutualAt={mutualAt}
            partnerLeft={partnerLeft}
            onClose={onCloseMutualModal}
            onExpiredLeave={onLeaveAfterExpiry}
          />
        )}

        <ReportSheet
          open={reportOpen}
          sessionId={sessionId}
          onClose={() => setReportOpen(false)}
          onReported={onReported}
        />

        {confirmKind && <LeaveConfirm kind={confirmKind} onResolve={onResolveConfirm} />}
      </div>
    </AnonProfileShell>
  );
}
