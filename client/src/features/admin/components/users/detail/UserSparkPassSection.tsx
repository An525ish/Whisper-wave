import { useState } from 'react';
import toast from 'react-hot-toast';
import AdminConfirmModal from '../../shared/AdminConfirmModal';
import { formatExpiry, timeLeftLabel } from '@/features/pass/utils/pricing';
import type { PlanId } from '@/features/pass/types';
import { toErrorMessage } from '@/shared/utils/helpers';
import type { AdminUserRow } from '../../../types';
import { useGrantAdminUserPassMutation, useRevokeAdminUserPassMutation } from '../../../hooks';

const PLANS: { id: PlanId; label: string; days: string }[] = [
  { id: 'day', label: 'Day', days: '1 day' },
  { id: 'week', label: 'Week', days: '7 days' },
  { id: 'month', label: 'Month', days: '30 days' },
  { id: 'year', label: 'Year', days: '365 days' },
];

const planLabel = (id: string | null | undefined) =>
  PLANS.find((p) => p.id === id)?.label ?? id ?? 'Pass';

type Props = {
  userId: string;
  user?: Pick<AdminUserRow, 'sparkPassActive' | 'sparkPassExpiresAt' | 'sparkPassPlanId'>;
  isLoading: boolean;
};

type PendingAction = 'grant' | 'revoke';

/** Grant or revoke Spark Pass without Razorpay (support, testing, giveaways). */
export default function UserSparkPassSection({ userId, user, isLoading }: Props) {
  const [planId, setPlanId] = useState<PlanId>('month');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const grant = useGrantAdminUserPassMutation();
  const revoke = useRevokeAdminUserPassMutation();
  const busy = grant.isPending || revoke.isPending;
  const active = Boolean(user?.sparkPassActive && user.sparkPassExpiresAt);
  const left = active ? timeLeftLabel(user!.sparkPassExpiresAt!) : null;

  const selectedPlan = PLANS.find((p) => p.id === planId);

  const runGrant = async () => {
    try {
      await grant.mutateAsync({ userId, planId });
      toast.success('Spark Pass granted.');
    } catch (err) {
      toast.error(toErrorMessage(err));
      throw err;
    }
  };

  const runRevoke = async () => {
    try {
      await revoke.mutateAsync(userId);
      toast.success('Spark Pass ended.');
    } catch (err) {
      toast.error(toErrorMessage(err));
      throw err;
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/35 bg-linear-to-b from-primary/30 via-primary/15 to-primary/5 shadow-sm">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-border/20" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-border/15" />
              ))}
            </div>
            <div className="h-11 animate-pulse rounded-xl bg-border/20" />
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-xl border px-3 py-2.5 sm:px-3.5 ${
                active
                  ? 'border-gold/20 bg-gold/[0.04]'
                  : 'border-dashed border-border/45 bg-primary/15'
              }`}
            >
              {active ? (
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/35 bg-gold/10 text-sm text-gold"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/75">
                      Spark Pass
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold tabular-nums leading-tight text-body">
                      {formatExpiry(user!.sparkPassExpiresAt!)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-body-300">{planLabel(user?.sparkPassPlanId)}</p>
                    {left ? (
                      <p className="mt-0.5 text-[11px] tabular-nums text-body-300/55">{left}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 py-0.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/50 bg-primary/25 text-xs text-body-300/50"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <p className="text-sm text-body-300">No active pass</p>
                </div>
              )}
            </div>

            <div role="group" aria-label="Pass length to grant">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PLANS.map((plan) => {
                  const selected = planId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={busy}
                      onClick={() => setPlanId(plan.id)}
                      className={`flex flex-col items-center rounded-xl border px-2 py-3 text-center transition focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50 ${
                        selected
                          ? 'border-gold/50 bg-linear-to-b from-gold/15 to-primary/30 shadow-[0_0_0_1px] shadow-gold/25'
                          : 'border-border/40 bg-primary/20 hover:border-gold/30 hover:bg-primary/30'
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          selected ? 'text-gold' : 'text-body-300'
                        }`}
                      >
                        {plan.label}
                      </span>
                      <span className={`mt-1 text-[11px] ${selected ? 'text-body' : 'text-body-300/55'}`}>
                        +{plan.days}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`flex flex-col gap-2 sm:flex-row sm:items-center ${active ? 'sm:gap-2.5' : ''}`}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending('grant')}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-linear-to-r from-[#e8c585] to-gold px-4 text-sm font-semibold text-[#1a1520] shadow-[0_8px_20px_-12px] shadow-gold/50 ring-1 ring-gold/25 transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
              >
                <span aria-hidden className="text-[#1a1520]/75">
                  ✦
                </span>
                <span>
                  {grant.isPending
                    ? 'Working…'
                    : active
                      ? 'Add time'
                      : 'Grant Spark Pass'}
                </span>
                {!grant.isPending && selectedPlan ? (
                  <span className="text-xs font-medium text-[#1a1520]/65">
                    · {selectedPlan.label}
                  </span>
                ) : null}
              </button>
              {active ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPending('revoke')}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-red/45 bg-red/[0.08] px-4 text-sm font-semibold text-red shadow-[0_8px_20px_-12px] shadow-red/20 ring-1 ring-inset ring-red/15 transition hover:border-red/60 hover:bg-red/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red/70 disabled:opacity-50 sm:max-w-[11rem] sm:flex-initial"
                >
                  End pass
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {pending === 'grant' && (
        <AdminConfirmModal
          variant="warning"
          title={active ? 'Add Spark Pass time?' : 'Grant Spark Pass?'}
          description={
            active
              ? `Adds ${selectedPlan?.days ?? 'time'} to this account. They keep perks until the new expiry.`
              : `Grants ${selectedPlan?.days ?? 'a pass'} of Spark Pass perks on this account.`
          }
          confirmLabel={active ? 'Add time' : 'Grant pass'}
          onClose={() => setPending(null)}
          working={grant.isPending}
          onConfirmed={runGrant}
        />
      )}

      {pending === 'revoke' && (
        <AdminConfirmModal
          variant="danger"
          title="End Spark Pass now?"
          description="They lose pass perks right away. You can grant again later."
          confirmLabel="End pass"
          onClose={() => setPending(null)}
          working={revoke.isPending}
          onConfirmed={runRevoke}
        />
      )}
    </div>
  );
}
