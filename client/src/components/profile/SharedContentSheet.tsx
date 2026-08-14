import ChevronLeft from '@/components/ui/icons/ChevronLeft'
import CountBadge from '@/components/ui/CountBadge'
import { useSharedContent } from '@/hooks/profile/useSharedContent'
import MediaGrid from '@/components/profile/shared-content/MediaGrid'
import FilesList from '@/components/profile/shared-content/FilesList'
import LinksList from '@/components/profile/shared-content/LinksList'
import Tabs from '@/components/ui/swipeable-tabs/Tab'
import type { MouseEvent } from 'react'
import { SHARED_CONTENT_TABS, PHOTO_FILTER_OPTIONS } from '@/constants/profileContent'
import type { MediaFile, SharedLink, PhotoFilter, SharedContentTab } from '@/components/profile/shared-content/types'


type SharedContentSheetProps = {
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  links: SharedLink[]
  initialTab: SharedContentTab
  onClose: () => void
  onOpenPhoto: (file: MediaFile) => void
  onOpenDocument: (e: MouseEvent, url: string | undefined, name: string | undefined) => void
}


const filterIconClass = (selected: boolean, strokeOnly = false) =>
  strokeOnly
    ? `h-3.5 w-3.5 shrink-0 ${selected ? 'text-green' : 'text-body-300'}`
    : `h-3.5 w-3.5 shrink-0 ${selected ? 'fill-green stroke-green' : 'fill-body-300 stroke-body-300'}`

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
          <div className="mb-3.5 flex items-center gap-2.5">
            <button type="button" onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 id="shared-content-title" className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Shared content
                </h2>
                {totalShared > 0 ? (
                  <CountBadge count={totalShared} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-body-300 sm:text-sm">
                {activeMeta.hint}
              </p>
            </div>
          </div>

          <Tabs
            variant="underline"
            ariaLabel="Shared content categories"
            activeTabIndex={activeIndex}
            handleTabChange={(index) => {
              const next = SHARED_CONTENT_TABS[index]
              if (next) setActiveTab(next.id)
            }}
            tabsData={SHARED_CONTENT_TABS.map((tab) => {
              const TabIcon = tab.Icon
              const count =
                tab.id === 'photos'
                  ? mediaFiles.length
                  : tab.id === 'attachments'
                    ? docFiles.length
                    : links.length
              return {
                id: tab.id,
                name: tab.label,
                count,
                icon: (
                  <TabIcon
                    className={`h-4 w-4 ${tab.strokeOnly ? '' : 'fill-current stroke-current'}`}
                  />
                ),
              }
            })}
          />

          <div className="mt-3">
            <div className="group/search relative flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-black-light/35 px-3 transition focus-within:border-green/35 focus-within:bg-background/80 focus-within:shadow-[0_0_18px_rgba(1,195,109,0.08)]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-body-300 transition group-focus-within/search:text-green">
                <SearchIcon className="h-3.5 w-3.5" />
              </span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find ${activeMeta.label.toLowerCase()}…`}
                className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
            </div>
            {activeTab === 'photos' && photoCounts.all > 0 ? (
              <div className="relative mt-2 flex h-9 items-stretch overflow-x-auto rounded-xl bg-black-light/35 p-0.5 scrollbar-hide">
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
            ) : null}
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
