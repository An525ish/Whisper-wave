import EmptyState from '@/shared/components/ui/EmptyState'
import { fileData, fileFormat } from '@/shared/utils/fileFormat'
import type { MouseEvent } from 'react'
import type { MediaFile } from './types'

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M11 3h6v6M17 3l-8 8M7 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type FilesListProps = {
  files: MediaFile[]
  query: string
  onOpenDocument: (e: MouseEvent, url: string | undefined, name: string | undefined) => void
}

const FilesList = ({ files, query, onOpenDocument }: FilesListProps) => {
  if (files.length === 0) {
    return (
      <EmptyState
        className="py-10"
        imageSrc="/images/no-documents.svg"
        imageAlt="no documents"
        imageClassName="w-20 opacity-45"
        titleClassName="mt-2 text-center text-xs text-body-300"
        title={query ? 'No files match your search' : 'No documents yet'}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map(({ _id, publicId, name, url }, index) => {
        const fileExtension = fileFormat(name)
        const file = fileData.find((item) => item.docType === fileExtension)
        const isPdf = fileExtension === 'pdf'
        return (
          <button
            type="button"
            key={_id ?? publicId ?? url ?? index}
            onClick={(e) => onOpenDocument(e, url, name)}
            className="group flex w-full items-center gap-3 rounded-2xl bg-background-alt/55 px-3 py-3 text-left ring-1 ring-border/45 transition hover:bg-background-alt hover:ring-green/35"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/80 ring-1 ring-border/50">
              <img src={file?.icon} alt="" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium capitalize text-body">{name}</span>
              <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-body-300">
                {fileExtension || 'file'}{' · '}{isPdf ? 'Open in browser' : 'Download'}
              </span>
            </span>
            <ExternalLinkIcon className="h-4 w-4 shrink-0 text-body-300 transition group-hover:text-green" />
          </button>
        )
      })}
    </div>
  )
}

export default FilesList
