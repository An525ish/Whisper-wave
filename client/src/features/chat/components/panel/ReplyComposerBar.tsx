import CloseIcon from '@/shared/components/icons/Close';
import ReplyIcon from '@/shared/components/icons/Reply';
import type { MessageReplyTo } from '@/features/chat/components/message/ChatBox';

type ReplyComposerBarProps = {
  senderName: string;
  previewText: string;
  previewAttachment?: MessageReplyTo['previewAttachment'];
  onCancel: () => void;
};

const isImageAttachment = (fileType?: string, url?: string) => {
  if (fileType?.startsWith('image/')) return true;
  if (!url) return false;
  return /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(url);
};

const ReplyComposerBar = ({
  senderName,
  previewText,
  previewAttachment,
  onCancel,
}: ReplyComposerBarProps) => {
  const showThumb =
    previewAttachment?.url &&
    isImageAttachment(previewAttachment.fileType, previewAttachment.url);

  return (
    <div
      className="shrink-0 border-t border-green/20 bg-linear-to-r from-green/12 via-green/8 to-transparent px-2.5 py-2 md:rounded-t-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 rounded-xl border border-green/25 bg-background-alt/80 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(235,236,236,0.04)] backdrop-blur-sm">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green/15 text-green ring-1 ring-inset ring-green/30"
          aria-hidden
        >
          <ReplyIcon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1 border-l-2 border-green pl-2.5">
          <p className="truncate text-[11px] font-semibold tracking-wide text-green">
            Replying to {senderName}
          </p>
          <p className="mt-0.5 truncate text-xs leading-snug text-body-300">
            {previewText}
          </p>
        </div>

        {showThumb ? (
          <img
            src={previewAttachment.url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
          />
        ) : null}

        <button
          type="button"
          onClick={onCancel}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-body-300 transition hover:bg-white/8 hover:text-body"
          aria-label="Cancel reply"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ReplyComposerBar;
