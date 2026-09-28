import UserFilterChip from '@/features/admin/components/shared/UserFilterChip';
import { ADMIN_MIN_SEARCH_LEN } from '@/features/admin/constants/groups';
import type { UserFilterOption } from '@/features/admin/types';
import { groupsDirectorySubtitle } from '@/features/admin/utils/groups';

type GroupsDirectoryHeaderProps = {
  memberFilter: UserFilterOption | null;
  onMemberFilterChange: (value: UserFilterOption | null) => void;
  querySearch: string;
  searchText: string;
  showMinSearchHint: boolean;
  onClearSearch: () => void;
};

const GroupsDirectoryHeader = ({
  memberFilter,
  onMemberFilterChange,
  querySearch,
  searchText,
  showMinSearchHint,
  onClearSearch,
}: GroupsDirectoryHeaderProps) => (
  <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <h2 className="font-semibold text-xl leading-none tracking-tight text-body">Directory</h2>
      <p className="mt-1.5 text-sm text-body-300">
        {groupsDirectorySubtitle(memberFilter, querySearch)}
      </p>
      {showMinSearchHint && (
        <p className="mt-1.5 text-xs text-body-300/55">
          Type at least {ADMIN_MIN_SEARCH_LEN} characters to search
        </p>
      )}
      {searchText && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-1.5 text-xs font-medium text-body-300/60 transition hover:text-body"
        >
          Clear search
        </button>
      )}
    </div>
    <div className="shrink-0 pt-0.5">
      <UserFilterChip
        value={memberFilter}
        onChange={onMemberFilterChange}
        label="Member"
        popoverAlign="right"
      />
    </div>
  </div>
);

export default GroupsDirectoryHeader;
