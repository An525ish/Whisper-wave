import { ADMIN_MIN_SEARCH_LEN } from '../../../constants/users';
import type { SignupMethodFilter, SparkPassFilter } from '../../../types';
import { usersDirectorySubtitle } from '../../../utils/users';
import SignupMethodFilterTabs from './SignupMethodFilterTabs';

type Props = {
  querySearch: string;
  searchText: string;
  showMinSearchHint: boolean;
  signupMethod: SignupMethodFilter;
  onSignupMethodChange: (v: SignupMethodFilter) => void;
  sparkPass: SparkPassFilter;
  onSparkPassChange: (v: SparkPassFilter) => void;
  onClearSearch: () => void;
};

const UsersDirectoryHeader = ({
  querySearch,
  searchText,
  showMinSearchHint,
  signupMethod,
  onSignupMethodChange,
  sparkPass,
  onSparkPassChange,
  onClearSearch,
}: Props) => (
  <>
    <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
      <div>
        <h2 className="font-semibold text-xl leading-none tracking-tight text-body">Directory</h2>
        <p className="mt-1.5 text-sm text-body-300">{usersDirectorySubtitle(querySearch)}</p>
      </div>
      <div className="flex items-center gap-2">
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
    </div>
    <SignupMethodFilterTabs
      signupMethod={signupMethod}
      onSignupMethodChange={onSignupMethodChange}
      sparkPass={sparkPass}
      onSparkPassChange={onSparkPassChange}
    />
  </>
);

export default UsersDirectoryHeader;
