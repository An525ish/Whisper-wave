import AttachmentSenderMeta from './AttachmentSenderMeta';
import DeletedTag from './DeletedTag';
import ExternalLinkIcon from '@/shared/components/ui/icons/ExternalLink';
import type { AdminMessageAttachment, AdminAttachmentRow } from '../../../types';
import { fileData } from '@/shared/utils/fileFormat';

type Props = {
  att: AdminMessageAttachment;
  msg: AdminAttachmentRow;
  fileDetails: (typeof fileData)[number] | undefined;
  extLabel: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
};

const DocCardInner = ({ att, msg, fileDetails, extLabel, isSelectMode, isSelected }: Props) => (
  <>
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
          <div className="flex shrink-0 items-center gap-1.5">
            {msg.isDeleted ? <DeletedTag /> : null}
            <span className="shrink-0 rounded-md bg-surface-200/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-body-300">
              {extLabel}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-body-300/60">Document · opens in new tab</p>
      </div>
      {isSelectMode ? (
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full border-2 transition-all ${
            isSelected ? 'border-green bg-green' : 'border-white/40'
          }`}
        >
          {isSelected ? (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </div>
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue ring-1 ring-blue/20 transition group-hover:bg-blue/15">
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
    <AttachmentSenderMeta
      sender={msg.sender}
      chatName={msg.chat?.name}
      createdAt={msg.createdAt}
    />
  </>
);

export default DocCardInner;
