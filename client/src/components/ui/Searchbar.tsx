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
  /** box = filled field; line = icon + underline (dialogs); pill = sheet search */
  variant?: 'box' | 'line' | 'pill';
};

/**
 * Unified search input.
 * - `expandable` (default true): icon → expand (chat header / dialogs)
 * - `expandable={false}`: always-open field
 * - `variant="line"`: border-bottom style with leading search icon
 */
export default function Searchbar({
  searchText,
  setSearchText,
  autoFocus = false,
  placeholder = 'Search...',
  width = 'w-40',
  className = '',
  expandable = true,
  variant = 'box',
}: SearchbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(
    !expandable || Boolean(autoFocus),
  );
  const [isFocused, setIsFocused] = useState(false);

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

  if (!expandable && variant === 'pill') {
    return (
      <div
        className={`group/search relative flex h-10 items-center gap-2.5 rounded-full border px-3 transition ${
          isFocused
            ? 'border-green/35 bg-background/80 shadow-[0_0_18px_rgba(1,195,109,0.08)]'
            : 'border-white/10 bg-black-light/35'
        } ${className}`}
      >
        <img
          src={searchIcon}
          alt=""
          className={`h-4 w-4 shrink-0 transition ${isFocused ? 'opacity-90' : 'opacity-55'}`}
        />
        <input
          type="search"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        {searchText ? (
          <button
            type="button"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm text-body-300 transition hover:bg-white/8 hover:text-body"
            onClick={() => setSearchText('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>
    );
  }

  if (!expandable && variant === 'line') {
    return (
      <div
        className={`relative flex w-full items-center gap-3 border-b pb-2 transition-colors ${
          isFocused ? 'border-green/70' : 'border-border'
        } ${className}`}
      >
        <img
          src={searchIcon}
          alt=""
          className="h-5 w-5 shrink-0 opacity-60"
        />
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full min-w-0 bg-transparent py-2 text-[15px] outline-none placeholder:text-body-300"
        />
        {searchText ? (
          <button
            type="button"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm text-body-300 transition hover:bg-primary hover:text-body"
            onClick={() => setSearchText('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>
    );
  }

  if (!expandable) {
    return (
      <div className={`relative w-full ${className}`}>
        <img
          src={searchIcon}
          alt=""
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-70"
        />
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-11 w-full rounded-xl border border-border bg-primary py-2 pl-10 pr-9 text-[15px] outline-none transition placeholder:text-body-300 focus:border-body/40"
        />
        {searchText ? (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-sm text-body-300 hover:bg-background/60 hover:text-body"
            onClick={() => setSearchText('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
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
