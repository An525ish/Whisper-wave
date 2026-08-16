import AttachmentSenderMeta from './AttachmentSenderMeta';
import { ATTACHMENT_LIST_CARD_CLASS } from '@/constants/admin/attachments';
import ExternalLinkIcon from '@/components/ui/icons/ExternalLink';
import type { FlatItem } from '@/types/admin';
import { fileData, fileFormat, type FileDocType } from '@/utils/fileFormat';

type DocCardProps = {
  item: FlatItem;
};

const DocCard = ({ item }: DocCardProps) => {
  const { att, msg } = item;
  const fileExtension = fileFormat(att.name);
  const fileDetails = fileData.find((entry) => entry.docType === (fileExtension as FileDocType));
  const extLabel =
    fileExtension && fileExtension !== 'unknown'
      ? fileExtension.toUpperCase()
      : (att.name.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 4);

  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className={ATTACHMENT_LIST_CARD_CLASS}>
      <span
        className="pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-full bg-linear-to-b from-blue/50 via-blue/20 to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/70 ring-1 ring-border/50">
          <img
            src={fileDetails?.icon ?? fileData[0].icon}
            alt=""
            className="h-6 w-6 object-contain"
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className="min-w-0 flex-1 truncate text-sm font-semibold text-body transition group-hover:text-white"
              title={att.name}
            >
              {att.name}
            </p>
            <span className="shrink-0 rounded-md bg-surface-200/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-body-300">
              {extLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-body-300/60">Document · opens in new tab</p>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue ring-1 ring-blue/20 transition group-hover:bg-blue/15">
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </span>
      </div>
      <AttachmentSenderMeta
        sender={msg.sender}
        chatName={msg.chat?.name}
        createdAt={msg.createdAt}
      />
    </a>
  );
};

export default DocCard;
