import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ICON_SLOT,
  collapseLabelClass,
} from '@/components/ui/sidebar/constants';
import { useSidebar } from '@/components/ui/sidebar/context';
import {
  navIconClass,
  navIconTileClass,
  navRowClass,
} from '@/components/ui/sidebar/itemStyles';
import type { IconProps } from '@/types';

export type SidebarItemProps = {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  alert?: boolean;
};

const SidebarItem = ({
  to,
  label,
  icon: Icon,
  alert = false,
}: SidebarItemProps) => {
  const { expanded } = useSidebar();

  return (
    <li>
      <NavLink
        to={to}
        title={!expanded ? label : undefined}
        className={({ isActive }) => navRowClass({ expanded, isActive })}
      >
        {({ isActive }) => (
          <>
            {isActive && expanded && (
              <span
                className="absolute inset-0 rounded-xl bg-gradient-idea-blue"
                aria-hidden
              />
            )}
            {isActive && expanded && (
              <span
                className="absolute left-0 top-1/2 z-20 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue"
                aria-hidden
              />
            )}

            <span className={`relative z-10 ${ICON_SLOT}`}>
              <span className={navIconTileClass({ expanded, isActive })}>
                <Icon className={navIconClass(isActive)} />
              </span>
            </span>

            <span className={collapseLabelClass(expanded)}>{label}</span>

            {alert && expanded && (
              <span
                className="relative z-10 ml-auto h-2 w-2 shrink-0 rounded-full bg-red"
                aria-label="Notification"
              />
            )}

            {!expanded && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border/60 bg-primary px-2.5 py-1.5 text-xs font-medium text-body opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              >
                {label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
};

export default SidebarItem;
