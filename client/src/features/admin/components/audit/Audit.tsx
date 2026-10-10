import { useModAuditQuery } from '@/features/admin/hooks';

/**
 * Moderation audit trail: who did what, to whom, where. Read-only — every
 * mod/admin action logs itself at execution. The runbook's "what did we do"
 * question is answered here.
 */
const Audit = () => {
  const { data: entries, isLoading } = useModAuditQuery();

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl text-white">Audit</h1>
        {entries && (
          <p className="text-sm text-body-300" aria-live="polite">
            last {entries.length} actions
          </p>
        )}
      </div>

      {isLoading && (
        <div aria-label="Loading audit trail" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      )}

      <ul className="flex flex-col gap-2" aria-label="Moderation actions">
        {entries?.map((entry) => (
          <li key={entry._id} className="rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2">
            <p className="text-sm text-body">
              <span className="font-medium text-white">{entry.actorLabel}</span>
              {' · '}
              <span className="font-mono text-[13px] text-green">{entry.action}</span>
              {entry.target && (
                <span className="text-body-300"> → {entry.target}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-body-700">
              {entry.actorKind}
              {entry.roomSlug ? ` · /rooms/${entry.roomSlug}` : ''}
              {entry.detail ? ` · ${entry.detail}` : ''}
              {' · '}
              {new Date(entry.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      {entries?.length === 0 && (
        <p className="py-6 text-center text-sm text-body-700">
          No moderation actions yet — quiet is good.
        </p>
      )}
    </div>
  );
};

export default Audit;
