import type { MessageReplyTo } from '@/types/chat';
import { isReplyImagePreview } from '@/utils/chat';

type ReplyQuoteTone = 'outgoing' | 'incoming';

type ReplyQuoteProps = {
  senderName: string;
  previewText: string;
  previewAttachment?: MessageReplyTo['previewAttachment'];
  tone?: ReplyQuoteTone;
};

const toneClass: Record<ReplyQuoteTone, string> = {
  outgoing: 'border-white/10 bg-black/22',
  incoming: 'border-white/10 bg-white/[0.06]',
};

const ReplyQuote = ({
  senderName,
  previewText,
  previewAttachment,
  tone = 'incoming',
}: ReplyQuoteProps) => {
  const showThumb =
    Boolean(previewAttachment?.url) &&
    isReplyImagePreview(previewAttachment?.fileType, previewAttachment?.url);

  return (
    <div className={`flex min-w-0 items-stretch overflow-hidden rounded-xl border ${toneClass[tone]}`}>
      <span className="w-1 shrink-0 bg-green" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1.5 pl-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold tracking-wide text-green">
            {senderName}
          </p>
          <p className="mt-0.5 truncate text-xs leading-snug text-body-300">
            {previewText}
          </p>
        </div>
        {showThumb && previewAttachment?.url ? (
          <img
            src={previewAttachment.url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
          />
        ) : null}
      </div>
    </div>
  );
};

export default ReplyQuote;
