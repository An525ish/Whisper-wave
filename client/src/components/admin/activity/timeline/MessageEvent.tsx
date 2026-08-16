import Image from '@/components/ui/Image';
import type { AdminActivityMessage } from '@/types/admin';
import { activityRelativeTime } from '@/utils/admin/activity';

const MessageBody = ({ msg }: { msg: AdminActivityMessage }) => {
  const hasAttachment = (msg.attachments?.length ?? 0) > 0;
  if (msg.content) {
    return (
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-body-300">
        <span className="text-body-300/40">&ldquo;</span>
        {msg.content}
        <span className="text-body-300/40">&rdquo;</span>
      </p>
    );
  }
  if (hasAttachment) {
    return <p className="mt-1 text-sm text-body-300/60">Shared an attachment</p>;
  }
  return <p className="mt-1 text-sm text-body-300/40">Empty message</p>;
};

const MessageEvent = ({ msg }: { msg: AdminActivityMessage }) => (
  <article className="group min-w-0 rounded-xl px-3 py-3 transition-colors hover:bg-primary/25 sm:px-4">
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/50">
        <Image
          src={msg.sender?.avatar?.url}
          alt={msg.sender?.name ?? 'User'}
          className="h-full w-full object-cover"
          displayWidth={80}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-body">{msg.sender?.name ?? 'Unknown'}</span>
          <span className="text-xs text-body-300/50">@{msg.sender?.username ?? '—'}</span>
          {msg.chat?.name && (
            <span className="rounded-md bg-blue/10 px-2 py-0.5 text-[10px] font-medium text-blue">
              {msg.chat.name}
            </span>
          )}
        </div>
        <MessageBody msg={msg} />
      </div>
      <time className="shrink-0 text-[11px] tabular-nums text-body-300/45">
        {activityRelativeTime(msg.createdAt)}
      </time>
    </div>
  </article>
);

export default MessageEvent;
