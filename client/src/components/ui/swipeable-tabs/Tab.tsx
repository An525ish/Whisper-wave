import type { TabItem, TabVariant } from '@/types/ui';
import { formatUnreadCount } from '@/utils/chat';

export type { TabItem, TabVariant };

type TabsProps = {
  tabsData?: TabItem[];
  activeTabIndex: number;
  handleTabChange: (index: number) => void;
  variant?: TabVariant;
  ariaLabel?: string;
};

const pillsBadge = (selected: boolean) =>
  `grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums leading-none ${
    selected
      ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
      : 'bg-border/50 text-body-300 ring-1 ring-inset ring-white/4'
  }`;

const underlineBadge = (selected: boolean, count: number) =>
  `grid h-5 shrink-0 place-items-center rounded-full border px-1.5 text-[11px] font-medium tabular-nums ${
    count < 10 ? 'min-w-5' : 'w-fit'
  } ${
    selected
      ? 'border-blue-light bg-blue/20 text-blue'
      : 'border-border bg-primary/60 text-body-700'
  }`;

const Tabs = ({
  tabsData = [],
  activeTabIndex,
  handleTabChange,
  variant = 'underline',
  ariaLabel = 'Tabs',
}: TabsProps) => {
  const count = tabsData.length;

  if (variant === 'pills') {
    return (
      <div
        className="relative grid rounded-2xl border border-border/80 bg-background-alt/80 p-1"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        role="tablist"
        aria-label={ariaLabel}
      >
        <span
          className="pointer-events-none absolute top-1 bottom-1 rounded-xl border border-border bg-primary shadow-[inset_0_1px_0_rgba(235,236,236,0.06)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: `calc(${activeTabIndex} * (100% / ${count}) + 0.25rem)`,
            width: `calc(100% / ${count} - 0.5rem)`,
          }}
          aria-hidden
        />
        {tabsData.map((tab, index) => {
          const selected = activeTabIndex === index;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => handleTabChange(index)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 ${
                selected ? 'text-white' : 'text-body-300 hover:text-body-700'
              }`}
            >
              {tab.icon ? (
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center ${
                    selected ? 'text-green' : 'text-body-300'
                  }`}
                  aria-hidden
                >
                  {tab.icon}
                </span>
              ) : null}
              <span className="truncate">{tab.name}</span>
              {typeof tab.count === 'number' && tab.count > 0 ? (
                <span className={pillsBadge(selected)}>
                  {formatUnreadCount(tab.count)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full" role="tablist" aria-label={ariaLabel}>
      <ul className="flex flex-nowrap justify-between overflow-auto text-center text-sm font-medium scrollbar-hide md:text-base">
        {tabsData.map((tab, index) => {
          const selected = activeTabIndex === index;
          return (
            <li key={tab.id} className="relative grow">
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                className={`group inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-2 py-3.5 text-sm md:p-4 md:text-base ${
                  selected
                    ? 'border-green text-white'
                    : 'border-transparent text-body-300 hover:border-white hover:text-white'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange(index);
                }}
              >
                {tab.icon ? (
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center ${
                      selected
                        ? 'text-white'
                        : 'text-body-300 group-hover:text-white'
                    }`}
                    aria-hidden
                  >
                    {tab.icon}
                  </span>
                ) : null}
                {tab.name}
                {typeof tab.count === 'number' && tab.count > 0 ? (
                  <span
                    className={underlineBadge(selected, tab.count)}
                    aria-label={`${tab.count} new`}
                  >
                    {formatUnreadCount(tab.count)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Tabs;
