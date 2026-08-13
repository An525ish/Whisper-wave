import EmptyState from '@/shared/components/ui/EmptyState'
import LinkIcon from '@/shared/components/icons/Link'
import type { SharedLink } from './types'

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M11 3h6v6M17 3l-8 8M7 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 13V5a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

type LinksListProps = {
  links: SharedLink[]
  query: string
  onCopyLink: (url: string) => void
}

const LinksList = ({ links, query, onCopyLink }: LinksListProps) => {
  if (links.length === 0) {
    return (
      <EmptyState
        className="py-10"
        imageSrc="/images/no-link.svg"
        imageAlt="no links"
        imageClassName="w-20 opacity-45"
        titleClassName="mt-2 text-center text-xs text-body-300"
        title={query ? 'No links match your search' : 'No links yet'}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <div
          key={`${link.messageId}-${link.url}`}
          className="flex items-center gap-2 rounded-2xl bg-background-alt/55 p-2.5 ring-1 ring-border/45"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-green-dark/70 to-primary ring-1 ring-green/25">
            <LinkIcon className="h-4 w-4 stroke-green" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-body">{link.host}</p>
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-body-300">{link.url}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCopyLink(link.url)}
              className="inline-flex items-center gap-1 rounded-lg bg-background-alt px-2 py-1.5 text-[11px] font-medium text-body-700 ring-1 ring-border/60 transition hover:text-white"
            >
              <CopyIcon className="h-3.5 w-3.5" /> Copy
            </button>
            <a
              href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-green/10 px-2 py-1.5 text-[11px] font-medium text-green ring-1 ring-green/25 transition hover:bg-green/15"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" /> Open
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LinksList
