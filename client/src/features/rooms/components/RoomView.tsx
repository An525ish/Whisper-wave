import { useCallback, useState } from 'react';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import ContextMenu from '@/shared/components/ui/context-menu/ContextMenu';
import { useRoomMessageMenu } from '../hooks/useRoomMessageMenu';
import { useRoomStore } from '../stores/roomStore';
import { previewText } from '../utils/thread';
import type { RoomMessage, RoomMessageAck, RoomMessageInput, RoomModAction, RoomReactionKey } from '../types';
import RoomBackdrop from './RoomBackdrop';
import RoomComposer from './RoomComposer';
import RoomHeader from './RoomHeader';
import RoomInvitesSheet from './RoomInvitesSheet';
import RoomListeningStrip from './RoomListeningStrip';
import RoomReportSheet from './RoomReportSheet';
import RoomSettingsSheet from './RoomSettingsSheet';
import RoomSupportNotice from './RoomSupportNotice';
import RoomThread from './RoomThread';
import './roomThread.css';

type Props = {
  slug: string;
  onLeave: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
  onMod: (action: RoomModAction) => void;
};

/**
 * The live thread page: header, messages, composer, and the sheets they open.
 * Endings (kicked, closed, …) are handled one level up by `RoomScreen`.
 */
const RoomView = ({ slug, onLeave, onSend, onReact, onMod }: Props) => {
  const title = useRoomStore((s) => s.title);
  const rules = useRoomStore((s) => s.rules);
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
  const [showRules, setShowRules] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const menu = useRoomMessageMenu({
    role: you?.role,
    onReply: setReplyToId,
    onReport: setReportId,
    onKick: setKickCandidate,
    onMod,
  });

  const replyTarget = replyToId ? messages.find((m) => m.id === replyToId) : undefined;
  const clearReply = useCallback(() => setReplyToId(null), []);

  return (
    <div className="rm-threadpage">
      <RoomBackdrop teal />
      <div aria-hidden className="rm-colbg" />

      <RoomHeader
        slug={slug}
        title={title}
        online={online}
        you={you}
        connected={connected}
        rulesOpen={showRules}
        onToggleRules={() => setShowRules((v) => !v)}
        onLeave={onLeave}
        onMod={onMod}
        onOpenInvites={() => setShowInvites(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showRules && (
        <section aria-label="Room rules" className="rm-rules">
          <p className="rm-rules__label">Room rules</p>
          <ul>
            {rules.map((rule, i) => (
              <li key={`${i}-${rule}`}>{rule}</li>
            ))}
          </ul>
        </section>
      )}

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
            ? { id: replyTarget.id, alias: replyTarget.from.alias, preview: previewText(replyTarget.text) }
            : null
        }
        onClearReply={clearReply}
        onSend={onSend}
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
  );
};

export default RoomView;
