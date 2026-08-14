import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import ThreeDotsIcon from '@/components/ui/icons/ThreeDots';
import type { DotsMenuItem } from '@/types/ui';

export type { DotsMenuItem };

type DotsMenuProps = {
  ariaLabel: string;
  items: DotsMenuItem[];
  align?: 'left' | 'right';
};

const chipTone = {
  default:
    'bg-white/6 text-body-700 group-hover:bg-white/10 group-hover:text-body',
  accent: 'bg-green/15 text-green group-hover:bg-green/25',
  danger: 'bg-white/6 text-body-700 group-hover:bg-red/15 group-hover:text-red',
} as const;

const rowTone = {
  default: 'text-body-700 hover:bg-white/6 hover:text-body',
  accent: 'text-body hover:bg-green/10 hover:text-green',
  danger: 'text-body-700 hover:bg-red/10 hover:text-red',
} as const;

const resolveTone = (item: DotsMenuItem): keyof typeof rowTone => {
  if (item.tone) return item.tone;
  if (item.danger) return 'danger';
  return 'default';
};

const DotsMenu = ({
  ariaLabel,
  items,
  align = 'right',
}: DotsMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        className={`grid h-9 w-9 place-items-center rounded-full border text-body transition ${
          open
            ? 'border-green/50 bg-green/10 text-green'
            : 'border-white/15 hover:border-green-light hover:text-white active:bg-primary/70'
        }`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ThreeDotsIcon className="h-5 w-5 fill-current" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-12 z-40 w-48 origin-top-right animate-menu-pop overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(48,38,60,0.97)_0%,rgba(28,22,38,0.98)_100%)] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(1,195,109,0.08)] backdrop-blur-xl motion-reduce:animate-none ${
            align === 'left' ? 'left-0 origin-top-left' : 'right-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-green/35 to-transparent" />

          {items.map((item) => {
            const tone = resolveTone(item);
            return (
              <div key={item.id}>
                {item.dividerBefore ? (
                  <div className="mx-2 my-0.5 h-px bg-white/8" />
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={`group flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${rowTone[tone]}`}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  {item.icon ? (
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${chipTone[tone]}`}
                    >
                      {item.icon}
                    </span>
                  ) : null}
                  <span className={tone === 'accent' ? 'font-medium' : undefined}>
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default DotsMenu;
