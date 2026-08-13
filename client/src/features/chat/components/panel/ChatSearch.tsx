import ChevronLeft from '@/shared/components/icons/ChevronLeft';
import {
  useActiveMessageDatesQuery,
  useChatDetailsQuery,
  useJumpToDateMutation,
  useSearchMessagesQuery,
} from '@/features/chat/hooks';
import { useAuthStore } from '@/features/auth/store';
import { getFirstName } from '@/shared/utils/helper';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export type ChatSearchHit = {
  _id: string;
  content?: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar?: string };
  attachments?: Array<{ name?: string; fileType?: string }>;
};

type ChatSearchProps = {
  chatId?: string;
  open: boolean;
  onClose: () => void;
  onJumpToMessage: (
    messageId: string,
    query: string,
    options?: { closeSearch?: boolean },
  ) => void;
};

type SearchMode = 'messages' | 'media' | 'links' | 'date';
type FromFilter = 'anyone' | 'me' | 'others' | string;

type SearchResponse = {
  data?: ChatSearchHit[];
  total?: number;
};

type JumpDateResponse = {
  data?: { _id: string; createdAt: string; exactDay: boolean } | null;
};

type ChatMember = {
  _id?: string;
  name?: string;
  avatar?: string;
};

type ChatDetailsResponse = {
  data?: {
    groupChat?: boolean;
    name?: string;
    avatar?: string | string[];
    members?: ChatMember[];
  };
};

type FromOption = {
  id: FromFilter;
  label: string;
  avatar?: string | null;
  tone: 'all' | 'self' | 'peer';
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const SearchGlyph = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="m16.2 16.2 4 4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const ModeIcon = ({
  mode,
  className = 'h-4 w-4',
}: {
  mode: SearchMode;
  className?: string;
}) => {
  if (mode === 'messages') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 8.5h10M7 12h6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M5.5 4.5h13A2.5 2.5 0 0 1 21 7v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.2a.6.6 0 0 1-1-.45V17.5H5.5A2.5 2.5 0 0 1 3 15V7a2.5 2.5 0 0 1 2.5-2.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (mode === 'media') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <path
          d="m7.5 16.5 3.2-3.4 2.3 2.2 2.6-3.1 3.4 4.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (mode === 'links') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9.5 14.5 7.8 16.2a3.2 3.2 0 0 1-4.5-4.5L7 8a3.2 3.2 0 0 1 4.5 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M14.5 9.5 16.2 7.8a3.2 3.2 0 1 1 4.5 4.5L17 16a3.2 3.2 0 0 1-4.5 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="m10 14 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 9.5h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

const MODES: Array<{ id: SearchMode; label: string; hint: string }> = [
  { id: 'messages', label: 'Text', hint: 'Words & phrases' },
  { id: 'media', label: 'Media', hint: 'Photos & files' },
  { id: 'links', label: 'Links', hint: 'Shared URLs' },
  { id: 'date', label: 'Date', hint: 'Jump to a day' },
];

const DATE_PRESETS = [
  { id: 'today', label: 'Today', daysAgo: 0 },
  { id: 'yesterday', label: 'Yesterday', daysAgo: 1 },
  { id: 'week', label: '7d ago', daysAgo: 7 },
  { id: 'month', label: '30d ago', daysAgo: 30 },
] as const;

const highlightSnippet = (text: string, query: string): ReactNode => {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-[2px] bg-yellow/90 px-0.5 font-medium text-background"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
};

const dayBounds = (isoDate: string) => ({
  dateFrom: dayjs(isoDate).startOf('day').toISOString(),
  dateTo: dayjs(isoDate).endOf('day').toISOString(),
});

const initialOf = (label: string) => (label.trim()[0] || '?').toUpperCase();

const PersonAvatar = ({
  option,
  selected,
}: {
  option: FromOption;
  selected: boolean;
}) => {
  if (option.avatar) {
    return (
      <img
        src={option.avatar}
        alt=""
        className={`h-7 w-7 rounded-full object-cover ring-2 ${
          selected ? 'ring-green/50' : 'ring-transparent'
        }`}
      />
    );
  }

  const toneClass =
    option.tone === 'self'
      ? selected
        ? 'bg-green text-background'
        : 'bg-green/20 text-green'
      : option.tone === 'peer'
        ? selected
          ? 'bg-blue text-white-pure'
          : 'bg-blue/15 text-blue'
        : selected
          ? 'bg-body text-background'
          : 'bg-white/10 text-body-700';

  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${toneClass}`}
    >
      {option.tone === 'all' ? '∞' : initialOf(option.label)}
    </span>
  );
};

const SearchDatePicker = ({
  chatId,
  value,
  onChange,
  onJump,
  jumping,
  statusNote,
  enabled = true,
}: {
  chatId?: string;
  value: string;
  onChange: (next: string) => void;
  onJump?: () => void;
  jumping?: boolean;
  statusNote?: string | null;
  enabled?: boolean;
}) => {
  const today = dayjs().startOf('day');
  const selected = value ? dayjs(value) : null;
  const [cursor, setCursor] = useState<Dayjs>(
    () => (selected?.isValid() ? selected : today).startOf('month'),
  );
  const [panel, setPanel] = useState<'days' | 'years'>('days');
  const [yearCursor, setYearCursor] = useState(
    () => (selected?.isValid() ? selected : today).year(),
  );

  useEffect(() => {
    if (selected?.isValid()) {
      setCursor(selected.startOf('month'));
      setYearCursor(selected.year());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    const start = cursor.startOf('month');
    const end = cursor.endOf('month');
    const gridStart = start.startOf('week');
    const gridEnd = end.endOf('week');
    const cells: Dayjs[] = [];
    let day = gridStart;
    while (day.isBefore(gridEnd) || day.isSame(gridEnd, 'day')) {
      cells.push(day);
      day = day.add(1, 'day');
    }
    return cells;
  }, [cursor]);

  const activeRange = useMemo(() => {
    const gridStart = cursor.startOf('month').startOf('week');
    const gridEnd = cursor.endOf('month').endOf('week');
    const presetStart = today.subtract(30, 'day').startOf('day');
    const from = gridStart.isBefore(presetStart) ? gridStart : presetStart;
    return {
      dateFrom: from.toISOString(),
      dateTo: gridEnd.endOf('day').toISOString(),
    };
  }, [cursor, today]);

  const {
    data: activeDatesResult,
    isFetched: activeDatesFetched,
  } = useActiveMessageDatesQuery(
    {
      chatId,
      dateFrom: activeRange.dateFrom,
      dateTo: activeRange.dateTo,
    },
    { enabled: Boolean(enabled && chatId) },
  );

  const activeDates = activeDatesResult?.dates ?? [];
  const minYear = activeDatesResult?.minYear ?? null;
  const activeDateSet = useMemo(() => new Set(activeDates), [activeDates]);

  const maxYear = today.year();
  const yearStart = Math.floor(yearCursor / 12) * 12;
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => yearStart + i),
    [yearStart],
  );

  // Year is disabled if no messages exist: derived from minYear (O(1) seek).
  // minYear=null means data not yet loaded — optimistically allow all years.
  const isYearDisabled = (year: number) => {
    if (year > maxYear) return true;
    if (minYear === null) return false;
    return year < minYear;
  };

  const canGoPrevYears = minYear !== null && yearStart > minYear;
  const canGoNextYears =
    yearStart + 12 <= maxYear &&
    (minYear === null || yearStart + 12 <= maxYear);

  const canGoNextMonth = cursor
    .add(1, 'month')
    .startOf('month')
    .isBefore(today.add(1, 'day'));

  const selectedHasMessages =
    Boolean(value) && (!activeDatesFetched || activeDateSet.has(value));

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background-alt/70">
      {panel === 'days' ? (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-primary/30 px-3 py-2.5">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition hover:border-green/40 hover:text-green"
              onClick={() => setCursor((c) => c.subtract(1, 'month'))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <p className="font-display text-base leading-none text-body">
                {cursor.format('MMMM')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setYearCursor(cursor.year());
                  setPanel('years');
                }}
                className="px-1 text-[11px] font-semibold tracking-[0.12em] text-body-300 transition hover:text-green"
                aria-label="Change year"
              >
                {cursor.format('YYYY')} ▾
              </button>
            </div>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setCursor((c) => c.add(1, 'month'))}
              disabled={!canGoNextMonth}
              aria-label="Next month"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 px-2 pb-1 pt-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-body-300"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-2">
            {days.map((day) => {
              const inMonth = day.month() === cursor.month();
              const iso = day.format('YYYY-MM-DD');
              const isSelected = selected?.isSame(day, 'day') ?? false;
              const isToday = day.isSame(today, 'day');
              const isFuture = day.isAfter(today, 'day');
              const hasMessages =
                !activeDatesFetched || activeDateSet.has(iso);
              const isDisabled = isFuture || !hasMessages;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onChange(iso)}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-medium transition ${
                    isSelected
                      ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
                      : isToday
                        ? 'text-green ring-1 ring-inset ring-green/30'
                        : inMonth
                          ? 'text-body hover:bg-primary/70'
                          : 'text-body-300/45'
                  } disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent`}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-primary/30 px-3 py-2.5">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setYearCursor((y) => y - 12)}
              disabled={!canGoPrevYears}
              aria-label="Previous years"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPanel('days')}
              className="px-1 text-center transition hover:text-green"
            >
              <p className="font-display text-base leading-none text-body">
                {yearStart} – {yearStart + 11}
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-body-300">
                Years with messages
              </p>
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setYearCursor((y) => y + 12)}
              disabled={!canGoNextYears}
              aria-label="Next years"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-3">
            {years.map((year) => {
              const isSelected = cursor.year() === year;
              const isCurrent = today.year() === year;
              const isDisabled = isYearDisabled(year);
              return (
                <button
                  key={year}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    setCursor((c) => {
                      const next = c.year(year);
                      const capped = next.isAfter(today, 'month')
                        ? today.startOf('month')
                        : next.startOf('month');
                      return capped;
                    });
                    setPanel('days');
                  }}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
                      : isCurrent
                        ? 'bg-green/10 text-green ring-1 ring-inset ring-green/30'
                        : 'bg-primary/35 text-body-700 hover:bg-primary/60 hover:text-body'
                  } disabled:cursor-not-allowed disabled:opacity-25`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="flex h-14 items-center justify-between gap-2 border-t border-border/50 bg-green/10 px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-body">
            {selected?.isValid()
              ? selected.format('ddd, D MMM YYYY')
              : 'Pick a day to jump'}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-body-300">
            {statusNote
              ? statusNote
              : selected?.isValid()
                ? selectedHasMessages
                  ? 'Tap Jump for the first message that day'
                  : 'No messages on this day'
                : 'Only days with messages are selectable'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={!selected?.isValid()}
            className="inline-flex h-7 min-w-13 items-center justify-center rounded-full border border-green/30 bg-background/50 px-2.5 text-[10px] font-semibold text-body-700 transition enabled:hover:border-green/50 enabled:hover:text-body disabled:opacity-35"
            onClick={() => onChange('')}
          >
            Clear
          </button>
          {onJump ? (
            <button
              type="button"
              disabled={
                !selected?.isValid() || !selectedHasMessages || jumping
              }
              onClick={onJump}
              className="inline-flex h-7 min-w-13 items-center justify-center rounded-full bg-gradient-green px-2.5 text-[10px] font-semibold text-white-pure shadow-[0_4px_12px_rgba(1,195,109,0.3)] transition enabled:hover:brightness-110 disabled:opacity-40"
            >
              Jump
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ChatSearch = ({
  chatId,
  open,
  onClose,
  onJumpToMessage,
}: ChatSearchProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const [entered, setEntered] = useState(false);
  const [mode, setMode] = useState<SearchMode>('messages');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState<FromFilter>('anyone');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dateJumpNote, setDateJumpNote] = useState<string | null>(null);
  const jumpDateMutation = useJumpToDateMutation();

  const { data: chatDetails } = useChatDetailsQuery(
    { id: chatId, populate: true },
    { skip: !open || !chatId },
  );

  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data;
  const isGroup = Boolean(chatData?.groupChat);
  const peerName = chatData?.name ?? 'Them';
  const peerAvatar = Array.isArray(chatData?.avatar)
    ? chatData?.avatar[0]
    : chatData?.avatar;

  const members = useMemo(() => {
    const list = chatData?.members ?? [];
    const selfId = user?._id ? String(user._id) : '';
    return list
      .map((m) => ({
        _id: m._id ? String(m._id) : '',
        name: m.name ?? 'Member',
        avatar: m.avatar,
      }))
      .filter((m) => m._id && m._id !== selfId);
  }, [chatData?.members, user?._id]);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (mode !== 'date') inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [open, mode]);

  useEffect(() => {
    if (!open) {
      setMode('messages');
      setDraft('');
      setQuery('');
      setFrom('anyone');
      setSelectedDate('');
      setActiveIndex(-1);
      setDateJumpNote(null);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(draft.trim());
    }, 260);
    return () => clearTimeout(timer);
  }, [draft]);

  const scope =
    mode === 'media' ? 'media' : mode === 'links' ? 'links' : 'all';
  const senderId =
    from !== 'anyone' && from !== 'me' && from !== 'others' ? from : undefined;
  const fromParam =
    from === 'me' || from === 'others' ? from : ('anyone' as const);

  const searchEnabled =
    open &&
    mode !== 'date' &&
    (mode === 'media' || mode === 'links' ? true : query.length >= 1);

  const { data, isFetching, isError } = useSearchMessagesQuery(
    {
      chatId,
      q: query,
      scope,
      from: senderId ? 'anyone' : fromParam,
      senderId,
    },
    { enabled: searchEnabled },
  );

  const presetActiveRange = useMemo(
    () => ({
      dateFrom: dayjs().subtract(30, 'day').startOf('day').toISOString(),
      dateTo: dayjs().endOf('day').toISOString(),
    }),
    [],
  );

  const {
    data: presetActiveDatesResult,
    isFetched: presetDatesFetched,
  } = useActiveMessageDatesQuery(
    {
      chatId,
      dateFrom: presetActiveRange.dateFrom,
      dateTo: presetActiveRange.dateTo,
    },
    { enabled: open && mode === 'date' && Boolean(chatId) },
  );

  const presetActiveDates = presetActiveDatesResult?.dates ?? [];

  const presetActiveSet = useMemo(
    () => new Set(presetActiveDates),
    [presetActiveDates],
  );

  const typed = data as SearchResponse | undefined;
  const hits = useMemo(() => {
    const rows = (typed?.data ?? []).slice();
    return rows.reverse();
  }, [typed?.data]);
  const total = hits.length;
  const modeIndex = Math.max(
    0,
    MODES.findIndex((m) => m.id === mode),
  );
  const activeMode = MODES[modeIndex];

  // Reset selection when filters change — do not auto-scroll the thread.
  useEffect(() => {
    setActiveIndex(-1);
    setDateJumpNote(null);
    if (open) onJumpToMessage('', '');
  }, [query, mode, from, selectedDate, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJumpToSelectedDate = async () => {
    if (!chatId || !selectedDate) return;
    setDateJumpNote(null);
    const bounds = dayBounds(selectedDate);
    try {
      const res = (await jumpDateMutation.mutateAsync({
        chatId,
        dateFrom: bounds.dateFrom,
        dateTo: bounds.dateTo,
      })) as JumpDateResponse;
      const target = res.data;
      if (!target?._id) {
        setDateJumpNote('No messages on or after this day');
        return;
      }
      onJumpToMessage(target._id, '', { closeSearch: true });
      setDateJumpNote(
        target.exactDay
          ? `Jumped · ${dayjs(selectedDate).format('D MMM YYYY')}`
          : `No messages on ${dayjs(selectedDate).format('D MMM YYYY')}`,
      );
    } catch {
      setDateJumpNote('Couldn’t jump to that day');
    }
  };

  const jumpToHit = (
    index: number,
    options?: { closeSearch?: boolean },
  ) => {
    const hit = hits[index];
    if (!hit) return;
    setActiveIndex(index);
    onJumpToMessage(hit._id, mode === 'messages' ? query : '', options);
  };

  const jumpRelative = (delta: number) => {
    if (total === 0) return;
    let next: number;
    if (activeIndex < 0) {
      next = delta >= 0 ? total - 1 : 0;
    } else {
      next = activeIndex + delta;
      if (next < 0) next = total - 1;
      if (next >= total) next = 0;
    }
    jumpToHit(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      jumpRelative(1);
      return;
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      jumpRelative(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      jumpRelative(1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      jumpRelative(-1);
    }
  };

  const fromOptions = useMemo<FromOption[]>(() => {
    if (!isGroup) {
      return [
        { id: 'anyone', label: 'Anyone', tone: 'all' },
        {
          id: 'me',
          label: 'You',
          tone: 'self',
          avatar:
            typeof user?.avatar === 'string'
              ? user.avatar
              : user?.avatar?.url,
        },
        {
          id: 'others',
          label: getFirstName(peerName) || 'Them',
          tone: 'peer',
          avatar: peerAvatar,
        },
      ];
    }

    return [
      { id: 'anyone', label: 'Anyone', tone: 'all' },
      {
        id: 'me',
        label: 'You',
        tone: 'self',
        avatar:
          typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url,
      },
      ...members.slice(0, 6).map((m) => ({
        id: m._id,
        label: getFirstName(m.name),
        tone: 'peer' as const,
        avatar: m.avatar,
      })),
    ];
  }, [isGroup, members, peerAvatar, peerName, user?.avatar]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-search-title"
    >
      <button
        type="button"
        aria-label="Close search"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-[420px] flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered
            ? 'scale-100 opacity-100'
            : 'scale-[0.98] opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />

        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mb-3 flex items-start gap-2">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-background-alt/60 text-body transition hover:border-green/40 hover:bg-primary/80 hover:text-white"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="chat-search-title"
                className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl"
              >
                Find in chat
              </h2>
              <p className="mt-0.5 min-h-5 truncate text-xs text-body-300 sm:text-sm">
                {activeMode.hint}
                {searchEnabled ? (
                  <span className="text-body-700">
                    {' '}
                    · {isFetching && total === 0 ? '…' : `${total} found`}
                  </span>
                ) : null}
              </p>
            </div>
            {searchEnabled ? (
              <div className="mt-0.5 flex items-center overflow-hidden rounded-full border border-border/70 bg-background-alt/50 p-0.5">
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-full text-body-300 transition hover:bg-primary/70 hover:text-body disabled:opacity-30"
                  onClick={() => jumpRelative(-1)}
                  disabled={total === 0}
                  aria-label="Previous match"
                >
                  <ChevronLeft className="h-4 w-4 rotate-90" />
                </button>
                <span className="min-w-10 px-1 text-center text-[11px] font-semibold tabular-nums text-body">
                  {total === 0
                    ? '0'
                    : activeIndex < 0
                      ? `–/${total}`
                      : `${activeIndex + 1}/${total}`}
                </span>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-full text-body-300 transition hover:bg-primary/70 hover:text-body disabled:opacity-30"
                  onClick={() => jumpRelative(1)}
                  disabled={total === 0}
                  aria-label="Next match"
                >
                  <ChevronLeft className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Tabs — underline / border-bottom style */}
          <div className="relative" role="tablist" aria-label="Search categories">
            <div
              className="absolute inset-x-0 bottom-0 h-px bg-border/45"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 z-10 h-0.5 rounded-full bg-gradient-to-r from-green-gradFrom via-green to-green-gradTo transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: `calc(100% / ${MODES.length})`,
                left: `calc(${modeIndex} * 100% / ${MODES.length})`,
              }}
              aria-hidden
            />
            <div className="grid grid-cols-4">
              {MODES.map((tab) => {
                const selected = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setMode(tab.id);
                      if (tab.id === 'date') setQuery('');
                    }}
                    className={`relative inline-flex h-11 w-full items-center justify-center gap-1.5 pb-2.5 transition-colors duration-200 ${
                      selected
                        ? 'text-green'
                        : 'text-body-300 hover:text-body'
                    }`}
                  >
                    <ModeIcon
                      mode={tab.id}
                      className={`h-4 w-4 shrink-0 transition ${
                        selected ? 'text-green' : 'text-body-300'
                      }`}
                    />
                    <span className="truncate text-[11px] font-medium leading-none sm:text-xs">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls — non-date modes stay in header; date calendar scrolls in body */}
          {mode !== 'date' ? (
            <div className="mt-3 space-y-2.5">
              <div className="group/search relative flex h-10 items-center gap-2.5 rounded-full border border-[rgba(235,236,236,0.28)] bg-background/80 px-3 shadow-[inset_0_1px_0_rgba(235,236,236,0.08)] transition focus-within:border-[rgba(235,236,236,0.45)] focus-within:bg-background focus-within:shadow-[0_0_18px_rgba(235,236,236,0.07)]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/80 text-body-300 transition group-focus-within/search:text-green">
                  <SearchGlyph />
                </span>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'media'
                      ? 'Filter media…'
                      : mode === 'links'
                        ? 'Filter links…'
                        : 'Search messages…'
                  }
                  className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none"
                  aria-label="Search in conversation"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between px-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-body-300">
                    From
                  </p>
                  <p className="text-[10px] text-body-300">
                    {isGroup ? 'People in group' : 'This chat'}
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                  {fromOptions.map((option) => {
                    const selected = from === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setFrom(option.id);
                        }}
                        className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition ${
                          selected
                            ? option.tone === 'self'
                              ? 'border-green/45 bg-green/15 shadow-[0_0_16px_rgba(1,195,109,0.16)]'
                              : option.tone === 'peer'
                                ? 'border-blue/45 bg-blue/15 shadow-[0_0_16px_rgba(86,152,255,0.16)]'
                                : 'border-white/25 bg-white/10'
                            : 'border-border/70 bg-primary/30 hover:border-border hover:bg-primary/55'
                        }`}
                      >
                        <PersonAvatar option={option} selected={selected} />
                        <span
                          className={`max-w-24 truncate text-[11px] font-semibold ${
                            selected ? 'text-body' : 'text-body-700'
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-hide sm:px-5 sm:py-4">
          {mode === 'date' ? (
            <div className="flex flex-col gap-1">
              <div className="my-3 flex justify-center gap-1.5 sm:my-4">
                {DATE_PRESETS.map((preset) => {
                  const iso = dayjs()
                    .subtract(preset.daysAgo, 'day')
                    .format('YYYY-MM-DD');
                  const selected = selectedDate === iso;
                  const hasMessages =
                    !presetDatesFetched || presetActiveSet.has(iso);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!hasMessages}
                      onClick={() => setSelectedDate(iso)}
                      className={`rounded-full px-3 py-1.5 text-center text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                        selected
                          ? 'bg-green/25 text-green ring-1 ring-inset ring-green/35'
                          : 'border border-border/70 bg-primary/40 text-body-700 hover:border-green/35 hover:text-body'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <SearchDatePicker
                chatId={chatId}
                value={selectedDate}
                onChange={setSelectedDate}
                onJump={handleJumpToSelectedDate}
                jumping={jumpDateMutation.isPending}
                statusNote={dateJumpNote}
                enabled={open && mode === 'date'}
              />
              <div className="flex flex-col items-center justify-center px-6 py-6 text-center">
                <p className="text-sm font-medium leading-snug text-body">
                  Every chat has a yesterday.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-body-300">
                  Pick a day and jump straight back.
                </p>
              </div>
            </div>
          ) : !searchEnabled ? (
                <div className="flex h-full min-h-36 flex-col items-center justify-center px-4 text-center">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-primary/40 text-green">
                    <ModeIcon mode={mode} className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-body-700">
                    {mode === 'media'
                      ? 'Browse shared media'
                      : mode === 'links'
                        ? 'Browse shared links'
                        : 'Type to search this chat'}
                  </p>
                  <p className="mt-1 text-xs text-body-300">
                    Tap a result to jump in the thread
                  </p>
                </div>
              ) : isFetching && total === 0 ? (
            <div className="space-y-2 py-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-primary/35"
                />
              ))}
            </div>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-body-300">
              Couldn’t search right now
            </p>
          ) : total === 0 ? (
            <div className="flex h-full min-h-36 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-body-700">No matches</p>
              <p className="mt-1 text-xs text-body-300">
                {query ? `Nothing for “${query}”` : 'Try another filter'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {[...hits].reverse().map((hit) => {
                const chronologicalIndex = hits.findIndex(
                  (row) => row._id === hit._id,
                );
                const isActive = chronologicalIndex === activeIndex;
                const preview =
                  hit.content?.trim() ||
                  hit.attachments?.[0]?.name ||
                  'Attachment';
                const mine =
                  String(hit.sender._id) === String(user?._id ?? '');

                return (
                  <li key={hit._id}>
                    <button
                      type="button"
                      onClick={() => {
                        jumpToHit(chronologicalIndex, { closeSearch: true });
                      }}
                      className={`flex w-full gap-2.5 rounded-xl px-2.5 py-2.5 text-left ring-1 transition ${
                        isActive
                          ? 'bg-green/10 ring-green/30'
                          : 'bg-primary/25 ring-transparent hover:bg-primary/45 hover:ring-border/60'
                      }`}
                    >
                      <div
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold ${
                          mine
                            ? 'bg-green/20 text-green'
                            : 'bg-blue/15 text-blue'
                        }`}
                      >
                        {hit.sender.avatar ? (
                          <img
                            src={hit.sender.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (mine
                            ? 'Y'
                            : getFirstName(hit.sender.name)?.[0] || '?'
                          ).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-body">
                            {mine ? 'You' : getFirstName(hit.sender.name)}
                          </span>
                          <time className="shrink-0 text-[10px] text-body-300">
                            {dayjs(hit.createdAt).format('D MMM · h:mm A')}
                          </time>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-body-700">
                          {highlightSnippet(
                            preview,
                            mode === 'messages' ? query : draft,
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
