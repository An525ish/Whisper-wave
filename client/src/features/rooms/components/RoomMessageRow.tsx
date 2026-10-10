import { useState } from 'react';
import DotsMenu from '@/shared/components/ui/DotsMenu';
import type { DotsMenuItem } from '@/shared/types/ui';
import { ROOM_REACTION_GLYPHS, type RoomReactionGlyph } from '../constants';
import type { RoomMessage, RoomModAction } from '../types';

type Props = {
  message: RoomMessage;
  /** Quoted text for `replyTo`, resolved from the thread. */
  replyPreview?: string;
  canModerate: boolean;
  onReact: (messageId: string, reaction: string) => void;
  onReply: (messageId: string) => void;
  onReport: (messageId: string) => void;
  onMod: (action: RoomModAction) => void;
};

/**
 * One room message: color-coded alias, text, tap-to-toggle reactions.
 * The ⋯ menu holds Reply / Report for everyone, mod actions when privileged.
 */
const RoomMessageRow = ({ message, replyPreview, canModerate, onReact, onReply, onReport, onMod }: Props) => {
  const [confirmKick, setConfirmKick] = useState(false);

  const menuItems: DotsMenuItem[] = [
    {
      id: 'reply',
      label: 'Reply',
      onSelect: () => onReply(message.id),
    },
    {
      id: 'report',
      label: 'Report',
      tone: 'danger',
      onSelect: () => onReport(message.id),
    },
  ];

  if (canModerate) {
    menuItems.push(
      {
        id: 'delete',
        label: 'Delete message',
        tone: 'danger',
        dividerBefore: true,
        onSelect: () => onMod({ action: 'delete', messageId: message.id }),
      },
      {
        id: 'mute-10',
        label: 'Mute 10 min',
        onSelect: () => onMod({ action: 'mute', target: message.from.alias, minutes: 10 }),
      },
      {
        id: 'mute-60',
        label: 'Mute 1 hour',
        onSelect: () => onMod({ action: 'mute', target: message.from.alias, minutes: 60 }),
      },
      {
        id: 'shadowmute',
        label: 'Shadow-mute 1 hour',
        onSelect: () => onMod({ action: 'shadowmute', target: message.from.alias, minutes: 60 }),
      },
      {
        id: 'kick',
        label: 'Kick from room',
        tone: 'danger',
        onSelect: () => setConfirmKick(true),
      }
    );
  }

  if (message.system) {
    return (
      <div className="px-5 py-1.5 first:pt-3 last:pb-3">
        <p className="mx-auto w-fit max-w-full rounded-full bg-white/5 px-4 py-1.5 text-center text-[13px] italic leading-relaxed text-body-300">
          〜 {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className="group px-5 py-1.5 first:pt-3 last:pb-3">
      {replyPreview && (
        <p className="mb-0.5 truncate border-l-2 border-border pl-2 text-xs text-body-700">
          {replyPreview}
        </p>
      )}
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-sm font-semibold" style={{ color: message.from.color }}>
          {message.from.alias}
        </span>
        <p className="min-w-0 flex-1 break-words text-[15px] leading-relaxed text-body">
          {message.text}
        </p>
        <DotsMenu ariaLabel={`Options for message from ${message.from.alias}`} align="right" items={menuItems} />
      </div>

      <div className="mt-1 flex items-center gap-1 pl-1" aria-label="Reactions">
        {(Object.keys(ROOM_REACTION_GLYPHS) as RoomReactionGlyph[]).map((reaction) => {
          const count = message.reactions?.[reaction] ?? 0;
          return (
            <button
              key={reaction}
              type="button"
              onClick={() => onReact(message.id, reaction)}
              aria-label={`${reaction}, ${count}`}
              aria-pressed={count > 0}
              className={`rounded-full px-1.5 py-0.5 text-sm leading-none transition focus-visible:outline-2 focus-visible:outline-green ${
                count > 0 ? 'bg-white/10' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {ROOM_REACTION_GLYPHS[reaction]}
              {count > 0 && <span className="ml-0.5 text-xs text-body-300">{count}</span>}
            </button>
          );
        })}
      </div>

      {confirmKick && (
        <div role="alertdialog" aria-label="Confirm kick" className="mt-2 rounded-xl border border-red/30 bg-red/5 p-3">
          <p className="text-sm text-body">
            Kick {message.from.alias} from this room? They get a 15-minute ban and can rejoin after.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmKick(false);
                onMod({ action: 'kick', target: message.from.alias });
              }}
              className="rounded-full bg-red/20 px-4 py-1.5 text-sm font-medium text-red transition hover:bg-red/30"
            >
              Kick
            </button>
            <button
              type="button"
              onClick={() => setConfirmKick(false)}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-body-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomMessageRow;
