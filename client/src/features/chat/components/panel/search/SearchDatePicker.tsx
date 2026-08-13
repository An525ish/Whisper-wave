import ChevronLeft from '@/shared/components/icons/ChevronLeft'
import { useActiveMessageDatesQuery } from '@/features/chat/hooks'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

type SearchDatePickerProps = {
  chatId?: string
  value: string
  onChange: (next: string) => void
  onJump?: () => void
  jumping?: boolean
  statusNote?: string | null
  enabled?: boolean
}

const SearchDatePicker = ({ chatId, value, onChange, onJump, jumping, statusNote, enabled = true }: SearchDatePickerProps) => {
  const today = dayjs().startOf('day')
  const selected = value ? dayjs(value) : null
  const [cursor, setCursor] = useState<Dayjs>(() => (selected?.isValid() ? selected : today).startOf('month'))
  const [panel, setPanel] = useState<'days' | 'years'>('days')
  const [yearCursor, setYearCursor] = useState(() => (selected?.isValid() ? selected : today).year())

  useEffect(() => {
    if (selected?.isValid()) { setCursor(selected.startOf('month')); setYearCursor(selected.year()) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    const start = cursor.startOf('month')
    const end = cursor.endOf('month')
    const gridStart = start.startOf('week')
    const gridEnd = end.endOf('week')
    const cells: Dayjs[] = []
    let day = gridStart
    while (day.isBefore(gridEnd) || day.isSame(gridEnd, 'day')) { cells.push(day); day = day.add(1, 'day') }
    return cells
  }, [cursor])

  const activeRange = useMemo(() => {
    const gridStart = cursor.startOf('month').startOf('week')
    const gridEnd = cursor.endOf('month').endOf('week')
    const presetStart = today.subtract(30, 'day').startOf('day')
    const from = gridStart.isBefore(presetStart) ? gridStart : presetStart
    return { dateFrom: from.toISOString(), dateTo: gridEnd.endOf('day').toISOString() }
  }, [cursor, today])

  const { data: activeDatesResult, isFetched: activeDatesFetched } = useActiveMessageDatesQuery(
    { chatId, dateFrom: activeRange.dateFrom, dateTo: activeRange.dateTo },
    { enabled: Boolean(enabled && chatId) },
  )

  const activeDates = activeDatesResult?.dates ?? []
  const minYear = activeDatesResult?.minYear ?? null
  const activeDateSet = useMemo(() => new Set(activeDates), [activeDates])

  const maxYear = today.year()
  const yearStart = Math.floor(yearCursor / 12) * 12
  const years = useMemo(() => Array.from({ length: 12 }, (_, i) => yearStart + i), [yearStart])

  const isYearDisabled = (year: number) => {
    if (year > maxYear) return true
    if (minYear === null) return false
    return year < minYear
  }

  const canGoPrevYears = minYear !== null && yearStart > minYear
  const canGoNextYears = yearStart + 12 <= maxYear && (minYear === null || yearStart + 12 <= maxYear)
  const canGoNextMonth = cursor.add(1, 'month').startOf('month').isBefore(today.add(1, 'day'))
  const selectedHasMessages = Boolean(value) && (!activeDatesFetched || activeDateSet.has(value))

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background-alt/70">
      {panel === 'days' ? (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-primary/30 px-3 py-2.5">
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition hover:border-green/40 hover:text-green"
              onClick={() => setCursor((c) => c.subtract(1, 'month'))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <p className="font-display text-base leading-none text-body">{cursor.format('MMMM')}</p>
              <button type="button" onClick={() => { setYearCursor(cursor.year()); setPanel('years') }}
                className="px-1 text-[11px] font-semibold tracking-[0.12em] text-body-300 transition hover:text-green" aria-label="Change year">
                {cursor.format('YYYY')} ▾
              </button>
            </div>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setCursor((c) => c.add(1, 'month'))} disabled={!canGoNextMonth} aria-label="Next month">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 px-2 pb-1 pt-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-body-300">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-2">
            {days.map((day) => {
              const inMonth = day.month() === cursor.month()
              const iso = day.format('YYYY-MM-DD')
              const isSelected = selected?.isSame(day, 'day') ?? false
              const isToday = day.isSame(today, 'day')
              const isFuture = day.isAfter(today, 'day')
              const hasMessages = !activeDatesFetched || activeDateSet.has(iso)
              const isDisabled = isFuture || !hasMessages
              return (
                <button key={iso} type="button" disabled={isDisabled} onClick={() => onChange(iso)}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-medium transition ${
                    isSelected ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
                    : isToday ? 'text-green ring-1 ring-inset ring-green/30'
                    : inMonth ? 'text-body hover:bg-primary/70' : 'text-body-300/45'
                  } disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent`}
                >
                  {day.date()}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-primary/30 px-3 py-2.5">
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setYearCursor((y) => y - 12)} disabled={!canGoPrevYears} aria-label="Previous years">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setPanel('days')} className="px-1 text-center transition hover:text-green">
              <p className="font-display text-base leading-none text-body">{yearStart} – {yearStart + 11}</p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-body-300">Years with messages</p>
            </button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-body-300 transition enabled:hover:border-green/40 enabled:hover:text-green disabled:opacity-30"
              onClick={() => setYearCursor((y) => y + 12)} disabled={!canGoNextYears} aria-label="Next years">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {years.map((year) => {
              const isSelected = cursor.year() === year
              const isCurrent = today.year() === year
              const isDisabled = isYearDisabled(year)
              return (
                <button key={year} type="button" disabled={isDisabled}
                  onClick={() => {
                    setCursor((c) => { const next = c.year(year); return next.isAfter(today, 'month') ? today.startOf('month') : next.startOf('month') })
                    setPanel('days')
                  }}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${
                    isSelected ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
                    : isCurrent ? 'bg-green/10 text-green ring-1 ring-inset ring-green/30'
                    : 'bg-primary/35 text-body-700 hover:bg-primary/60 hover:text-body'
                  } disabled:cursor-not-allowed disabled:opacity-25`}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="flex h-14 items-center justify-between gap-2 border-t border-border/50 bg-green/10 px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-body">
            {selected?.isValid() ? selected.format('ddd, D MMM YYYY') : 'Pick a day to jump'}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-body-300">
            {statusNote ? statusNote : selected?.isValid() ? (selectedHasMessages ? 'Tap Jump for the first message that day' : 'No messages on this day') : 'Only days with messages are selectable'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" disabled={!selected?.isValid()}
            className="inline-flex h-7 min-w-13 items-center justify-center rounded-full border border-green/30 bg-background/50 px-2.5 text-[10px] font-semibold text-body-700 transition enabled:hover:border-green/50 enabled:hover:text-body disabled:opacity-35"
            onClick={() => onChange('')}>
            Clear
          </button>
          {onJump ? (
            <button type="button" disabled={!selected?.isValid() || !selectedHasMessages || jumping} onClick={onJump}
              className="inline-flex h-7 min-w-13 items-center justify-center rounded-full bg-gradient-green px-2.5 text-[10px] font-semibold text-white-pure shadow-[0_4px_12px_rgba(1,195,109,0.3)] transition enabled:hover:brightness-110 disabled:opacity-40">
              Jump
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SearchDatePicker
