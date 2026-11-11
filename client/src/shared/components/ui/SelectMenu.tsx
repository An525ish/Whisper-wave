import { useEffect, useId, useRef, useState } from 'react';
import DropdownIcon from '@/shared/components/ui/icons/Dropdown';
import CheckIcon from '@/shared/components/ui/icons/Check';
import { useMenuKeyboard } from '@/shared/hooks/useMenuKeyboard';

export type SelectMenuOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

type SelectMenuProps<T extends string> = {
  id?: string;
  label: string;
  value: T;
  options: SelectMenuOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Matches admin panel density. */
  size?: 'sm' | 'md';
};

const SelectMenu = <T extends string>({
  id: idProp,
  label,
  value,
  options,
  onChange,
  disabled,
  size = 'sm',
}: SelectMenuProps<T>) => {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const buttonId = idProp ?? `${uid}-select`;
  const menuId = `${uid}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMenuKeyDown = useMenuKeyboard({
    open,
    menuRef,
    triggerRef,
    onClose: () => setOpen(false),
  });

  const compact = size === 'sm';

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <span id={`${buttonId}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-labelledby={`${buttonId}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-border/45 bg-primary/25 text-left text-body shadow-sm transition hover:border-border/70 hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? 'h-10 px-3 text-sm' : 'h-11 px-3.5 text-sm'
        }`}
      >
        <span className="min-w-0 truncate font-medium">{selected?.label ?? 'Choose…'}</span>
        <DropdownIcon
          className={`h-4 w-4 shrink-0 text-body-300 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-labelledby={`${buttonId}-label`}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-primary/90 p-1 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl focus:outline-none"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-green ${
                  active
                    ? 'bg-gold/12 text-gold'
                    : 'text-body-300 hover:bg-white/[0.06] hover:text-body'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{opt.label}</span>
                  {opt.description ? (
                    <span className="mt-0.5 block text-xs text-body-300/70">{opt.description}</span>
                  ) : null}
                </span>
                {active ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default SelectMenu;
