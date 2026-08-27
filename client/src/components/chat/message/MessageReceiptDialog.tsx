import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMessageReceipts } from '@/api/chat';
import Image from '@/components/ui/Image';
import ChevronLeft from '@/components/ui/icons/ChevronLeft';
import ReadReceipt from '@/components/ui/icons/ReadReceipt';
import MessageRow from '@/components/chat/message/MessageRow';
import type { ChatMessage } from '@/types/chat';

type ReceiptUser = { _id: string; name: string; avatar?: { url?: string } };

type Props = {
  message: ChatMessage;
  isGroupChat?: boolean;
  onClose: () => void;
};

const MessageReceiptDialog = ({ message, isGroupChat = false, onClose }: Props) => {
  const titleId = useId();
  const [entered, setEntered] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['messageReceipts', message._id],
    queryFn: () => getMessageReceipts(message._id) as Promise<{ data: ReceiptUser[] }>,
    staleTime: 30_000,
  });

  const readers = data?.data ?? [];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-6 scale-[0.98] opacity-0 sm:translate-y-0'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border/80 sm:hidden" />

        <header className="relative flex items-center gap-2 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
            aria-label="Close"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate text-center text-lg font-semibold tracking-tight text-white"
          >
            Message info
          </h2>
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </header>

        <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl border border-white/10 sm:mx-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(1,195,109,0.18),transparent_55%),radial-gradient(ellipse_at_85%_100%,rgba(139,92,246,0.12),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_12px)]"
            aria-hidden
          />
          <div className="relative flex justify-center px-4 py-5">
            <MessageRow
              chatData={message}
              isGroupChat={isGroupChat}
              showReadReceipt={false}
              centered
            />
          </div>
        </div>

        <div className="mx-4 border-t border-white/8 sm:mx-5" />

        <div className="relative max-h-[min(40vh,16rem)] overflow-y-auto px-2 pb-4 pt-3 sm:px-3 sm:pb-5">
          <p className="px-2 pb-2 text-xs font-medium text-body-300">
            {isLoading
              ? 'Loading…'
              : readers.length === 0
                ? 'Not read yet'
                : `Read by ${readers.length}`}
          </p>

          {isLoading ? (
            <div className="flex flex-col gap-2 px-2 py-1">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : readers.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-body-300">
              No one has read this message yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {readers.map((reader) => (
                <li
                  key={reader._id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-background-alt ring-1 ring-white/10">
                    <Image
                      src={reader.avatar?.url}
                      alt={reader.name}
                      className="h-full w-full object-cover"
                      displayWidth={80}
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-body">{reader.name}</span>
                  <ReadReceipt read className="h-3.5 w-5 shrink-0 text-green" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MessageReceiptDialog;
