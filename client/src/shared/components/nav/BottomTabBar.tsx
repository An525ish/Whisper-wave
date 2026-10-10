import { NavLink } from 'react-router-dom';
import CountBadge from '@/shared/components/ui/CountBadge';
import type { NavItem } from '@/shared/types/ui';

type Props = {
  items: NavItem[];
  ariaLabel: string;
  /** Called with the destination id on navigation, for analytics. */
  onNavigate?: (id: string) => void;
  className?: string;
};

/**
 * The mobile primary navigation: a tab bar at the foot of the screen.
 *
 * Sits in the layout flow (not `fixed`), so content above it ends exactly where
 * the bar begins and the home-indicator inset is the bar's own padding.
 */
const BottomTabBar = ({ items, ariaLabel, onNavigate, className = '' }: Props) => (
  <nav
    aria-label={ariaLabel}
    className={`shrink-0 border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${className}`.trim()}
  >
    <ul className="flex items-stretch justify-around">
      {items.map((item) => (
        <li key={item.id} className="flex-1">
          <NavLink
            to={item.to}
            onClick={() => onNavigate?.(item.id)}
            className={({ isActive }) =>
              `relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green ${
                isActive ? 'text-green' : 'text-body-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid place-items-center transition-shadow duration-200 [&>svg]:h-6 [&>svg]:w-6 ${
                    item.emphasis
                      ? `h-9 w-9 rounded-full bg-gradient-green text-white [&>svg]:h-5 [&>svg]:w-5 ${
                          isActive
                            ? 'shadow-[0_0_20px_-2px_rgba(1,195,109,0.9)]'
                            : 'shadow-[0_4px_14px_-6px_rgba(1,195,109,0.7)]'
                        }`
                      : 'h-6 w-6'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge ? (
                  <CountBadge
                    count={item.badge}
                    label={`${item.badge} unread`}
                    className="absolute right-[calc(50%-1.75rem)] top-1.5"
                  />
                ) : null}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default BottomTabBar;
