import LinkPreviewCard from '@/components/chat/link/LinkPreviewCard';
import CloseIcon from '@/components/ui/icons/Close';
import type { ParsedLink } from '@/utils/linkParser';

type ComposerLinkPreviewProps = {
  link: ParsedLink;
  onDismiss: () => void;
  /** When stacked below the reply strip, skip top glow and match reply chrome. */
  hasReplyAbove?: boolean;
};

const ComposerLinkPreview = ({
  link,
  onDismiss,
  hasReplyAbove = false,
}: ComposerLinkPreviewProps) => (
  <div
    className="animate-reply-strip-rise relative motion-reduce:animate-none"
    role="status"
    aria-live="polite"
  >
    {!hasReplyAbove ? (
      <div
        className="pointer-events-none absolute inset-x-8 -top-1 h-5 rounded-full bg-[#53bdeb]/20 blur-xl"
        aria-hidden
      />
    ) : null}

    <div
      className={`relative overflow-hidden ${
        hasReplyAbove
          ? 'border-x border-green/15 bg-primary/35'
          : 'bg-[linear-gradient(165deg,rgba(83,189,235,0.12)_0%,rgba(42,33,54,0.55)_42%,rgba(33,26,42,0.82)_100%)]'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#53bdeb]/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#53bdeb]/75"
        aria-hidden
      />

      <div className="flex items-start gap-2 px-3 py-3 pl-3.5">
        <div className="min-w-0 flex-1">
          <LinkPreviewCard link={link} surface="composer" embedded />
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss link preview"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-body-300 transition duration-200 hover:rotate-90 hover:bg-white/10 hover:text-body"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
);

export default ComposerLinkPreview;
