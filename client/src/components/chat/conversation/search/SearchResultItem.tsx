import { getFirstName } from '@/utils/helpers'
import dayjs from 'dayjs'
import { highlightSnippet } from '@/utils/highlight'
import type { ChatSearchHit } from '@/types/chat'
import { transformImage, isGifFile } from '@/utils/fileFormat'

type SearchResultItemProps = {
  hit: ChatSearchHit
  isActive: boolean
  mine: boolean
  query: string
  mode: string
  draft: string
  onClick: () => void
}

type AttachmentKind = 'image' | 'video' | 'audio' | 'other'

const getAttachmentKind = (att: { name?: string; fileType?: string; url?: string }): AttachmentKind => {
  const ft = att.fileType?.toLowerCase() ?? ''
  const name = att.name?.toLowerCase() ?? ''
  const url = att.url?.toLowerCase() ?? ''

  if (ft === 'video' || ft.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/.test(url) || /\.(mp4|mov|webm|avi|mkv|m4v)$/.test(name)) return 'video'
  if (ft === 'audio' || ft.startsWith('audio/') || /\.(mp3|wav|ogg|aac)(\?|$)/.test(url) || /\.(mp3|wav|ogg|aac)$/.test(name)) return 'audio'
  if (ft === 'image' || ft === 'gif' || ft.startsWith('image/') || isGifFile(url, name) || /\.(png|jpg|jpeg|webp|heic|avif|bmp|gif)(\?|$)/.test(url) || /\.(png|jpg|jpeg|webp|heic|avif|bmp|gif)$/.test(name)) return 'image'
  return 'other'
}

// ── Thumbnail shown in media-mode results ──────────────────────────────────
const MediaThumb = ({ att, isActive }: { att: NonNullable<ChatSearchHit['attachments']>[number]; isActive: boolean }) => {
  const kind = getAttachmentKind(att)
  const url = att.url

  const ringClass = isActive ? 'ring-green/50' : 'ring-transparent'

  if ((kind === 'image') && url) {
    const thumbUrl = isGifFile(url, att.name) ? url : transformImage(url, 120)
    return (
      <span className={`relative block h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-2 ${ringClass}`}>
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </span>
    )
  }

  if (kind === 'video' && url) {
    return (
      <span className={`relative block h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-white/8 ring-2 ${ringClass}`}>
        {/* Static first-frame via Cloudinary poster or just a dark tile */}
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5 text-white/60">
            <path d="M6 4.5l14 7.5-14 7.5V4.5z" fill="currentColor" />
          </svg>
        </span>
      </span>
    )
  }

  if (kind === 'audio') {
    return (
      <span className={`relative block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-green/20 ring-2 ${ringClass}`}>
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-4.5 w-4.5 text-green">
            <path d="M12 3a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M5 12a7 7 0 0 0 14 0M12 19v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    )
  }

  return null
}

// ── Sender avatar used in messages / links mode ────────────────────────────
const SenderAvatar = ({ hit, mine, isActive }: { hit: ChatSearchHit; mine: boolean; isActive: boolean }) => (
  <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold ${mine ? 'bg-green/20 text-green' : 'bg-blue/15 text-blue'} ${isActive ? 'ring-2 ring-green/40' : ''}`}>
    {hit.sender.avatar ? (
      <img src={hit.sender.avatar} alt="" className="h-full w-full object-cover" />
    ) : (
      (mine ? 'Y' : getFirstName(hit.sender.name)?.[0] || '?').toUpperCase()
    )}
  </div>
)

const SearchResultItem = ({ hit, isActive, mine, query, mode, draft, onClick }: SearchResultItemProps) => {
  const att = hit.attachments?.[0]
  const isMediaMode = mode === 'media'
  const showThumb = isMediaMode && Boolean(att?.url)
  const preview = hit.content?.trim() || att?.name || 'Attachment'
  const searchQuery = mode === 'messages' ? query : draft

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full gap-2.5 rounded-xl px-2.5 py-2.5 text-left ring-1 transition ${
          isActive ? 'bg-green/10 ring-green/30' : 'bg-primary/25 ring-transparent hover:bg-primary/45 hover:ring-border/60'
        }`}
      >
        {showThumb && att ? (
          <MediaThumb att={att} isActive={isActive} />
        ) : (
          <SenderAvatar hit={hit} mine={mine} isActive={isActive} />
        )}

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
            {highlightSnippet(preview, searchQuery)}
          </p>
        </div>
      </button>
    </li>
  )
}

export default SearchResultItem
