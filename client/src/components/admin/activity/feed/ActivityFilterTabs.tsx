import { ACTIVITY_FILTER_TABS } from '@/constants/admin/activity';
import type { AdminActivityFilter } from '@/types/admin';

type ActivityFilterTabsProps = {
  filter: AdminActivityFilter;
  onChange: (filter: AdminActivityFilter) => void;
};

const ActivityFilterTabs = ({ filter, onChange }: ActivityFilterTabsProps) => (
  <div
    className="inline-flex rounded-full border border-border/50 bg-primary/30 p-1"
    role="tablist"
    aria-label="Filter activity"
  >
    {ACTIVITY_FILTER_TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={filter === tab.id}
        onClick={() => onChange(tab.id)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          filter === tab.id
            ? 'bg-blue text-white shadow-sm shadow-blue/20'
            : 'text-body-300 hover:text-body'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default ActivityFilterTabs;
