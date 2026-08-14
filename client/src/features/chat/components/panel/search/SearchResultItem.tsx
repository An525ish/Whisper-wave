import { getFirstName } from '@/shared/utils/helper'
import dayjs from 'dayjs'
import { highlightSnippet } from '@/shared/utils/highlight'
import type { ChatSearchHit } from '@/features/chat/types'

type SearchResultItemProps = {
  hit: ChatSearchHit
  isActive: boolean
  mine: boolean
  query: string
  mode: string
  draft: string
  onClick: () => void
}

const SearchResultItem = ({ hit, isActive, mine, query, mode, draft, onClick }: SearchResultItemProps) => {
  const preview = hit.content?.trim() || hit.attachments?.[0]?.name || 'Attachment'

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full gap-2.5 rounded-xl px-2.5 py-2.5 text-left ring-1 transition ${
          isActive ? 'bg-green/10 ring-green/30' : 'bg-primary/25 ring-transparent hover:bg-primary/45 hover:ring-border/60'
        }`}
      >
        <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold ${mine ? 'bg-green/20 text-green' : 'bg-blue/15 text-blue'}`}>
          {hit.sender.avatar ? (
            <img src={hit.sender.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (mine ? 'Y' : getFirstName(hit.sender.name)?.[0] || '?').toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-body">
              {mine ? 'You' : getFirstName(hit.sender.name)}
            </span>
            <time className="shrink-0 text-[10px] text-body-300">
              {dayjs(hit.createdAt).format('D MMM · h:mm A')}
            </time>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-body-700">
            {highlightSnippet(preview, mode === 'messages' ? query : draft)}
          </p>
        </div>
      </button>
    </li>
  )
}

export default SearchResultItem
