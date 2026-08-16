import CollapseButton from '@/components/ui/sidebar/CollapseButton';
import SidebarCollapseSlot from '@/components/ui/sidebar/SidebarCollapseSlot';
import { BRAND_SLOT, SIDEBAR_PAD } from '@/components/ui/sidebar/constants';
import { useSidebar } from '@/components/ui/sidebar/context';

const LOGO = '/logo-4.png';

/** Expanded workspace chip — matches footer session card */
const headerShellClass = (expanded: boolean) =>
  [
    'flex w-full min-w-0 items-center transition-[background-color,border-color,padding,gap] duration-300 ease-out',
    expanded
      ? 'gap-2.5 rounded-xl border border-border/60 bg-primary/25 py-1.5 pl-1.5 pr-1 hover:bg-primary/35'
      : 'gap-0.5 border border-transparent bg-transparent py-0 pl-0 pr-0',
  ].join(' ');

const SidebarHeader = () => {
  const { expanded, toggle } = useSidebar();

  return (
    <header
      className={`shrink-0 border-b border-border/50 ${SIDEBAR_PAD} ${expanded ? 'pb-3' : 'pb-2.5'}`}
    >
      <div className={headerShellClass(expanded)}>
        <span className={`${BRAND_SLOT} order-1`}>
          <img
            src={LOGO}
            alt="Whisper Wave"
            className="h-11 w-11 object-contain"
          />
        </span>

        {expanded && (
          <SidebarCollapseSlot className="order-2">
            <p className="truncate text-sm font-semibold leading-tight text-body">
              Whisper Wave
            </p>
            <p className="truncate text-[11px] leading-tight text-body-300">
              Admin panel
            </p>
          </SidebarCollapseSlot>
        )}

        <CollapseButton
          expanded={expanded}
          onClick={toggle}
          className="order-3 ml-auto shrink-0"
        />
      </div>
    </header>
  );
};

export default SidebarHeader;
