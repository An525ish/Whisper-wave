import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ThreeDotsIcon from '@/shared/components/icons/ThreeDots';

export type DotsMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
};

type DotsMenuProps = {
  ariaLabel: string;
  items: DotsMenuItem[];
  align?: 'left' | 'right';
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
        className={`grid h-9 w-9 place-items-center rounded-full border bg-primary text-body transition ${
          open
            ? 'border-green/50 bg-green/10 text-green'
            : 'border-border hover:border-green-light hover:text-white active:bg-primary/70'
        }`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ThreeDotsIcon className="h-3.5 w-3.5 fill-current stroke-current" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-11 z-40 w-max min-w-52 overflow-hidden rounded-xl border border-border/70 bg-primary p-1 shadow-lg ring-1 ring-black/5 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-sm transition ${
                item.disabled
                  ? 'cursor-not-allowed text-body-300/50'
                  : item.danger
                    ? 'text-body-700 hover:bg-white/8 hover:text-red'
                    : 'text-body-700 hover:bg-white/8 hover:text-green'
              }`}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.icon ? (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5">
                  {item.icon}
                </span>
              ) : null}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default DotsMenu;
