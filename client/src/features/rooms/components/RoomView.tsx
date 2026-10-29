import { useCallback, useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import ContextMenu from '@/shared/components/ui/context-menu/ContextMenu';
import { useRoomMessageMenu } from '../hooks/useRoomMessageMenu';
import { useRoomStore } from '../stores/roomStore';
import { messageLabel, previewText } from '../utils/thread';
import type { RoomAckCode, RoomMessage, RoomMessageAck, RoomMessageInput, RoomModAction, RoomReactionKey } from '../types';
import RoomBackdrop from './RoomBackdrop';
import RoomComposer from './RoomComposer';
import RoomHeader from './RoomHeader';
import RoomInfoPanel from './RoomInfoPanel';
import RoomInvitesSheet from './RoomInvitesSheet';
import RoomListeningStrip from './RoomListeningStrip';
import RoomReportSheet from './RoomReportSheet';
import RoomSettingsSheet from './RoomSettingsSheet';
import RoomSupportNotice from './RoomSupportNotice';
import RoomThread from './RoomThread';
import './roomThread.css';
import './roomInfo.css';

type Props = {
  slug: string;
  onLeave: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
  onUploadImage: (file: File) => Promise<{ key: string } | { code: RoomAckCode }>;
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
  onMod: (action: RoomModAction) => void;
};

/**
 * The live thread page: header, messages, composer, and the sheets they open.
 * Endings (kicked, closed, …) are handled one level up by `RoomScreen`.
 */
const RoomView = ({ slug, onLeave, onSend, onUploadImage, onReact, onMod }: Props) => {
  const title = useRoomStore((s) => s.title);
  const messages = useRoomStore((s) => s.messages);
  const online = useRoomStore((s) => s.online);
  const you = useRoomStore((s) => s.you);
  const myReactions = useRoomStore((s) => s.myReactions);
  const supportNotice = useRoomStore((s) => s.supportNotice);
  const clearSupportNotice = useRoomStore((s) => s.clearSupportNotice);
  const setSupportNotice = useRoomStore((s) => s.setSupportNotice);
  const listening = useRoomStore((s) => s.listening);
  const connected = useRoomStore((s) => s.socketStatus === 'online' && s.joinStatus === 'joined');

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [kickCandidate, setKickCandidate] = useState<RoomMessage | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const rail = useMediaQuery('(min-width: 1024px)');

  // Once the rail shows, a sheet left open would pop back up when the window narrows.
  if (rail && showInfo) setShowInfo(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const menu = useRoomMessageMenu({
    role: you?.role,
    onReply: setReplyToId,
    onReport: setReportId,
    onKick: setKickCandidate,
    onMod,
    onReact,
    myReactions,
  });

  const replyTarget = replyToId ? messages.find((m) => m.id === replyToId) : undefined;
  const clearReply = useCallback(() => setReplyToId(null), []);

  return (
    <div className="rm-shell">
    <div className="rm-threadpage">
      <RoomBackdrop teal />
      <div aria-hidden className="rm-colbg" />

      <RoomHeader
        slug={slug}
        title={title}
        online={online}
        you={you}
        connected={connected}
        infoOpen={showInfo}
        onToggleInfo={() => setShowInfo((v) => !v)}
        onLeave={onLeave}
        onMod={onMod}
        onOpenInvites={() => setShowInvites(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <RoomThread
        messages={messages}
        you={you}
        myReactions={myReactions}
        onReact={onReact}
        onReply={setReplyToId}
        onContextMenu={menu.onContextMenu}
        onOpenMenu={menu.openFromButton}
        bindLongPress={menu.bindLongPress}
      />

      {listening && <RoomListeningStrip onHelp={setSupportNotice} />}

      <RoomComposer
        replyTo={
          replyTarget
            ? { id: replyTarget.id, alias: replyTarget.from.alias, preview: previewText(messageLabel(replyTarget)) }
            : null
        }
        onClearReply={clearReply}
        onSend={onSend}
        onUploadImage={onUploadImage}
      />

      {supportNotice && <RoomSupportNotice onDismiss={clearSupportNotice} />}

      <RoomReportSheet slug={slug} messageId={reportId} onClose={() => setReportId(null)} />
      <RoomInvitesSheet slug={slug} open={showInvites} onClose={() => setShowInvites(false)} />
      <RoomSettingsSheet slug={slug} open={showSettings} onClose={() => setShowSettings(false)} />
      <ContextMenu menuState={menu.menuState} hideContextMenu={menu.hideContextMenu} />
      {kickCandidate && (
        <ConfirmationModal
          onClose={() => setKickCandidate(null)}
          handleConfirmationModal={({ accept }) => {
            if (accept) onMod({ action: 'kick', target: kickCandidate.from.alias });
            setKickCandidate(null);
          }}
          variant="danger"
          title={`Kick ${kickCandidate.from.alias}?`}
          description="They’re removed now and can’t rejoin for a while."
          confirmLabel="Kick"
          cancelLabel="Cancel"
        />
      )}
    </div>
    <aside className="rm-info" aria-label="Room info">
      <RoomInfoPanel slug={slug} variant="column" />
    </aside>
    <BottomSheet open={showInfo && !rail} onClose={() => setShowInfo(false)} labelledBy="rip-sheet-title">
      <h2 id="rip-sheet-title" className="sr-only">
        Room info
      </h2>
      <RoomInfoPanel slug={slug} variant="sheet" />
    </BottomSheet>
    </div>
  );
};

export default RoomView;
