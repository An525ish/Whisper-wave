import EmptyState from '@/shared/components/ui/EmptyState'
import { RetryableMediaImage, RetryableMediaVideo } from '@/shared/components/media/RetryableMedia'
import { getMediaDisplayName, getMediaKindFromFile } from '@/shared/utils/fileFormat'
import type { MediaFile } from './types'

const ExpandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M8 3H3v5M12 3h5v5M12 17h5v-5M8 17H3v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const renderThumbnail = (file: MediaFile) => {
  const kind = getMediaKindFromFile(file)
  if (kind === 'image') {
    return (
      <RetryableMediaImage
        url={file.url ?? ''}
        alt={getMediaDisplayName({ name: file.name, url: file.url, publicId: file.publicId, fileType: file.fileType })}
        transformWidth={400}
        className="aspect-square w-full bg-primary object-cover"
        fallbackIconClassName="h-9 w-9"
      />
    )
  }
  if (kind === 'video') {
    return (
      <RetryableMediaVideo
        url={file.url ?? ''}
        className="aspect-square w-full bg-primary object-cover"
        fallbackIconClassName="h-9 w-9"
        muted playsInline preload="metadata"
      />
    )
  }
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-linear-to-br from-green-dark/80 to-primary">
      <img src="/icons/music-icon.svg" alt="" className="h-10 w-10 opacity-90" />
    </div>
  )
}

const mediaTypeLabel = (file: MediaFile) => {
  const kind = getMediaKindFromFile(file)
  if (kind === 'video') return 'Video'
  if (kind === 'audio') return 'Audio'
  return 'Photo'
}

type MediaGridProps = {
  files: MediaFile[]
  query: string
  photoFilter: string
  onOpenPhoto: (file: MediaFile) => void
}

const MediaGrid = ({ files, query, photoFilter, onOpenPhoto }: MediaGridProps) => {
  if (files.length === 0) {
    return (
      <EmptyState
        className="py-10"
        imageSrc="/images/no-media.svg"
        imageAlt="no media"
        imageClassName="w-20 opacity-45"
        titleClassName="mt-2 text-center text-xs text-body-300"
        title={query || photoFilter !== 'all' ? 'No media matches your filters' : 'No photos or media yet'}
      />
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {files.map((file) => {
        const kind = getMediaKindFromFile(file)
        return (
          <button
            type="button"
            key={file._id ?? file.publicId ?? file.url}
            onClick={() => onOpenPhoto(file)}
            className="group relative overflow-hidden rounded-xl ring-1 ring-border/45 transition hover:ring-green/45 hover:shadow-[0_8px_24px_rgba(1,195,109,0.12)]"
          >
            {renderThumbnail(file)}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-1.5 opacity-0 transition group-hover:opacity-100">
              <span className="truncate text-[10px] font-medium text-white/90">{getMediaDisplayName(file)}</span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-black/45 text-white backdrop-blur-sm">
                <ExpandIcon className="h-3.5 w-3.5" />
              </span>
            </div>
            {kind !== 'image' ? (
              <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {mediaTypeLabel(file)}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default MediaGrid
