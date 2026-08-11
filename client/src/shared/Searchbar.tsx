import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import searchIcon from '@/assets/search.svg';

type SearchbarProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  autoFocus?: boolean;
  placeholder?: string;
  width?: string;
  className?: string;
  expandable?: boolean;
};

/**
 * Unified search input.
 * - `expandable` (default true): icon → expand (chat header / dialogs)
 * - `expandable={false}`: always-open field (admin tables)
 */
export default function Searchbar({
  searchText,
  setSearchText,
  autoFocus = false,
  placeholder = 'Search...',
  width = 'w-40',
  className = '',
  expandable = true,
}: SearchbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(
    !expandable || Boolean(autoFocus),
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleCrossClick = () => {
    if (expandable) setIsSearchBarFocused(false);
    setSearchText('');
  };

  useEffect(() => {
    if (expandable && isSearchBarFocused) {
      inputRef.current?.focus();
    }
  }, [expandable, isSearchBarFocused]);

  if (!expandable) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={searchIcon}
          alt="Search Icon"
          className="absolute left-2 top-[7px] h-6"
        />
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-10 w-full rounded-3xl border border-border bg-transparent py-1 pl-10 pr-2 text-sm outline-none focus:border-body"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex h-8 w-6 shrink-0 items-center justify-end ${className}`}>
      {!isSearchBarFocused ? (
        <button
          type="button"
          className="grid place-items-center"
          onClick={() => setIsSearchBarFocused(true)}
          aria-label="Open search"
        >
          <img src={searchIcon} alt="" />
        </button>
      ) : null}

      <div
        className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${
          isSearchBarFocused
            ? `${width} opacity-100`
            : 'pointer-events-none w-0 opacity-0'
        }`}
      >
        <img
          src={searchIcon}
          alt=""
          className="absolute left-2 top-[7px] h-4"
        />

        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full rounded-3xl border border-border bg-background-alt py-1 pl-7 pr-8 text-sm"
          onFocus={() => setIsSearchBarFocused(true)}
          style={{ outline: 'none', boxShadow: 'none' }}
        />

        {isSearchBarFocused ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 mt-[1px] -translate-y-1/2 text-sm text-body-300 hover:text-body-700"
            onClick={handleCrossClick}
            aria-label="Close search"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
