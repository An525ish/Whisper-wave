import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import DotsMenu from '@/shared/components/ui/DotsMenu';
import EmptyState from '@/shared/components/ui/EmptyState';
import { useRoomStore } from '../stores/roomStore';
import RoomInvitesSheet from './RoomInvitesSheet';
import RoomSettingsSheet from './RoomSettingsSheet';
import RoomComposer from './RoomComposer';
import RoomMessageRow from './RoomMessageRow';
import RoomReportSheet from './RoomReportSheet';
import type { RoomMessage, RoomModAction } from '../types';

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

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);

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

  const replyTarget: RoomMessage | undefined = replyToId
    ? messages.find((m) => m.id === replyToId)
    : undefined;

  const previewFor = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    const target = messages.find((m) => m.id === id);
    if (!target) return undefined;
    const text = target.text.length > 60 ? `${target.text.slice(0, 60)}…` : target.text;
    return `${target.from.alias}: ${text}`;
  };

  if (kicked) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <EmptyState
          title="You were kicked from this room"
          description="A 15-minute ban came with it. Take a breath — you can rejoin after."
          action={
            <Link to={ROUTES.rooms} className="font-medium text-green hover:underline">
              Back to lobby
            </Link>
          }
        />
      </main>
    );
  }

  if (closedReason) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <EmptyState
          title="This room closed"
          description={closedReason}
          action={
            <Link to={ROUTES.rooms} className="font-medium text-green hover:underline">
              Back to lobby
            </Link>
          }
        />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <EmptyState
          title="Couldn’t join"
          description="The room may be closed or full — or the ban list knows you."
          action={
            <Link to={ROUTES.rooms} className="font-medium text-green hover:underline">
              Back to lobby
            </Link>
          }
        />
      </main>
    );
  }

  const canModerate = you !== null && you.role !== 'member';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-white">{title || slug}</h1>
          <p className="text-xs text-body-300" aria-live="off">
            {online} here{you ? ` · you’re ${you.alias}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
            className="grid h-9 w-9 place-items-center rounded-full text-body-300 transition hover:bg-white/5 hover:text-body"
          >
            ⓘ
          </button>
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave room"
            className="grid h-9 w-9 place-items-center rounded-full text-body-300 transition hover:bg-white/5 hover:text-body"
          >
            ←
          </button>
        </div>
      </header>

      {showRules && (
        <section aria-label="Room rules" className="shrink-0 border-b border-border/50 px-5 py-3">
          <ul className="flex flex-col gap-1">
            {rules.map((rule) => (
              <li key={rule} className="text-sm text-body-300">· {rule}</li>
            ))}
          </ul>
        </section>
      )}

      <div ref={listRef} onScroll={onScroll} role="log" aria-label="Room messages" className="min-h-0 flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-body-300">
            Nothing here yet — say hi. Someone’s always lurking.
          </p>
        ) : (
          messages.map((message) => (
            <RoomMessageRow
              key={message.id}
              message={message}
              replyPreview={previewFor(message.replyTo)}
              canModerate={canModerate}
              onReact={onReact}
              onReply={setReplyToId}
              onReport={setReportId}
              onMod={onMod}
            />
          ))
        )}
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
        <div role="note" aria-label="Support resources" className="shrink-0 border-t border-border/50 px-4 py-3">
          <div className="rounded-xl bg-white/[0.04] p-3">
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
    </div>
  );
};

export default RoomView;
