import type { AdminMemeBlockItem } from '../../types';

type Props = {
  items: AdminMemeBlockItem[];
  unblockingId: number | null;
  onUnblock: (id: number) => void;
};

const MemeBlockList = ({ items, unblockingId, onUnblock }: Props) => (
  <ul className="flex flex-col gap-2" aria-label="Reported and blocked jokes">
    {items.map((item) => (
      <li
        key={item.id}
        className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-white/[0.02] px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-sm text-body">
            <span className="font-mono text-white">#{item.id}</span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                item.blocked ? 'bg-red/20 text-red' : 'bg-white/10 text-body-300'
              }`}
            >
              {item.blocked ? 'blocked' : 'watching'}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-body-700">
            {item.reports} {item.reports === 1 ? 'report' : 'reports'}
            {item.reason ? ` · ${item.reason}` : ''}
            {' · '}
            {new Date(item.updatedAt).toLocaleString()}
          </p>
        </div>
        {item.blocked && (
          <button
            type="button"
            onClick={() => onUnblock(item.id)}
            disabled={unblockingId === item.id}
            className="shrink-0 text-xs font-medium text-green hover:underline disabled:opacity-50"
          >
            Unblock
          </button>
        )}
      </li>
    ))}
  </ul>
);

export default MemeBlockList;
