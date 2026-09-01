import UserFilterChip from '@/components/admin/shared/UserFilterChip';
import type { UserFilterOption } from '@/types/admin';
import { ADMIN_MIN_SEARCH_LEN, ATTACHMENT_KIND_TABS } from '@/constants/admin/attachments';
import { attachmentSectionTitle } from '@/utils/admin/attachments';
import type { AttachmentKindFilter } from '@/types/admin';

type KindFilterTabsProps = {
  kindFilter: AttachmentKindFilter;
  onKindChange: (kind: AttachmentKindFilter) => void;
  flatCount: number;
  linkCount: number;
  senderFilter: UserFilterOption | null;
  onSenderChange: (sender: UserFilterOption | null) => void;
  debouncedSearch: string;
  searchText: string;
  showMinSearchHint: boolean;
  onClearSearch: () => void;
  isSelectMode: boolean;
  onSelectToggle: () => void;
};

const KindFilterTabs = ({
  kindFilter,
  onKindChange,
  flatCount,
  linkCount,
  senderFilter,
  onSenderChange,
  debouncedSearch,
  searchText,
  showMinSearchHint,
  onClearSearch,
  isSelectMode,
  onSelectToggle,
}: KindFilterTabsProps) => (
  <>
    <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-semibold text-xl leading-none tracking-tight text-body">
          {attachmentSectionTitle(kindFilter)}
        </h2>
        <p className="mt-1.5 text-sm text-body-300">
          {senderFilter
            ? `Shared by ${senderFilter.name}${debouncedSearch ? ' · ' + debouncedSearch : ''}`
            : debouncedSearch
              ? `Results for "${debouncedSearch}"`
              : kindFilter === 'deleted'
                ? 'Files and links from deleted messages'
                : 'Everything shared across all chats'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {showMinSearchHint && (
          <p className="text-xs text-body-300/55">Type at least {ADMIN_MIN_SEARCH_LEN} chars</p>
        )}
        {searchText && (
          <button
            type="button"
            onClick={onClearSearch}
            className="text-xs font-medium text-body-300/60 transition hover:text-body"
          >
            Clear
          </button>
        )}
      </div>
    </div>

    <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
      {ATTACHMENT_KIND_TABS.map((tab) => {
        const active = kindFilter === tab.id;
        const tabCount =
          tab.id === 'links' ? linkCount : tab.id === 'deleted' ? flatCount + linkCount : flatCount;
        const activeClass =
          tab.id === 'deleted'
            ? 'border-red/35 bg-red/10 text-red'
            : 'border-blue/35 bg-blue/10 text-blue';
        const badgeClass =
          tab.id === 'deleted' ? 'bg-red/15 text-red' : 'bg-blue/15 text-blue';

        return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onKindChange(tab.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            active
              ? activeClass
              : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
          }`}
        >
          {tab.label}
          {active && tabCount > 0 ? (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${badgeClass}`}>
              {tabCount}
            </span>
          ) : null}
        </button>
        );
      })}
      <UserFilterChip value={senderFilter} onChange={onSenderChange} label="Sender" />
      </div>

      <button
        type="button"
        onClick={onSelectToggle}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          isSelectMode
            ? 'border-blue/35 bg-blue/10 text-blue hover:bg-blue/15'
            : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
        }`}
      >
        {isSelectMode ? 'Cancel' : 'Select'}
      </button>
    </div>
  </>
);

export default KindFilterTabs;
