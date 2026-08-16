import Image from '@/components/ui/Image';
import CopyButton from '@/components/ui/CopyButton';
import PlayIcon from '@/components/ui/icons/Play';
import type { FlatItem } from '@/types/admin';
import {
  formatMediaDate,
  kindBadgeClass,
  kindLabel,
} from '@/utils/admin/attachments';

type MediaCardProps = {
  item: FlatItem;
  onClick: () => void;
};

const MediaCard = ({ item, onClick }: MediaCardProps) => {
  const { att, msg, rk } = item;
  const sender = msg.sender;
  const displayName = sender?.name?.trim() || 'Unknown user';
  const username = sender?.username?.trim();
  const fileName = att.name?.trim() || 'Untitled file';
  const typeLabel = kindLabel(rk);
  const sentAt = formatMediaDate(msg.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-xl bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue/50"
    >
      {rk === 'video' ? (
        <video
          src={att.url}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          preload="metadata"
          muted
          playsInline
        />
      ) : (
        <Image
          src={att.url}
          alt={fileName}
          displayWidth={400}
          fallback="/icons/picture-icon.svg"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
      )}

      {rk === 'video' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
            <PlayIcon />
          </div>
        </div>
      )}

      {rk === 'gif' && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0">
          GIF
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/92 via-black/50 to-transparent opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        aria-hidden
      >
        <time
          dateTime={msg.createdAt}
          title={sentAt}
          className="absolute right-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium tabular-nums text-white/90 backdrop-blur-sm"
        >
          {sentAt}
        </time>

        <div className="border-t border-white/10 bg-black/40 p-3 text-left backdrop-blur-md">
          <div className="flex items-start gap-2.5">
            <Image
              src={sender?.avatar?.url}
              alt={displayName}
              displayWidth={64}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/15"
            />
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[13px] font-semibold leading-tight text-white">
                  {displayName}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-inset ${kindBadgeClass(rk)}`}
                >
                  {typeLabel}
                </span>
              </div>
              {username ? (
                <div className="mt-0.5 flex min-w-0 items-center gap-1">
                  <p className="min-w-0 truncate text-left text-[11px] text-white/55">@{username}</p>
                  <CopyButton
                    value={`@${username}`}
                    label="username"
                    variant="overlay"
                    iconClassName="h-3 w-3"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <p
            className="mt-2.5 truncate border-t border-white/10 pt-2.5 text-[11px] font-medium text-white/80"
            title={fileName}
          >
            {fileName}
          </p>
        </div>
      </div>
    </button>
  );
};

export default MediaCard;
