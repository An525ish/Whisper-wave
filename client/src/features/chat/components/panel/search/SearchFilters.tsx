type FromFilter = 'anyone' | 'me' | 'others' | string

export type FromOption = {
  id: FromFilter
  label: string
  avatar?: string | null
  tone: 'all' | 'self' | 'peer'
}

const initialOf = (label: string) => (label.trim()[0] || '?').toUpperCase()

const PersonAvatar = ({ option, selected }: { option: FromOption; selected: boolean }) => {
  if (option.avatar) {
    return (
      <img src={option.avatar} alt="" className={`h-7 w-7 rounded-full object-cover ring-2 ${selected ? 'ring-green/50' : 'ring-transparent'}`} />
    )
  }
  const toneClass =
    option.tone === 'self'
      ? selected ? 'bg-green text-background' : 'bg-green/20 text-green'
      : option.tone === 'peer'
        ? selected ? 'bg-blue text-white-pure' : 'bg-blue/15 text-blue'
        : selected ? 'bg-body text-background' : 'bg-white/10 text-body-700'
  return (
    <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${toneClass}`}>
      {option.tone === 'all' ? '∞' : initialOf(option.label)}
    </span>
  )
}

type SearchFiltersProps = {
  mode: string
  isGroup: boolean
  fromOptions: FromOption[]
  from: FromFilter
  onFromChange: (id: FromFilter) => void
}

const SearchFilters = ({ mode, isGroup, fromOptions, from, onFromChange }: SearchFiltersProps) => {
  if (mode === 'date') return null

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-body-300">From</p>
        <p className="text-[10px] text-body-300">{isGroup ? 'People in group' : 'This chat'}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {fromOptions.map((option) => {
          const selected = from === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFromChange(option.id)}
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
              <span className={`max-w-24 truncate text-[11px] font-semibold ${selected ? 'text-body' : 'text-body-700'}`}>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SearchFilters
