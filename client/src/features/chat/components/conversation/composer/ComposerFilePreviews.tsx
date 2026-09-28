import type { Dispatch, SetStateAction } from 'react';
import FilePreview from '@/features/chat/components/conversation/composer/attachment-menu/FilePreview';

type ImageQuality = 'standard' | 'hd';

type ComposerFilePreviewsProps = {
  attachments: File[];
  onRemoveFile: (file: File) => void;
  imageQuality: ImageQuality;
  setImageQuality?: Dispatch<SetStateAction<ImageQuality>>;
};

/**
 * The staged-attachment tray above the composer: a horizontally scrolling row of
 * thumbnails plus a vertical HD toggle that appears only when a compressible image
 * is queued. Purely presentational; the composer owns the attachment list.
 */
const ComposerFilePreviews = ({
  attachments,
  onRemoveFile,
  imageQuality,
  setImageQuality,
}: ComposerFilePreviewsProps) => {
  const hasCompressibleImage = attachments.some(
    (f) => f.type.startsWith('image/') && f.type !== 'image/gif',
  );
  return (
    <div className="absolute bottom-14 left-0 right-auto z-50 mb-2 flex max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border/70 bg-background-alt shadow-lg md:max-w-md">
      {/* Vertical HD strip — left edge of the panel */}
      {hasCompressibleImage && setImageQuality ? (
        <button
          type="button"
          role="switch"
          aria-checked={imageQuality === 'hd'}
          aria-label={imageQuality === 'hd' ? 'HD on' : 'HD off'}
          onClick={() => setImageQuality(imageQuality === 'hd' ? 'standard' : 'hd')}
          className={`relative flex w-7 shrink-0 flex-col items-center justify-center gap-2.5 overflow-hidden border-r transition-all duration-300 active:opacity-70 ${
            imageQuality === 'hd'
              ? 'border-green/20 bg-gradient-to-b from-green/20 via-green/10 to-transparent'
              : 'border-border/30 bg-transparent'
          }`}
        >
          {/* Left-edge glow bar */}
          <span className={`absolute inset-y-5 left-0 w-[2px] rounded-r-full transition-all duration-300 ${
            imageQuality === 'hd'
              ? 'bg-green shadow-[0_0_8px_3px_rgba(1,195,109,0.5)] opacity-100'
              : 'opacity-0'
          }`} />

          {/* Dot indicator */}
          <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
            imageQuality === 'hd'
              ? 'bg-green shadow-[0_0_6px_2px_rgba(1,195,109,0.7)]'
              : 'bg-white/15'
          }`} />

          {/* "HD" — vertical writing mode, reads top → bottom */}
          <span
            style={{ writingMode: 'vertical-lr' }}
            className={`text-[11px] font-black tracking-[0.12em] leading-none transition-all duration-300 ${
              imageQuality === 'hd' ? 'text-green' : 'text-white/25'
            }`}
          >
            HD
          </span>
        </button>
      ) : null}
      {/* Thumbnail scroll row */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain p-2 scrollbar-hide">
        {attachments.map((file) => (
          <FilePreview
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            onRemove={onRemoveFile}
          />
        ))}
      </div>
    </div>
  );
};

export default ComposerFilePreviews;
