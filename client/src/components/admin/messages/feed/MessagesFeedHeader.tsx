import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/messages';
import { messagesFeedSubtitle } from '@/utils/admin/messages';
import type { UserFilterOption } from '@/types/admin';

type MessagesFeedHeaderProps = {
  senderFilter: UserFilterOption | null;
  querySearch: string;
  searchText: string;
  showMinSearchHint: boolean;
  onClearSearch: () => void;
};

const MessagesFeedHeader = ({
  senderFilter,
  querySearch,
  searchText,
  showMinSearchHint,
  onClearSearch,
}: MessagesFeedHeaderProps) => (
  <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="font-display text-xl leading-none tracking-tight text-body">Recent feed</h2>
      <p className="mt-1.5 text-sm text-body-300">
        {messagesFeedSubtitle(senderFilter, querySearch)}
      </p>
    </div>
    {showMinSearchHint && (
      <p className="text-xs text-body-300/55">
        Type at least {ADMIN_MIN_SEARCH_LEN} characters to search content
      </p>
    )}
    {searchText && (
      <button
        type="button"
        onClick={onClearSearch}
        className="text-xs font-medium text-body-300/60 transition hover:text-body"
      >
        Clear search
      </button>
    )}
  </div>
);

export default MessagesFeedHeader;
