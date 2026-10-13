import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ChevronLeft from '@/shared/components/ui/icons/ChevronLeft';
import { ROUTES } from '@/shared/constants/routes';
import DotsMenu from '@/shared/components/ui/DotsMenu';
import ContextMenu from '@/shared/components/ui/context-menu/ContextMenu';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import useContextMenu from '@/shared/hooks/useContextMenu';
import { useLongPress } from '@/shared/hooks/useLongPress';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import type { ContextMenuOption } from '@/shared/types';
import { useRoomStore } from '../stores/roomStore';
import RoomInvitesSheet from './RoomInvitesSheet';
import RoomSettingsSheet from './RoomSettingsSheet';
import RoomComposer from './RoomComposer';
import RoomMessageRow from './RoomMessageRow';
import RoomReportSheet from './RoomReportSheet';
import type { RoomMessage, RoomModAction } from '../types';
import './rooms.css';

type Props = {
  slug: string;
  onLeave: () => void;
  onSend: (text: string, opts?: { replyTo?: string }) => void;
  onReact: (messageId: string, reaction: string) => void;
  onMod: (action: RoomModAction) => void;
};

/**
 * The live thread: header (title, instance, count, rules, leave), messages,
 * composer. Kicked / closed / error states replace the thread with a way out.
 */
const RoomView = ({ slug, onLeave, onSend, onReact, onMod }: Props) => {
  const title = useRoomStore((s) => s.title);
  const rules = useRoomStore((s) => s.rules);
  const messages = useRoomStore((s) => s.messages);
  const online = useRoomStore((s) => s.online);
  const you = useRoomStore((s) => s.you);
  const kicked = useRoomStore((s) => s.kicked);
  const closedReason = useRoomStore((s) => s.closedReason);
  const error = useRoomStore((s) => s.error);
  const supportNotice = useRoomStore((s) => s.supportNotice);
  const clearSupportNotice = useRoomStore((s) => s.clearSupportNotice);
  const socketConnected = useRoomStore((s) => s.socketConnected);

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [kickCandidate, setKickCandidate] = useState<RoomMessage | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const { copy } = useCopyToClipboard();

  // Stick to the bottom on new messages unless the user scrolled up to read.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const canModerateMenu = you !== null && you.role !== 'member';

  const menuIcon = (path: ReactNode) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {path}
    </svg>
  );

  /** Right-click / long-press menu for a message — same options as its ⋯ menu. */
  const openMessageMenu = useCallback(
    (message: RoomMessage, x: number, y: number) => {
      if (message.system) return;
      const options: ContextMenuOption[] = [
        {
          icon: menuIcon(<path d="M9 17l-5-5 5-5 M4 12h9a7 7 0 0 1 7 7v1" />),
          label: 'Reply',
          onClick: () => setReplyToId(message.id),
        },
        {
          icon: menuIcon(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
          label: 'Copy text',
          onClick: () => copy(message.text),
        },
        {
          icon: menuIcon(<><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></>),
          label: 'Report',
          danger: true,
          onClick: () => setReportId(message.id),
        },
      ];
      if (canModerateMenu) {
        options.push(
          {
            icon: menuIcon(<path d="M4 7h16 M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />),
            label: 'Delete message',
            danger: true,
            onClick: () => onMod({ action: 'delete', messageId: message.id }),
          },
          {
            icon: menuIcon(<path d="M11 5L6 9H3v6h3l5 4V5z M22 9l-6 6 M16 9l6 6" />),
            label: 'Mute 10 min',
            onClick: () => onMod({ action: 'mute', target: message.from.alias, minutes: 10 }),
          },
          {
            icon: menuIcon(<path d="M13 4L4 14h6l-1 8 9-12h-6l1-8z" />),
            label: 'Kick from room',
            danger: true,
            onClick: () => setKickCandidate(message),
          }
        );
      }
      showContextMenu({ x, y }, options);
    },
    [canModerateMenu, copy, onMod, showContextMenu]
  );

  const bindLongPress = useLongPress<RoomMessage>(
    (message, point) => openMessageMenu(message, point.clientX, point.clientY),
  );

  const handleBubbleContextMenu = useCallback(
    (e: ReactMouseEvent, message: RoomMessage) => {
      e.preventDefault();
      openMessageMenu(message, e.clientX, e.clientY);
    },
    [openMessageMenu]
  );

  const replyTarget: RoomMessage | undefined = replyToId
    ? messages.find((m) => m.id === replyToId)
    : undefined;

  const quoteFor = (id: string | undefined): { alias: string; preview: string } | undefined => {
    if (!id) return undefined;
    const target = messages.find((m) => m.id === id);
    if (!target || target.system) return undefined;
    const text = target.text.length > 60 ? `${target.text.slice(0, 60)}…` : target.text;
    return { alias: target.from.alias, preview: text };
  };

  if (kicked) {
    return (
      <div className="rm-statepage">
        <div aria-hidden className="rm-bg">
          <div className="rm-mesh" />
          <div className="rm-glow rm-glow--violet" />
          <div className="rm-grain" />
          <div className="rm-vignette" />
        </div>
        <div className="rm-statecard">
          <span aria-hidden className="rm-statecard__orb">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <p className="rm-statecard__title">You were kicked</p>
          <p className="rm-statecard__sub">
            A 15-minute ban came with it. Take a breath — you can rejoin after.
          </p>
          <Link to={ROUTES.rooms} className="rm-statecard__btn">
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  if (closedReason) {
    return (
      <div className="rm-statepage">
        <div aria-hidden className="rm-bg">
          <div className="rm-mesh" />
          <div className="rm-glow rm-glow--violet" />
          <div className="rm-grain" />
          <div className="rm-vignette" />
        </div>
        <div className="rm-statecard">
          <span aria-hidden className="rm-statecard__orb">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="rm-statecard__title">This room closed</p>
          <p className="rm-statecard__sub">{closedReason}</p>
          <Link to={ROUTES.rooms} className="rm-statecard__btn">
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm-statepage">
        <div aria-hidden className="rm-bg">
          <div className="rm-mesh" />
          <div className="rm-glow rm-glow--violet" />
          <div className="rm-grain" />
          <div className="rm-vignette" />
        </div>
        <div className="rm-statecard">
          <span aria-hidden className="rm-statecard__orb">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
            </svg>
          </span>
          <p className="rm-statecard__title">Couldn’t join</p>
          <p className="rm-statecard__sub">
            The room may be closed or full — or the ban list knows you.
          </p>
          <Link to={ROUTES.rooms} className="rm-statecard__btn">
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  const canModerate = you !== null && you.role !== 'member';

  const artVariant = (() => {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
    }
    return hash % 4;
  })();
  const initial = ((title || slug).trim().charAt(0) || '?').toUpperCase();

  return (
    <div className="rm-threadpage">
      <div aria-hidden className="rm-bg">
        <div className="rm-mesh" />
        <div className="rm-glow rm-glow--violet" />
        <div className="rm-glow rm-glow--teal" />
        <div className="rm-grain" />
        <div className="rm-vignette" />
      </div>
      <div aria-hidden className="rm-colbg" />

      <div className="rm-cheadfloat">
        <header className="rm-chead">
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave room"
            title="Leave room"
            className="rm-hbtn"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="rm-chead__identity">
            <span aria-hidden className={`rm-chead__art rm-chead__art--${artVariant}`}>
              <span>{initial}</span>
              <span className={`rm-chead__dot${socketConnected ? '' : ' rm-chead__dot--warn'}`} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="rm-chead__title">
                <span className="rm-chead__name">{title || slug}</span>
                <span className="rm-livepill">live</span>
              </div>
              {socketConnected ? (
                <p className="rm-chead__status" aria-live="off">
                  {online} {online === 1 ? 'soul' : 'souls'} in here{you ? ` · you’re ${you.alias}` : ''}
                </p>
              ) : (
                <p className="rm-chead__status rm-chead__status--warn" role="status">
                  Reconnecting…
                </p>
              )}
            </div>
          </div>
          {canModerate && (
            <DotsMenu
              ariaLabel="Moderate room"
              align="right"
              items={[
                { id: 'invites', label: 'Invite links', onSelect: () => setShowInvites(true) },
                ...(you?.role === 'host'
                  ? [{ id: 'settings', label: 'Room settings', onSelect: () => setShowSettings(true) }]
                  : []),
                { id: 'lock', label: 'Lock room', onSelect: () => onMod({ action: 'lock' }) },
                { id: 'unlock', label: 'Unlock room', onSelect: () => onMod({ action: 'unlock' }) },
                { id: 'slow-5', label: 'Slow mode 5s', onSelect: () => onMod({ action: 'slow', ms: 5000 }) },
                { id: 'slow-off', label: 'Slow mode off', onSelect: () => onMod({ action: 'slow', ms: 0 }) },
              ]}
            />
          )}
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            aria-expanded={showRules}
            aria-label="Room rules"
            title="Room rules"
            className={`rm-hbtn${showRules ? ' rm-hbtn--active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
            </svg>
          </button>
        </header>
      </div>

      {showRules && (
        <section aria-label="Room rules" className="rm-rules">
          <p className="rm-rules__label">Room rules</p>
          <ul>
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
      )}

      <div ref={listRef} onScroll={onScroll} role="log" aria-label="Room messages" className="rm-threadlist min-h-0 flex-1 overflow-y-auto py-2">
        <div>
          <div className="rm-ephemeral" aria-hidden>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Live only — nothing is kept
            </span>
          </div>
          {messages.length === 0 ? (
            <div className="rm-threadempty">
              <span aria-hidden className="rm-threadempty__orb">〜</span>
              <p className="rm-threadempty__title">Nothing here yet.</p>
              <p className="rm-threadempty__sub">
                Say hi — someone’s always lurking.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
            const prev = messages[index - 1];
            const joinedAbove =
              !message.system &&
              prev !== undefined &&
              !prev.system &&
              prev.from.alias === message.from.alias &&
              message.ts - prev.ts < 5 * 60 * 1000;
            return (
              <RoomMessageRow
                key={message.id}
                message={message}
                replyQuote={quoteFor(message.replyTo)}
                mine={you !== null && message.from.alias === you.alias}
                joinedAbove={joinedAbove}
                onReact={onReact}
                onReply={setReplyToId}
                onContextMenu={handleBubbleContextMenu}
                bindLongPress={bindLongPress}
              />
            );
          })
        )}
        </div>
      </div>

      <RoomComposer
        replyTo={
          replyTarget
            ? {
                id: replyTarget.id,
                alias: replyTarget.from.alias,
                preview:
                  replyTarget.text.length > 60
                    ? `${replyTarget.text.slice(0, 60)}…`
                    : replyTarget.text,
              }
            : null
        }
        onClearReply={() => setReplyToId(null)}
        onSend={onSend}
      />

      {supportNotice && (
        <div role="note" aria-label="Support resources" className="rm-support">
          <div className="rm-support__card">
            <p className="text-sm font-medium text-white">You don’t have to carry this alone.</p>
            <p className="mt-1 text-[13px] leading-relaxed text-body-300">
              If you might act on these thoughts, please reach out right now — a local crisis
              helpline or emergency number. Your message was still posted; this is only ever
              shown to you, never a punishment.
            </p>
            <button
              type="button"
              onClick={clearSupportNotice}
              className="mt-2 text-xs font-medium text-green hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <RoomReportSheet slug={slug} messageId={reportId} onClose={() => setReportId(null)} />
      <RoomInvitesSheet slug={slug} open={showInvites} onClose={() => setShowInvites(false)} />
      <RoomSettingsSheet slug={slug} open={showSettings} onClose={() => setShowSettings(false)} />
      <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />
      {kickCandidate && (
        <ConfirmationModal
          onClose={() => setKickCandidate(null)}
          handleConfirmationModal={({ accept }) => {
            if (accept) onMod({ action: 'kick', target: kickCandidate.from.alias });
            setKickCandidate(null);
          }}
          variant="danger"
          title={`Kick ${kickCandidate.from.alias}?`}
          description="They get a 15-minute ban and can rejoin after."
          confirmLabel="Kick"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
};

export default RoomView;
