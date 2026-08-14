import ChevronLeft from '@/shared/components/icons/ChevronLeft'
import { useSharedContent } from '@/features/profile/hooks/useSharedContent'
import MediaGrid from '@/features/profile/components/shared-content/MediaGrid'
import FilesList from '@/features/profile/components/shared-content/FilesList'
import LinksList from '@/features/profile/components/shared-content/LinksList'
import type { MouseEvent } from 'react'
import { SHARED_CONTENT_TABS, PHOTO_FILTER_OPTIONS } from '@/features/profile/constants/sharedContent'
import type { MediaFile, SharedLink, PhotoFilter, SharedContentTab } from '@/features/profile/components/shared-content/types'


type SharedContentSheetProps = {
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  links: SharedLink[]
  initialTab: SharedContentTab
  onClose: () => void
  onOpenPhoto: (file: MediaFile) => void
  onOpenDocument: (e: MouseEvent, url: string | undefined, name: string | undefined) => void
}


const tabIconClass = (selected: boolean, strokeOnly = false) =>
  strokeOnly
    ? `h-4 w-4 shrink-0 transition ${selected ? 'text-green' : 'text-body-300'}`
    : `h-4 w-4 shrink-0 transition ${selected ? 'fill-green stroke-green' : 'fill-body-300 stroke-body-300'}`

const filterIconClass = (selected: boolean, strokeOnly = false) =>
  strokeOnly
    ? `h-3.5 w-3.5 shrink-0 ${selected ? 'text-green' : 'text-body-300'}`
    : `h-3.5 w-3.5 shrink-0 ${selected ? 'fill-green stroke-green' : 'fill-body-300 stroke-body-300'}`

const countBadgeClass = (selected: boolean) =>
  `grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums leading-none ${
    selected ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35' : 'bg-border/50 text-body-300 ring-1 ring-inset ring-white/4'
  }`

const filterCountBadgeClass = (selected: boolean) =>
  `inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm px-1 py-0 text-[10px] font-semibold tabular-nums leading-none ${
    selected ? 'bg-white/12 text-white/85' : 'bg-background-alt/90 text-body-300'
  }`



const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M9 3.5a5.5 5.5 0 103.47 9.79l3.23 3.23a.75.75 0 101.06-1.06l-3.23-3.23A5.5 5.5 0 009 3.5z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const SharedContentSheet = ({ mediaFiles, docFiles, links, initialTab, onClose, onOpenPhoto, onOpenDocument }: SharedContentSheetProps) => {
  const { activeTab, setActiveTab, query, setQuery, photoFilter, setPhotoFilter, entered,
    filteredPhotos, filteredDocs, filteredLinks, photoCounts, totalShared, copyLink } =
    useSharedContent({ mediaFiles, docFiles, links, initialTab, onClose })

  const activeIndex = SHARED_CONTENT_TABS.findIndex((t) => t.id === activeTab)
  const activeMeta = SHARED_CONTENT_TABS[activeIndex] ?? SHARED_CONTENT_TABS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:p-4 md:items-center md:justify-end md:pr-6 lg:pr-8" role="dialog" aria-modal="true" aria-labelledby="shared-content-title">
      <button type="button" aria-label="Close shared content"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${entered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-110 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.98] opacity-0 md:translate-y-0 md:translate-x-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border/80 md:hidden" />

        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mb-3 flex items-start gap-2">
            <button type="button" onClick={onClose}
              className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-background-alt/60 text-body transition hover:border-green/40 hover:bg-primary/80 hover:text-white"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="shared-content-title" className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">Shared content</h2>
              <p className="mt-0.5 min-h-5 truncate text-xs text-body-300 sm:text-sm">
                Browse everything shared in this chat
                {totalShared > 0 ? <span className="text-body-700"> · {totalShared} item{totalShared === 1 ? '' : 's'}</span> : null}
              </p>
            </div>
          </div>

          <div className="relative" role="tablist" aria-label="Shared content categories">
            <div className="absolute inset-x-0 bottom-0 h-px bg-border/45" aria-hidden />
            <span className="pointer-events-none absolute bottom-0 z-10 h-0.5 rounded-full bg-linear-to-r from-green-gradFrom via-green to-green-gradTo transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: `${activeIndex * 33.333}%`, width: '33.333%' }} aria-hidden />
            <div className="grid grid-cols-3">
              {SHARED_CONTENT_TABS.map((tab) => {
                const selected = activeTab === tab.id
                const count = tab.id === 'photos' ? mediaFiles.length : tab.id === 'attachments' ? docFiles.length : links.length
                const TabIcon = tab.Icon
                return (
                  <button key={tab.id} type="button" role="tab" aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative inline-flex h-11 w-full items-center justify-center gap-2 pb-2.5 transition-colors duration-200 ${selected ? 'text-white' : 'text-body-300 hover:text-body-700'}`}
                  >
                    <TabIcon className={tabIconClass(selected, tab.strokeOnly)} />
                    <span className="truncate text-xs font-medium leading-none">{tab.label}</span>
                    <span className={countBadgeClass(selected)}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-primary/25 p-2.5 ring-1 ring-inset ring-white/4">
            <div className="group/search relative flex h-9 items-center gap-2.5 rounded-full border border-[rgba(235,236,236,0.28)] bg-background/80 px-3 shadow-[inset_0_1px_0_rgba(235,236,236,0.08)] transition focus-within:border-[rgba(235,236,236,0.45)] focus-within:bg-background focus-within:shadow-[0_0_18px_rgba(235,236,236,0.07)]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/80 text-body-300 transition group-focus-within/search:text-green">
                <SearchIcon className="h-3.5 w-3.5" />
              </span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find ${activeMeta.label.toLowerCase()}…`}
                className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
            </div>
            <div className="mt-2 h-9">
              {activeTab === 'photos' && photoCounts.all > 0 ? (
                <div className="relative flex h-full items-stretch overflow-x-auto rounded-xl bg-black-light/35 p-0.5 scrollbar-hide">
                  {PHOTO_FILTER_OPTIONS.map(({ key, label, Icon, strokeOnly }, index, arr) => {
                    const count = photoCounts[key]
                    if (key !== 'all' && count === 0) return null
                    const selected = photoFilter === key
                    const visibleBefore = arr.slice(0, index).filter((item) => item.key === 'all' || photoCounts[item.key as PhotoFilter] > 0).length
                    return (
                      <div key={key} className="flex min-w-0 flex-1 items-stretch">
                        {visibleBefore > 0 ? <span className="my-1.5 w-px shrink-0 bg-border/35" aria-hidden /> : null}
                        <button type="button" onClick={() => setPhotoFilter(key)}
                          className={`flex min-w-18 flex-1 items-center justify-center gap-1.5 rounded-[0.6rem] px-2 py-1 text-[11px] font-medium transition duration-200 ${selected ? 'bg-primary text-white shadow-[0_1px_8px_rgba(0,0,0,0.25)]' : 'text-body-300 hover:text-body-700'}`}
                        >
                          <Icon className={filterIconClass(selected, strokeOnly)} />
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="truncate">{label}</span>
                            <span className={filterCountBadgeClass(selected)}>{count}</span>
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center gap-2 rounded-xl bg-black-light/25 px-3">
                  <span className="h-px flex-1 bg-gradient-line-fade-dark opacity-60" />
                  <span className="shrink-0 text-[11px] text-body-300">{activeMeta.hint}</span>
                  <span className="h-px flex-1 bg-gradient-line-fade-dark opacity-60" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-hide sm:px-5 sm:py-4">
          {activeTab === 'photos' && <MediaGrid files={filteredPhotos} query={query} photoFilter={photoFilter} onOpenPhoto={onOpenPhoto} />}
          {activeTab === 'attachments' && <FilesList files={filteredDocs} query={query} onOpenDocument={onOpenDocument} />}
          {activeTab === 'links' && <LinksList links={filteredLinks} query={query} onCopyLink={copyLink} />}
        </div>
      </div>
    </div>
  )
}

export default SharedContentSheet
