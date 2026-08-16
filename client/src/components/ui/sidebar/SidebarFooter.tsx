import LeaveGroupIcon from '@/components/ui/icons/LeaveGroup';
import SidebarCollapseSlot from '@/components/ui/sidebar/SidebarCollapseSlot';
import {
  ICON_SLOT,
  SIDEBAR_PAD,
} from '@/components/ui/sidebar/constants';
import { useSidebar } from '@/components/ui/sidebar/context';
import { useAdminLogoutMutation } from '@/hooks/admin';

const footerShellClass = (expanded: boolean) =>
  [
    'transition-[background-color,border-color,padding,box-shadow] duration-300 ease-out',
    expanded
      ? 'rounded-xl border border-border/60 bg-primary/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
      : 'flex flex-col items-center gap-2 border border-transparent bg-transparent p-0',
  ].join(' ');

const SessionAvatar = () => (
  <div className="relative h-9 w-9 shrink-0">
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-blue/25 via-blue/10 to-primary/50 ring-1 ring-blue/30 shadow-[0_0_14px_rgba(86,152,255,0.14)]">
      <span className="font-display text-[11px] font-bold tracking-tight text-blue">OA</span>
    </div>
    <span
      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green shadow-[0_0_8px_rgba(34,197,94,0.45)]"
      aria-hidden
    />
  </div>
);

const SidebarFooter = () => {
  const { expanded } = useSidebar();
  const { mutate: logout, isPending } = useAdminLogoutMutation();

  const logoutButtonClass = (withLabel: boolean) =>
    [
      'flex items-center justify-center rounded-lg text-body-300',
      'filter-none outline-none [-webkit-tap-highlight-color:transparent]',
      'transition-[background-color,color,border-color] duration-200',
      'hover:bg-red/10 hover:text-red active:bg-red/15',
      'disabled:pointer-events-none disabled:opacity-40',
      withLabel
        ? 'w-full gap-2 border border-border/45 bg-primary/20 py-2 text-xs font-semibold hover:border-red/25'
        : `${ICON_SLOT} ring-1 ring-border/40 bg-primary/30 hover:ring-red/20`,
    ].join(' ');

  const logoutButton = (withLabel: boolean) => (
    <button
      type="button"
      onClick={() => logout()}
      disabled={isPending}
      title="Sign out"
      aria-label="Sign out"
      className={logoutButtonClass(withLabel)}
    >
      <LeaveGroupIcon className="h-4 w-4 shrink-0" />
      {withLabel ? <span>{isPending ? 'Signing out…' : 'Sign out'}</span> : null}
    </button>
  );

  return (
    <footer className={`shrink-0 border-t border-border/50 ${SIDEBAR_PAD} pt-2.5`}>
      <div className={footerShellClass(expanded)}>
        {expanded ? (
          <div className="space-y-2">
            <div className="flex min-w-0 items-center gap-2.5 px-0.5">
              <SessionAvatar />

              <SidebarCollapseSlot className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-none text-body">
                  Ops Admin
                </p>
                <p className="mt-1 truncate text-[10px] text-body-300">Active session</p>
              </SidebarCollapseSlot>
            </div>

            {logoutButton(true)}
          </div>
        ) : (
          <>
            <div className="group relative" title="Ops Admin — Active session">
              <SessionAvatar />
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border/60 bg-primary px-2.5 py-1.5 text-xs font-medium text-body opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              >
                Ops Admin
              </span>
            </div>
            {logoutButton(false)}
          </>
        )}
      </div>
    </footer>
  );
};

export default SidebarFooter;
