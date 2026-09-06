import { useState } from 'react';
import AttachmentSenderMeta from './AttachmentSenderMeta';
import DeletedTag from '@/components/admin/attachments/cards/DeletedTag';
import CopyButton from '@/components/ui/CopyButton';
import LinkIcon from '@/components/ui/icons/Link';
import { ATTACHMENT_LIST_CARD_CLASS } from '@/constants/admin/attachments';
import ExternalLinkIcon from '@/components/ui/icons/ExternalLink';
import type { LinkItem } from '@/types/admin';
import { urlDomain } from '@/utils/admin/attachments';

type LinkCardProps = {
  item: LinkItem;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (msgId: string) => void;
};

const LinkCard = ({ item, isSelectMode, isSelected, onToggleSelect }: LinkCardProps) => {
  const { url, msg } = item;
  const sender = msg.sender;
  const domain = urlDomain(url);
  const faviconSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const [faviconFailed, setFaviconFailed] = useState(false);

  return (
    <div
      className={`${ATTACHMENT_LIST_CARD_CLASS} ${isSelectMode ? 'cursor-pointer' : ''} ${isSelectMode && isSelected ? 'ring-1 ring-green/50 bg-green/5' : ''}`}
      onClick={isSelectMode ? () => onToggleSelect?.(msg._id) : undefined}
      role={isSelectMode ? 'button' : undefined}
      tabIndex={isSelectMode ? 0 : undefined}
      onKeyDown={isSelectMode ? (e) => e.key === 'Enter' && onToggleSelect?.(msg._id) : undefined}
    >
      <span
        className="pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-full bg-linear-to-b from-green/50 via-green/20 to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-primary/80 to-background/60 ring-1 ring-border/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          {faviconFailed ? (
            <LinkIcon className="h-5 w-5 stroke-body-300/60" />
          ) : (
            <img
              src={faviconSrc}
              alt=""
              className="h-6 w-6 object-contain"
              onError={() => setFaviconFailed(true)}
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-semibold text-blue transition hover:text-blue/80"
          >
            {domain}
          </a>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-body-300/70" title={url}>
            {url}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {msg.isDeleted ? <DeletedTag /> : null}
          {isSelectMode ? (
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
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
            <>
              <CopyButton value={url} label="link" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open link"
                className="grid h-8 w-8 place-items-center rounded-lg bg-green/10 text-green ring-1 ring-green/25 transition hover:bg-green/15"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </div>
      </div>
      <AttachmentSenderMeta
        sender={sender}
        chatName={msg.chat?.name}
        createdAt={msg.createdAt}
      />
    </div>
  );
};

export default LinkCard;
