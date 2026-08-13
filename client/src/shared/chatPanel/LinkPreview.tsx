import LinkIcon from '@/components/icons/Link';
import { getLinkFaviconUrl, type ParsedLink } from '@/lib/links';
import { useState } from 'react';

type LinkPreviewProps = {
  link: ParsedLink;
  variant?: 'incoming' | 'outgoing';
  /** First preview in a link-only bubble — no top margin. */
  lead?: boolean;
};

const LinkPreview = ({
  link,
  variant = 'incoming',
  lead = false,
}: LinkPreviewProps) => {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const faviconUrl = getLinkFaviconUrl(link.url);

  const cardBg =
    variant === 'outgoing' ? 'bg-[#0a1612]/70' : 'bg-[#0d1218]/75';
  const heroBg =
    variant === 'outgoing' ? 'bg-[#061410]' : 'bg-[#111820]';

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/link block w-full overflow-hidden rounded-t-[1.35rem] rounded-b-md ${cardBg} ${
        lead ? '' : 'mt-2'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`relative h-[7.25rem] overflow-hidden ${heroBg}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="flex h-full items-center justify-center">
          {!faviconFailed && faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="h-14 w-14 rounded-xl object-cover opacity-90"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-white/[0.06]">
              <LinkIcon className="h-7 w-7 stroke-[#8696a0]" />
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <p className="truncate text-[15px] font-normal leading-tight text-[#e9edef]">
          {link.host}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-[#8696a0]">
          {link.displayUrl}
        </p>
      </div>
    </a>
  );
};

export default LinkPreview;
