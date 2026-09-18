import CloseIcon from '@/components/ui/icons/Close';
import ReplyIcon from '@/components/ui/icons/Reply';
import type { MessageReplyTo } from '@/types/chat';
import { isReplyImagePreview } from '@/utils/chat';

type ReplyComposerBarProps = {
  senderName: string;
  previewText: string;
  previewAttachment?: MessageReplyTo['previewAttachment'];
  onCancel: () => void;
};

const ReplyBar = ({
  senderName,
  previewText,
  previewAttachment,
  onCancel,
}: ReplyComposerBarProps) => {
  const showThumb =
    previewAttachment?.url &&
    isReplyImagePreview(previewAttachment.fileType, previewAttachment.url);
  const initial = senderName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className="animate-reply-strip-rise relative motion-reduce:animate-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-x-6 -top-1 h-6 rounded-full bg-green/25 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-t-[1.35rem] border border-green/20 border-b-0 bg-[linear-gradient(165deg,rgba(1,195,109,0.11)_0%,rgba(42,33,54,0.72)_38%,rgba(33,26,42,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />

        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="relative shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-green/30 via-green/10 to-transparent text-sm font-semibold text-green shadow-[0_0_0_1px_rgba(1,195,109,0.35)] ring-2 ring-green/15">
              {initial}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 grid h-4 w-4 place-items-center rounded-full bg-background-alt text-green ring-2 ring-[rgba(33,26,42,0.95)]">
              <ReplyIcon className="h-2.5 w-2.5 rotate-180" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium tracking-wide text-green/90">
              Replying to{' '}
              <span className="font-semibold text-green">{senderName}</span>
            </p>
            <p className="mt-0.5 truncate text-[13px] leading-snug text-body-300">
              {previewText}
            </p>
          </div>

          {showThumb ? (
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 rounded-xl bg-green/20 blur-sm" aria-hidden />
              <img
                src={previewAttachment.url}
                alt=""
                className="relative h-10 w-10 rounded-xl object-cover ring-1 ring-white/15"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-body-300 transition duration-200 hover:rotate-90 hover:bg-white/10 hover:text-body"
            aria-label="Cancel reply"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyBar;
