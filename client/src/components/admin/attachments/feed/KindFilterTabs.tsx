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
}: KindFilterTabsProps) => (
  <>
    <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl leading-none tracking-tight text-body">
          {attachmentSectionTitle(kindFilter)}
        </h2>
        <p className="mt-1.5 text-sm text-body-300">
          {senderFilter
            ? `Shared by ${senderFilter.name}${debouncedSearch ? ' · ' + debouncedSearch : ''}`
            : debouncedSearch
              ? `Results for "${debouncedSearch}"`
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

    <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
      {ATTACHMENT_KIND_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onKindChange(tab.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            kindFilter === tab.id
              ? 'border-blue/35 bg-blue/10 text-blue'
              : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
          }`}
        >
          {tab.label}
          {kindFilter === tab.id && (flatCount > 0 || linkCount > 0) ? (
            <span className="rounded-full bg-blue/15 px-1.5 py-0.5 text-[10px] tabular-nums text-blue">
              {tab.id === 'links' ? linkCount : flatCount}
            </span>
          ) : null}
        </button>
      ))}
      <UserFilterChip value={senderFilter} onChange={onSenderChange} label="Sender" />
    </div>
  </>
);

export default KindFilterTabs;
