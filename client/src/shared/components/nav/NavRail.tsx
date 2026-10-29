import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import ChevronLeftIcon from '@/shared/components/ui/icons/ChevronLeft';
import CountBadge from '@/shared/components/ui/CountBadge';
import type { NavItem } from '@/shared/types/ui';

export type NavRailMode = 'full' | 'pill' | 'strip';

type Props = {
  items: NavItem[];
  ariaLabel: string;
  /** Brand mark or similar, pinned above the destinations. */
  header?: ReactNode;
  /** Pinned below the destinations (account, persona). */
  footer?: ReactNode;
  /** Called with the destination id on navigation, for analytics. */
  onNavigate?: (id: string) => void;
  /** full = labelled dock, pill = icon-only capsule, strip = a thin handle that reopens the pill. */
  mode?: NavRailMode;
  onModeChange?: (mode: NavRailMode) => void;
  className?: string;
};

/**
 * The desktop primary navigation: a floating glass dock (inset from the window
 * edges) with icon tiles.
 *
 * Domain-agnostic — it renders whatever items it is handed, so the app decides
 * what the destinations are. Active state is a gradient wash plus a glowing
 * edge notch (never a faint wash); the emphasized destination is a filled
 * gradient button with an opaque ring + glow when active.
 */
const NavRail = ({ items, ariaLabel, header, footer, onNavigate, mode = 'full', onModeChange, className = '' }: Props) => {
  const collapsed = mode !== 'full';
  const hidden = mode === 'strip';
  return (
    <>
      <button
        type="button"
        onClick={() => onModeChange?.('pill')}
        aria-label="Open sidebar"
        title="Open sidebar"
        tabIndex={hidden ? 0 : -1}
        aria-hidden={!hidden}
        className={`group fixed left-0 top-1/2 z-20 w-5 -translate-y-1/2 cursor-pointer py-6 transition-[opacity,translate] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
          hidden ? 'opacity-100' : 'pointer-events-none -translate-x-3 opacity-0'
        } ${className}`.trim()}
      >
        <span className="block h-16 w-1.5 rounded-full bg-white/25 shadow-[0_0_12px_-2px_rgba(1,195,109,0)] transition group-hover:h-20 group-hover:bg-green group-hover:shadow-[0_0_14px_-2px_rgba(1,195,109,0.8)]" />
      </button>
      <nav
        aria-label={ariaLabel}
        inert={hidden}
        className={`relative z-20 shrink-0 flex-col items-center gap-1 border-white/[0.08] bg-linear-to-b from-white/[0.07] via-white/[0.025] to-white/[0.04] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[width,margin,padding,opacity,translate] duration-300 ease-out ${
          mode === 'full' ? 'my-3 ml-3 w-[4.9rem] rounded-[1.75rem] border px-2 py-4' : mode === 'pill' ? 'my-0 ml-3 w-[3.75rem] self-center rounded-full border px-2 py-3' : 'pointer-events-none my-0 ml-0 w-0 -translate-x-6 self-center overflow-hidden rounded-full border-0 px-0 py-3 opacity-0'
        } ${className}`.trim()}
      >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-green/50 to-transparent"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-[inherit] bg-linear-to-t from-green/[0.07] to-transparent"
    />
    {onModeChange ? (
      <>
        {collapsed ? (
          <button
            type="button"
            onClick={() => onModeChange('full')}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="grid h-7 w-7 place-items-center rounded-full text-body-700 transition hover:bg-white/[0.06] hover:text-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onModeChange(collapsed ? 'strip' : 'pill')}
          aria-label={collapsed ? 'Hide sidebar' : 'Minimise sidebar'}
          title={collapsed ? 'Hide sidebar' : 'Minimise sidebar'}
          className="absolute -right-3 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-[#12161c] text-body-700 shadow-lg transition hover:border-green/40 hover:text-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </button>
      </>
    ) : null}
    {collapsed ? null : header}
    <ul className={`mt-1 flex w-full flex-col gap-1 ${collapsed ? '' : 'flex-1 justify-center'}`}>
      {items.map((item) => (
        <li key={item.id}>
          <NavLink
            to={item.to}
            onClick={() => onNavigate?.(item.id)}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group relative flex w-full flex-col items-center gap-1.5 rounded-2xl ${collapsed ? 'px-0 py-1' : 'px-1 py-2.5'} text-[11px] font-medium leading-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
                isActive ? `${collapsed ? '' : 'bg-green/[0.06] '}font-semibold text-green` : 'text-body-700 hover:bg-white/[0.03] hover:text-body'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={`absolute inset-y-3 left-[-0.5rem] w-[3px] rounded-full bg-linear-to-b from-green-light via-green to-green-dark transition-all duration-200 ${
                    isActive ? 'opacity-100 shadow-[0_0_12px_1px_rgba(1,195,109,0.8)]' : 'opacity-0'
                  }`}
                />
                <span
                  className={`grid place-items-center transition-[box-shadow,transform,background-color] duration-200 group-hover:-translate-y-0.5 ${
                    item.emphasis
                      ? // Solid fill + opaque ring (no outline-offset): offset rings punch a
                        // transparent gap through the glass rail and look "washed out" when active.
                        `h-11 w-11 rounded-full bg-green bg-gradient-green text-white-pure [&>svg]:h-5 [&>svg]:w-5 ${
                          isActive
                            ? 'shadow-[0_0_0_2px_#01c36d,0_0_22px_-4px_rgba(1,195,109,0.9)]'
                            : 'shadow-[0_6px_20px_-6px_rgba(1,195,109,0.8)] group-hover:shadow-[0_0_24px_-4px_rgba(1,195,109,0.75)]'
                        }`
                      : `h-10 w-10 rounded-2xl [&>svg]:h-[22px] [&>svg]:w-[22px] ${
                          isActive
                            ? 'bg-linear-to-b from-green/20 to-green/5 text-green shadow-[inset_0_0_0_1px_rgba(1,195,109,0.35),0_0_18px_-6px_rgba(1,195,109,0.6)]'
                            : 'text-body-700 group-hover:bg-white/[0.06] group-hover:text-body'
                        }`
                  }`}
                >
                  {item.icon}
                </span>
                <span className={collapsed ? 'sr-only' : 'tracking-wide'}>{item.label}</span>
                {item.badge ? (
                  <CountBadge
                    count={item.badge}
                    label={`${item.badge} unread`}
                    className="absolute right-0.5 top-0.5"
                  />
                ) : null}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
    {footer ? (
      <div className={`flex w-full justify-center border-t border-white/10 pt-3 ${collapsed ? 'mt-1' : 'mt-auto'}`}>{footer}</div>
    ) : null}
      </nav>
    </>
  );
};

export default NavRail;
