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
    className={`relative z-20 shrink-0 px-2 pt-1 pb-[max(0.45rem,env(safe-area-inset-bottom))] min-[375px]:px-3 ${className}`.trim()}
  >
    {/* A floating glass pill instead of an edge-to-edge strip. */}
    <ul className="flex items-center justify-around gap-0.5 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-0.5 min-[375px]:gap-0.5 min-[375px]:p-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      {/* Same stops as `bg-gradient-green` — paints Whisper waves with the old pill colour. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <linearGradient id="ww-tab-whisper-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#01c36d" />
            <stop offset="0.01%" stopColor="#01c16c" />
            <stop offset="100%" stopColor="#019c57" />
          </linearGradient>
        </defs>
      </svg>
      {items.filter((item) => !item.railOnly).map((item) => (
        <li key={item.id} className="min-w-0 flex-1">
          <NavLink
            to={item.to}
            onClick={() => onNavigate?.(item.id)}
            className={({ isActive }) =>
              `relative flex h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-[1.1rem] text-[10px] font-medium leading-none tracking-wide min-[375px]:text-[10.5px] transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green ${
                isActive ? 'text-green' : 'text-body-600'
              }`
            }
          >
            {() => (
              <>
                <span
                  className={`grid h-[18px] w-[18px] place-items-center [&>svg]:h-[18px] [&>svg]:w-[18px] ${
                    item.emphasis
                      ? '[&>svg]:[stroke:url(#ww-tab-whisper-grad)] drop-shadow-[0_4px_10px_rgba(1,195,109,0.55)]'
                      : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
                {item.badge ? (
                  <CountBadge
                    count={item.badge}
                    label={`${item.badge} unread`}
                    className="absolute right-[calc(50%-1.6rem)] top-1"
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
