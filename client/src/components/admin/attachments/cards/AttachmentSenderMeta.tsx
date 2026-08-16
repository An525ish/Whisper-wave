import Image from '@/components/ui/Image';
import type { AdminAttachmentRow } from '@/types/admin';
import { attachmentRelativeTime, formatMediaDate } from '@/utils/admin/attachments';

type AttachmentSenderMetaProps = {
  sender?: AdminAttachmentRow['sender'];
  chatName?: string;
  createdAt?: string;
};

const AttachmentSenderMeta = ({ sender, chatName, createdAt }: AttachmentSenderMetaProps) => (
  <div className="mt-2.5 flex items-center gap-2 border-t border-border/30 pt-2.5">
    <Image
      src={sender?.avatar?.url}
      alt={sender?.name}
      displayWidth={56}
      className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border/40"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-body">{sender?.name ?? 'Unknown'}</p>
      {sender?.username ? (
        <p className="truncate text-[10px] text-body-300/65">@{sender.username}</p>
      ) : null}
    </div>
    <div className="shrink-0 text-right">
      {chatName ? (
        <p className="max-w-28 truncate text-[10px] font-medium text-body-300/70">{chatName}</p>
      ) : null}
      <time
        dateTime={createdAt}
        title={formatMediaDate(createdAt)}
        className="text-[10px] tabular-nums text-body-300/55"
      >
        {attachmentRelativeTime(createdAt)}
      </time>
    </div>
  </div>
);

export default AttachmentSenderMeta;
