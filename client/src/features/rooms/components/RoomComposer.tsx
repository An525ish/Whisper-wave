import { useState } from 'react';
import { useRoomStore } from '../stores/roomStore';

type Props = {
  replyTo: { id: string; alias: string; preview: string } | null;
  onClearReply: () => void;
  onSend: (text: string, opts?: { replyTo?: string }) => void;
};

/**
 * Room composer: one line, send, reply strip. Slow-mode and rate verdicts
 * toast from the socket hook — the composer stays dumb and fast.
 */
const RoomComposer = ({ replyTo, onClearReply, onSend }: Props) => {
  const [draft, setDraft] = useState('');
  const socketConnected = useRoomStore((s) => s.socketConnected);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text, replyTo ? { replyTo: replyTo.id } : undefined);
    setDraft('');
    if (replyTo) onClearReply();
  };

  return (
    <div className="shrink-0 border-t border-border/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      {replyTo && (
        <div className="mb-1.5 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-1.5">
          <p className="min-w-0 truncate text-xs text-body-300">
            Replying to {replyTo.alias}: {replyTo.preview}
          </p>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Cancel reply"
            className="shrink-0 text-body-300 hover:text-body"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={socketConnected ? 'Say something…' : 'Connecting…'}
          disabled={!socketConnected}
          maxLength={1000}
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-border/60 bg-white/[0.03] px-4 py-2.5 text-[15px] text-body outline-none placeholder:text-body-700 focus:border-green/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!socketConnected || draft.trim().length === 0}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-green text-white transition disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default RoomComposer;
