import UserFilterChip from '@/components/admin/shared/UserFilterChip';
import { MESSAGE_STATUS_TABS } from '@/constants/admin/messages';
import type { AdminMessageStatusFilter, UserFilterOption } from '@/types/admin';

type StatusFilterTabsProps = {
  statusFilter: AdminMessageStatusFilter;
  onStatusChange: (status: AdminMessageStatusFilter) => void;
  senderFilter: UserFilterOption | null;
  onSenderChange: (sender: UserFilterOption | null) => void;
  tabCount: number;
};

const StatusFilterTabs = ({
  statusFilter,
  onStatusChange,
  senderFilter,
  onSenderChange,
  tabCount,
}: StatusFilterTabsProps) => (
  <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
    {MESSAGE_STATUS_TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onStatusChange(tab.id)}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          statusFilter === tab.id
            ? 'border-blue/35 bg-blue/10 text-blue'
            : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
        }`}
      >
        {tab.label}
        {statusFilter === tab.id ? (
          <span className="rounded-full bg-blue/15 px-1.5 py-0.5 text-[10px] tabular-nums text-blue">
            {tabCount}
          </span>
        ) : null}
      </button>
    ))}
    <UserFilterChip value={senderFilter} onChange={onSenderChange} label="Sender" />
  </div>
);

export default StatusFilterTabs;
