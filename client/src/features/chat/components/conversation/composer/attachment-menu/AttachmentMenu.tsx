import {
  useEffect,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useMediaQuery } from '@/shared/hooks';
import { validateFiles } from '@/shared/utils/helpers';
import { UPLOAD_TYPES, type UploadLimits } from '@/features/chat/constants/upload';

type AttachmentMenuProps = {
  onClose: () => void;
  onFileSelect: (type: string, files: File[]) => void;
  clipIconRef: RefObject<HTMLElement | null>;
};

/** Per-type icon well accents — subtle, on-brand. */
const TILE_STYLE: Record<string, { well: string; icon: string }> = {
  Images: {
    well: 'bg-linear-to-br from-green/22 to-green/6 ring-green/25 group-hover:ring-green/45',
    icon: 'fill-green group-hover:fill-green-light',
  },
  Videos: {
    well: 'bg-linear-to-br from-blue/22 to-blue/6 ring-blue/25 group-hover:ring-blue/45',
    icon: 'fill-blue group-hover:brightness-110',
  },
  Audios: {
    well: 'bg-linear-to-br from-violet-400/18 to-violet-400/5 ring-violet-400/22 group-hover:ring-violet-400/40',
    icon: 'fill-violet-300 group-hover:fill-violet-200',
  },
  Documents: {
    well: 'bg-linear-to-br from-amber-400/18 to-amber-400/5 ring-amber-400/22 group-hover:ring-amber-400/40',
    icon: 'fill-amber-200/90 group-hover:fill-amber-100',
  },
};

const AttachmentMenu = ({
  onClose,
  onFileSelect,
  clipIconRef,
}: AttachmentMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 640px)');

  const handleUpload = useCallback(
    (files: FileList | null, limits: UploadLimits, type: string) => {
      if (!files) return;
      const error = validateFiles(files, limits.individual, limits.cumulative);
      if (error) { toast.error(error); return; }
      onFileSelect(type, Array.from(files));
      onClose();
    },
    [onClose, onFileSelect],
  );

  useEffect(() => {
    if (!isDesktop) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        clipIconRef.current &&
        !clipIconRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose, clipIconRef, isDesktop]);

  const panel = (
    <div className="relative overflow-hidden px-2 py-1.5 sm:px-2 sm:py-2">
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.12),transparent_70%)]"
        aria-hidden
      />

      <div className="relative grid grid-cols-4 gap-1 sm:gap-1.5">
        {Object.values(UPLOAD_TYPES).map(({ title, Icon, accept, limits }) => {
          const accent = TILE_STYLE[title] ?? TILE_STYLE.Documents;
          return (
            <button
              key={title}
              type="button"
              className="group flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1 transition active:scale-[0.97] sm:gap-1.5 sm:px-1 sm:py-2"
              onClick={(e: ReactMouseEvent) => {
                e.stopPropagation();
                document.getElementById(`${title}-input`)?.click();
              }}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl ring-1 transition duration-200 sm:h-9 sm:w-9 ${accent.well}`}
              >
                <Icon className={`h-4 w-4 transition duration-200 sm:h-4.5 sm:w-4.5 ${accent.icon}`} />
              </span>
              <span className="max-w-full truncate text-[10px] font-medium text-body-300 transition group-hover:text-body">
                {title}
              </span>
              <input
                type="file"
                id={`${title}-input`}
                name="files"
                accept={accept}
                multiple={true}
                className="hidden"
                onChange={(e) => handleUpload(e.target.files, limits, title)}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  const shellClass =
    'overflow-hidden rounded-2xl border border-white/10 bg-[rgba(33,26,42,0.98)] shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl';

  if (!isDesktop) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" aria-hidden onClick={onClose} />
        <div
          className={`fixed inset-x-3 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3rem))] z-40 ${shellClass}`}
        >
          {panel}
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div ref={menuRef} className={`absolute bottom-14 right-0 z-30 ${shellClass}`}>
      {panel}
    </div>
  );
};

export default AttachmentMenu;
