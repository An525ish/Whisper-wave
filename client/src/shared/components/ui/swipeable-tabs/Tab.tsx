import type { ReactNode } from 'react';
import { formatUnreadCount } from '@/features/chat/utils/unread';

export type TabItem = {
  id: string | number;
  name: string;
  count?: number;
  icon?: ReactNode;
};

type TabsProps = {
  tabsData?: TabItem[];
  activeTabIndex: number;
  handleTabChange: (index: number) => void;
};

const Tabs = ({
  tabsData = [],
  activeTabIndex,
  handleTabChange,
}: TabsProps) => {
  return (
    <div className="w-full">
      <ul className="flex flex-nowrap justify-between overflow-auto text-center text-sm font-medium scrollbar-hide md:text-base">
        {tabsData.map((tab, index) => {
          return (
            <li key={tab.id} className="relative grow" aria-label="Tabs">
              <button
                className={`group inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-2 py-3.5 text-sm md:p-4 md:text-base ${
                  activeTabIndex == index
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
                      activeTabIndex == index
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
                    className={`grid h-5 shrink-0 place-items-center rounded-full border px-1.5 text-[11px] font-medium tabular-nums ${
                      tab.count < 10 ? 'min-w-5' : 'w-fit'
                    } ${
                      activeTabIndex == index
                        ? 'border-blue-light bg-blue/20 text-blue'
                        : 'border-border bg-primary/60 text-body-700'
                    }`}
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
