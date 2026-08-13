import ChevronLeft from '@/shared/components/icons/ChevronLeft'
import { useChatSearch } from '@/features/chat/hooks/useChatSearch'
import SearchFilters from '@/features/chat/components/panel/search/SearchFilters'
import SearchResultItem from '@/features/chat/components/panel/search/SearchResultItem'
import SearchDatePicker from '@/features/chat/components/panel/search/SearchDatePicker'
import dayjs from 'dayjs'

export type ChatSearchHit = {
  _id: string
  content?: string
  createdAt: string
  sender: { _id: string; name: string; avatar?: string }
  attachments?: Array<{ name?: string; fileType?: string }>
}

type ChatSearchProps = {
  chatId?: string
  open: boolean
  onClose: () => void
  onJumpToMessage: (messageId: string, query: string, options?: { closeSearch?: boolean }) => void
}

type SearchMode = 'messages' | 'media' | 'links' | 'date'

const MODES: Array<{ id: SearchMode; label: string; hint: string }> = [
  { id: 'messages', label: 'Text', hint: 'Words & phrases' },
  { id: 'media', label: 'Media', hint: 'Photos & files' },
  { id: 'links', label: 'Links', hint: 'Shared URLs' },
  { id: 'date', label: 'Date', hint: 'Jump to a day' },
]

const DATE_PRESETS = [
  { id: 'today', label: 'Today', daysAgo: 0 },
  { id: 'yesterday', label: 'Yesterday', daysAgo: 1 },
  { id: 'week', label: '7d ago', daysAgo: 7 },
  { id: 'month', label: '30d ago', daysAgo: 30 },
] as const

const SearchGlyph = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="m16.2 16.2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

const ModeIcon = ({ mode, className = 'h-4 w-4' }: { mode: SearchMode; className?: string }) => {
  if (mode === 'messages') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 8.5h10M7 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5.5 4.5h13A2.5 2.5 0 0 1 21 7v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.2a.6.6 0 0 1-1-.45V17.5H5.5A2.5 2.5 0 0 1 3 15V7a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
  if (mode === 'media') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m7.5 16.5 3.2-3.4 2.3 2.2 2.6-3.1 3.4 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (mode === 'links') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 14.5 7.8 16.2a3.2 3.2 0 0 1-4.5-4.5L7 8a3.2 3.2 0 0 1 4.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.5 9.5 16.2 7.8a3.2 3.2 0 1 1 4.5 4.5L17 16a3.2 3.2 0 0 1-4.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m10 14 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const ChatSearch = ({ chatId, open, onClose, onJumpToMessage }: ChatSearchProps) => {
  const s = useChatSearch({ chatId, open, onClose, onJumpToMessage })

  if (!open) return null

  const modeIndex = Math.max(0, MODES.findIndex((m) => m.id === s.mode))
  const activeMode = MODES[modeIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="chat-search-title">
      <button type="button" aria-label="Close search"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${s.entered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-105 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${s.entered ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />

        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mb-3 flex items-start gap-2">
            <button type="button" onClick={onClose}
              className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-background-alt/60 text-body transition hover:border-green/40 hover:bg-primary/80 hover:text-white"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="chat-search-title" className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">Find in chat</h2>
              <p className="mt-0.5 min-h-5 truncate text-xs text-body-300 sm:text-sm">
                {activeMode.hint}
                {s.searchEnabled ? <span className="text-body-700"> · {s.isFetching && s.total === 0 ? '…' : `${s.total} found`}</span> : null}
              </p>
            </div>
            {s.searchEnabled ? (
              <div className="mt-0.5 flex items-center overflow-hidden rounded-full border border-border/70 bg-background-alt/50 p-0.5">
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-body-300 transition hover:bg-primary/70 hover:text-body disabled:opacity-30"
                  onClick={() => s.jumpRelative(-1)} disabled={s.total === 0} aria-label="Previous match">
                  <ChevronLeft className="h-4 w-4 rotate-90" />
                </button>
                <span className="min-w-10 px-1 text-center text-[11px] font-semibold tabular-nums text-body">
                  {s.total === 0 ? '0' : s.activeIndex < 0 ? `–/${s.total}` : `${s.activeIndex + 1}/${s.total}`}
                </span>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-body-300 transition hover:bg-primary/70 hover:text-body disabled:opacity-30"
                  onClick={() => s.jumpRelative(1)} disabled={s.total === 0} aria-label="Next match">
                  <ChevronLeft className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative" role="tablist" aria-label="Search categories">
            <div className="absolute inset-x-0 bottom-0 h-px bg-border/45" aria-hidden />
            <div className="pointer-events-none absolute bottom-0 z-10 h-0.5 rounded-full bg-linear-to-r from-green-gradFrom via-green to-green-gradTo transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `calc(100% / ${MODES.length})`, left: `calc(${modeIndex} * 100% / ${MODES.length})` }} aria-hidden />
            <div className="grid grid-cols-4">
              {MODES.map((tab) => {
                const selected = s.mode === tab.id
                return (
                  <button key={tab.id} type="button" role="tab" aria-selected={selected}
                    onClick={() => s.handleModeChange(tab.id)}
                    className={`relative inline-flex h-11 w-full items-center justify-center gap-1.5 pb-2.5 transition-colors duration-200 ${selected ? 'text-green' : 'text-body-300 hover:text-body'}`}
                  >
                    <ModeIcon mode={tab.id} className={`h-4 w-4 shrink-0 transition ${selected ? 'text-green' : 'text-body-300'}`} />
                    <span className="truncate text-[11px] font-medium leading-none sm:text-xs">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {s.mode !== 'date' ? (
            <div className="mt-3 space-y-2.5">
              <div className="group/search relative flex h-10 items-center gap-2.5 rounded-full border border-[rgba(235,236,236,0.28)] bg-background/80 px-3 shadow-[inset_0_1px_0_rgba(235,236,236,0.08)] transition focus-within:border-[rgba(235,236,236,0.45)] focus-within:bg-background focus-within:shadow-[0_0_18px_rgba(235,236,236,0.07)]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/80 text-body-300 transition group-focus-within/search:text-green">
                  <SearchGlyph />
                </span>
                <input ref={s.inputRef} value={s.draft} onChange={(e) => s.setDraft(e.target.value)} onKeyDown={s.handleKeyDown}
                  placeholder={s.mode === 'media' ? 'Filter media…' : s.mode === 'links' ? 'Filter links…' : 'Search messages…'}
                  className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none"
                  aria-label="Search in conversation"
                />
              </div>
              <SearchFilters mode={s.mode} isGroup={s.isGroup} fromOptions={s.fromOptions} from={s.from} onFromChange={s.setFrom} />
            </div>
          ) : null}
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-hide sm:px-5 sm:py-4">
          {s.mode === 'date' ? (
            <div className="flex flex-col gap-1">
              <div className="my-3 flex justify-center gap-1.5 sm:my-4">
                {DATE_PRESETS.map((preset) => {
                  const iso = dayjs().subtract(preset.daysAgo, 'day').format('YYYY-MM-DD')
                  const selected = s.selectedDate === iso
                  const hasMessages = !s.presetDatesFetched || s.presetActiveSet.has(iso)
                  return (
                    <button key={preset.id} type="button" disabled={!hasMessages} onClick={() => s.setSelectedDate(iso)}
                      className={`rounded-full px-3 py-1.5 text-center text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'bg-green/25 text-green ring-1 ring-inset ring-green/35' : 'border border-border/70 bg-primary/40 text-body-700 hover:border-green/35 hover:text-body'}`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
              <SearchDatePicker chatId={chatId} value={s.selectedDate} onChange={s.setSelectedDate}
                onJump={s.handleJumpToSelectedDate} jumping={s.jumping} statusNote={s.dateJumpNote} enabled={open && s.mode === 'date'} />
              <div className="flex flex-col items-center justify-center px-6 py-6 text-center">
                <p className="text-sm font-medium leading-snug text-body">Every chat has a yesterday.</p>
                <p className="mt-1 text-xs leading-relaxed text-body-300">Pick a day and jump straight back.</p>
              </div>
            </div>
          ) : !s.searchEnabled ? (
            <div className="flex h-full min-h-36 flex-col items-center justify-center px-4 text-center">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-primary/40 text-green">
                <ModeIcon mode={s.mode} className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-body-700">
                {s.mode === 'media' ? 'Browse shared media' : s.mode === 'links' ? 'Browse shared links' : 'Type to search this chat'}
              </p>
              <p className="mt-1 text-xs text-body-300">Tap a result to jump in the thread</p>
            </div>
          ) : s.isFetching && s.total === 0 ? (
            <div className="space-y-2 py-1">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-primary/35" />)}
            </div>
          ) : s.isError ? (
            <p className="py-10 text-center text-sm text-body-300">Couldn't search right now</p>
          ) : s.total === 0 ? (
            <div className="flex h-full min-h-36 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-body-700">No matches</p>
              <p className="mt-1 text-xs text-body-300">{s.query ? `Nothing for "${s.query}"` : 'Try another filter'}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {[...s.hits].reverse().map((hit) => {
                const chronologicalIndex = s.hits.findIndex((row) => row._id === hit._id)
                const isActive = chronologicalIndex === s.activeIndex
                const mine = String(hit.sender._id) === s.userId
                return (
                  <SearchResultItem
                    key={hit._id}
                    hit={hit}
                    isActive={isActive}
                    mine={mine}
                    query={s.query}
                    mode={s.mode}
                    draft={s.draft}
                    onClick={() => s.jumpToHit(chronologicalIndex, { closeSearch: true })}
                  />
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatSearch
