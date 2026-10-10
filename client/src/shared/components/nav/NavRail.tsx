import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import CountBadge from '@/shared/components/ui/CountBadge';
import type { NavItem } from '@/shared/types/ui';

type Props = {
  items: NavItem[];
  ariaLabel: string;
  /** Brand mark or similar, pinned above the destinations. */
  header?: ReactNode;
  /** Pinned below the destinations (account, persona). */
  footer?: ReactNode;
  /** Called with the destination id on navigation, for analytics. */
  onNavigate?: (id: string) => void;
  className?: string;
};

/**
 * The desktop primary navigation: a glass dock with icon tiles.
 *
 * Domain-agnostic — it renders whatever items it is handed, so the app decides
 * what the destinations are. Active state is a gradient wash plus a glowing
 * edge notch (never a faint wash); the emphasized destination is a filled
 * gradient button with a halo when active.
 */
const NavRail = ({ items, ariaLabel, header, footer, onNavigate, className = '' }: Props) => (
  <nav
    aria-label={ariaLabel}
    className={`relative w-[4.75rem] shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-background/70 px-2 py-4 backdrop-blur-xl ${className}`.trim()}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-green/25 to-transparent"
    />
    {header}
    <ul className="mt-1 flex w-full flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <NavLink
            to={item.to}
            onClick={() => onNavigate?.(item.id)}
            className={({ isActive }) =>
              `group relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium leading-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
                isActive ? 'text-green' : 'text-body-700 hover:text-body'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={`absolute left-[-0.5rem] top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-linear-to-b from-green-light via-green to-green-dark transition-all duration-200 ${
                    isActive ? 'opacity-100 shadow-[0_0_12px_1px_rgba(1,195,109,0.8)]' : 'opacity-0'
                  }`}
                />
                <span
                  className={`grid place-items-center transition-all duration-200 ${
                    item.emphasis
                      ? `h-11 w-11 rounded-full bg-gradient-green text-white [&>svg]:h-5 [&>svg]:w-5 ${
                          isActive
                            ? 'shadow-[0_0_26px_-2px_rgba(1,195,109,0.95)] outline outline-2 outline-offset-2 outline-green/60'
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
                <span className="tracking-wide">{item.label}</span>
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
      <div className="mt-auto w-full border-t border-border/40 pt-2">{footer}</div>
    ) : null}
  </nav>
);

export default NavRail;
