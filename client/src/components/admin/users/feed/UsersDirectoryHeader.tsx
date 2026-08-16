import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/users';
import { usersDirectorySubtitle } from '@/utils/admin/users';

type UsersDirectoryHeaderProps = {
  querySearch: string;
  searchText: string;
  showMinSearchHint: boolean;
  onClearSearch: () => void;
};

const UsersDirectoryHeader = ({
  querySearch,
  searchText,
  showMinSearchHint,
  onClearSearch,
}: UsersDirectoryHeaderProps) => (
  <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
    <div>
      <h2 className="font-display text-xl leading-none tracking-tight text-body">Directory</h2>
      <p className="mt-1.5 text-sm text-body-300">{usersDirectorySubtitle(querySearch)}</p>
    </div>
    {showMinSearchHint && (
      <p className="text-xs text-body-300/55">
        Type at least {ADMIN_MIN_SEARCH_LEN} characters to search
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

export default UsersDirectoryHeader;
