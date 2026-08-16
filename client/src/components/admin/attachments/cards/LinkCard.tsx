import { useState } from 'react';
import AttachmentSenderMeta from './AttachmentSenderMeta';
import CopyButton from '@/components/ui/CopyButton';
import { ATTACHMENT_LIST_CARD_CLASS } from '@/constants/admin/attachments';
import ExternalLinkIcon from '@/components/ui/icons/ExternalLink';
import type { LinkItem } from '@/types/admin';
import { urlDomain } from '@/utils/admin/attachments';
import LinkIcon from '@/components/ui/icons/Link';

type LinkCardProps = {
  item: LinkItem;
};

const LinkCard = ({ item }: LinkCardProps) => {
  const { url, msg } = item;
  const sender = msg.sender;
  const domain = urlDomain(url);
  const faviconSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const [faviconFailed, setFaviconFailed] = useState(false);

  return (
    <div className={ATTACHMENT_LIST_CARD_CLASS}>
      <span
        className="pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-full bg-linear-to-b from-green/50 via-green/20 to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-green-dark/70 to-primary ring-1 ring-green/25">
          {faviconFailed ? (
            <LinkIcon className="h-5 w-5 stroke-green" />
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
