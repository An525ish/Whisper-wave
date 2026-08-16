import { useEffect, useRef, useState } from 'react';
import Image from '@/components/ui/Image';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useAdminUsersQuery } from '@/hooks/admin';
import type { UserFilterOption } from '@/types/admin';

type Props = {
  value: UserFilterOption | null;
  onChange: (v: UserFilterOption | null) => void;
  label?: string;
  popoverAlign?: 'left' | 'right';
};

const UserFilterChip = ({ value, onChange, label = 'Sender', popoverAlign = 'left' }: Props) => {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(inputText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputText]);

  const active = debouncedSearch.length >= 2;
  const { data, isFetching } = useAdminUsersQuery(active ? debouncedSearch : '', active);

  const options: UserFilterOption[] = (data?.pages ?? []).flatMap((page) =>
    page.users.map((u) => ({
      _id: u._id,
      name: u.name ?? '',
      username: u.username ?? '',
      avatarUrl: u.avatar?.url,
    })),
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const handleSelect = (opt: UserFilterOption) => {
    onChange(opt);
    setInputText('');
    setDebouncedSearch('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputText('');
    setDebouncedSearch('');
    setOpen(false);
  };

  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/35 bg-blue/10 py-1.5 pl-2 pr-1.5 text-xs font-semibold text-blue">
        <div className="h-4 w-4 shrink-0 overflow-hidden rounded-full bg-blue/20">
          <Image src={value.avatarUrl} alt={value.name ?? ''} className="h-full w-full" displayWidth={40} />
        </div>
        <span className="max-w-28 truncate">{value.name}</span>
        <button
          type="button"
          onClick={handleClear}
          aria-label={`Remove ${label} filter`}
          className="ml-0.5 rounded-full p-0.5 text-blue/60 transition hover:bg-blue/20 hover:text-blue"
        >
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          open
            ? 'border-blue/35 bg-blue/10 text-blue'
            : 'border-dashed border-border/50 bg-transparent text-body-300/60 hover:border-border/70 hover:text-body-300'
        }`}
      >
        <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {label}
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-border/40 bg-background shadow-xl shadow-black/20 ${
            popoverAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-body-300/50" fill="none" aria-hidden>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Search by name or username…"
              className="min-w-0 flex-1 bg-transparent text-xs text-body placeholder-body-300/40 focus:outline-none"
            />
            {isFetching && (
              <span
                className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-blue/25 border-t-blue"
                aria-hidden
              />
            )}
          </div>

          {options.length > 0 ? (
            <ul role="listbox">
              {options.slice(0, 6).map((opt) => (
                <li key={opt._id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-primary/30"
                  >
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-primary/50">
                      <Image src={opt.avatarUrl} alt={opt.name ?? ''} className="h-full w-full" displayWidth={64} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-body">{opt.name}</p>
                      <p className="truncate text-[11px] text-body-300/60">@{opt.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : active && !isFetching ? (
            <p className="px-4 py-3 text-xs text-body-300/55">No users found</p>
          ) : !active ? (
            <p className="px-4 py-3 text-xs text-body-300/45">Type at least 2 characters</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserFilterChip;
