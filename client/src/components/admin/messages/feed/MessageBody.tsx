import type { AdminMessageRow } from '@/types/admin';
import { isImageAttachment } from '@/utils/admin/messages';
import AttachmentChip from './AttachmentChip';

type MessageBodyProps = {
  msg: AdminMessageRow;
  onImageOpen: (index: number) => void;
};

const MessageBody = ({ msg, onImageOpen }: MessageBodyProps) => {
  const content = msg.content?.trim();
  const attachments = msg.attachments ?? [];
  const hasAttachments = attachments.length > 0;

  return (
    <div className="rounded-2xl border border-border/55 bg-primary/20 shadow-sm">
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 p-3">
          {attachments.map((att, index) => (
            <AttachmentChip
              key={att.publicId ?? att.url ?? index}
              att={att}
              onImageClick={isImageAttachment(att) ? () => onImageOpen(index) : undefined}
            />
          ))}
        </div>
      )}
      {content ? (
        <p
          className={`text-sm leading-relaxed text-body-300/90 ${hasAttachments ? 'border-t border-border/30 px-3.5 pb-2.5 pt-2' : 'px-3.5 py-2.5'}`}
        >
          <span className="text-body-300/35">&ldquo;</span>
          {content}
          <span className="text-body-300/35">&rdquo;</span>
        </p>
      ) : !hasAttachments ? (
        <p className="px-3.5 py-2.5 text-sm italic text-body-300/40">Empty message</p>
      ) : null}
    </div>
  );
};

export default MessageBody;
