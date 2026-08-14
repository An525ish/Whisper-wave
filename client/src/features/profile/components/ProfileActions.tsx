import SkeletonBox from '@/shared/components/skeletons/SkeletonBox'
import EmptyState from '@/shared/components/ui/EmptyState'
import { RetryableMediaImage, RetryableMediaVideo } from '@/shared/components/media/RetryableMedia'
import ImagesIcon from '@/shared/components/icons/Images'
import FilesIcon from '@/shared/components/icons/FilesIcon'
import LinkIcon from '@/shared/components/icons/Link'
import { fileData, fileFormat, getMediaDisplayName, getMediaKindFromFile } from '@/shared/utils/fileFormat'
import type { MouseEvent } from 'react'
import type { MediaFile, SharedLink, SharedContentTab } from '@/features/profile/components/shared-content/types'

type ProfileActionsProps = {
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  sharedLinks: SharedLink[]
  isMediaLoading: boolean
  openSharedSheet: (tab: SharedContentTab) => void
  openImageViewerForFile: (file: MediaFile) => void
  handleFileAction: (e: MouseEvent, url: string | undefined, name: string | undefined) => Promise<void>
}

const sectionIconClass = 'h-4 w-4 shrink-0 fill-body-300 stroke-body-300'
const sectionLinkIconClass = 'h-4 w-4 shrink-0 stroke-body-300'

const ShowAllButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button" onClick={onClick}
    className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-body-300 transition duration-200 hover:text-green"
  >
    <span className="underline-offset-4 group-hover:underline decoration-green/50">Show all</span>
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className="h-3 w-3 translate-x-0 transition duration-200 group-hover:translate-x-0.5">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
)

const renderMediaThumbnail = (file: MediaFile) => {
  const kind = getMediaKindFromFile(file)
  if (kind === 'image') {
    return (
      <RetryableMediaImage
        url={file.url ?? ''} alt={getMediaDisplayName({ name: file.name, url: file.url, publicId: file.publicId, fileType: file.fileType })}
        className="w-full aspect-5/4 bg-primary rounded-lg object-cover" fallbackIconClassName="h-10 w-10"
      />
    )
  }
  if (kind === 'video') {
    return (
      <RetryableMediaVideo
        url={file.url ?? ''} className="w-full aspect-5/4 bg-primary object-cover rounded-lg"
        fallbackIconClassName="h-10 w-10" muted playsInline preload="metadata"
      />
    )
  }
  return (
    <div className="w-full aspect-5/4 bg-primary rounded-lg flex items-center justify-center">
      <img src="/icons/music-icon.svg" alt="Audio" className="w-10 h-10 opacity-80" />
    </div>
  )
}

const ProfileActions = ({
  mediaFiles, docFiles, sharedLinks, isMediaLoading, openSharedSheet, openImageViewerForFile, handleFileAction,
}: ProfileActionsProps) => (
  <>
    <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
      <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
        <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
          <ImagesIcon className={sectionIconClass} /> Photos & Multimedia
        </p>
        <ShowAllButton onClick={() => openSharedSheet('photos')} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {isMediaLoading
          ? Array(6).fill(0).map((_, i) => <SkeletonBox key={i} className="w-full aspect-5/4 rounded-lg bg-background-alt" />)
          : mediaFiles.length === 0
            ? <EmptyState className="col-span-3 py-4" imageSrc="/images/no-media.svg" imageAlt="no-media" imageClassName="w-16 opacity-45" titleClassName="text-center text-body-300 text-xs mt-2" title="No media yet" />
            : mediaFiles.slice(0, 6).map((file, index) => (
                <button type="button" key={file._id ?? file.publicId ?? file.url ?? index}
                  onClick={() => openImageViewerForFile(file)}
                  className="overflow-hidden rounded-lg ring-1 ring-border/50 hover:ring-green/40 hover:opacity-90 transition duration-200 p-0"
                >
                  {renderMediaThumbnail(file)}
                </button>
              ))}
      </div>
    </section>

    <section className="mt-3 rounded-2xl bg-primary/35 px-3 py-3.5">
      <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
        <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
          <FilesIcon className={sectionIconClass} /> Attachments
        </p>
        <ShowAllButton onClick={() => openSharedSheet('attachments')} />
      </div>
      <div className="flex flex-col gap-1.5">
        {isMediaLoading
          ? Array(3).fill(0).map((_, i) => <SkeletonBox key={i} className="w-full h-10 rounded-xl bg-background-alt" />)
          : docFiles.length === 0
            ? <EmptyState imageSrc="/images/no-documents.svg" imageAlt="no-documents" imageClassName="w-16 opacity-45" titleClassName="text-center text-body-300 text-xs mt-2" title="No documents yet" />
            : docFiles.slice(0, 3).map(({ _id, publicId, name: docName, url }, index) => {
                const fileExtension = fileFormat(docName)
                const file = fileData.find((item) => item.docType === fileExtension)
                return (
                  <button type="button" key={_id ?? publicId ?? url ?? index}
                    onClick={(e) => handleFileAction(e, url, docName)}
                    className="flex w-full items-center gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 hover:ring-green/35 hover:bg-background-alt transition duration-200"
                  >
                    <img src={file?.icon} alt="" className="w-5 h-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-sm capitalize text-body-700">{docName}</span>
                  </button>
                )
              })}
      </div>
    </section>

    <section className="mt-3 rounded-2xl bg-primary/35 px-3 py-3.5">
      <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
        <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
          <LinkIcon className={sectionLinkIconClass} /> Links
        </p>
        {sharedLinks.length > 0 ? <ShowAllButton onClick={() => openSharedSheet('links')} /> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        {isMediaLoading
          ? Array(3).fill(0).map((_, i) => <SkeletonBox key={i} className="w-full h-12 rounded-xl bg-background-alt" />)
          : sharedLinks.length === 0
            ? <EmptyState className="py-4" imageSrc="/images/no-link.svg" imageAlt="no links" imageClassName="w-20 opacity-45" titleClassName="text-center text-body-300 text-xs mt-2" title="No links yet" />
            : sharedLinks.slice(0, 3).map((link) => (
                <a key={`${link.messageId}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-start gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 hover:ring-green/35 hover:bg-background-alt transition duration-200"
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-dark/60 ring-1 ring-green/25">
                    <LinkIcon className="h-4 w-4 stroke-green" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-body">{link.host}</span>
                    <span className="block truncate text-[11px] text-body-300 mt-0.5">{link.url}</span>
                  </span>
                </a>
              ))}
      </div>
    </section>
  </>
)

export default ProfileActions
