import { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DropdownIcon from '@/shared/components/ui/icons/Dropdown';
import Image from '@/shared/components/ui/Image';
import { useMenuKeyboard } from '@/shared/hooks/useMenuKeyboard';
import type { DropdownOption } from '@/shared/types/ui';

type DropdownProps = {
  options: DropdownOption[];
  name: string;
  avatarUrl?: string | null;
  /** sm = desktop layout, scaled down for mobile chrome */
  size?: 'md' | 'sm';
  /** up = menu opens above the trigger (footers, bottom sheets). */
  placement?: 'down' | 'up';
  /** avatar-only trigger for tight chrome (rails) — name moves into the menu. */
  avatarOnly?: boolean;
};

const Dropdown = ({ options, name, avatarUrl, size = 'md', placement = 'down', avatarOnly = false }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const compact = size === 'sm';
  const up = placement === 'up';
  const uid = useId();
  const buttonId = `${uid}-button`;
  const menuId = `${uid}-menu`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, placed: false });

  // Upward menus portal to the body: rail chrome (blur, overflow, z-order)
  // would otherwise clip anything hanging past its edges. They open beside
  // the trigger (bottom-aligned), not above it.
  useLayoutEffect(() => {
    if (!isOpen || !up) return;
    const place = () => {
      const trigger = containerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!trigger) return;
      const mw = menu?.offsetWidth ?? 176;
      const mh = menu?.offsetHeight ?? 200;
      const pad = 8;
      setMenuPos({
        top: Math.min(Math.max(pad, trigger.bottom - mh), Math.max(pad, window.innerHeight - mh - pad)),
        left: Math.min(Math.max(pad, trigger.right + 8), Math.max(pad, window.innerWidth - mw - pad)),
        placed: true,
      });
    };
    place();
  }, [isOpen, up]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMenuKeyDown = useMenuKeyboard({
    open: isOpen,
    menuRef,
    triggerRef,
    onClose: () => setIsOpen(false),
  });

  const toggleDropdown = () => {
    if (!isOpen) setMenuPos((p) => ({ ...p, placed: false }));
    setIsOpen(!isOpen);
  };

  const menuOptions = (
    <div className={up ? 'p-1' : 'p-1.5'}>
      {options.map(({ label, Icon, handler, danger }, index) => (
        <button
          key={index}
          type="button"
          className={`group flex w-full items-center gap-2 whitespace-nowrap rounded-xl text-left text-[13px] transition focus-visible:outline-2 focus-visible:outline-green ${
            up ? 'px-2 py-1.5' : 'px-2.5 py-2 text-sm'
          } ${
            danger ? 'text-red hover:bg-red/10 hover:text-red' : 'text-body-300 hover:bg-white/[0.06] hover:text-body'
          }`}
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            handler();
            setIsOpen(false);
          }}
        >
          {Icon ? (
            <span
              className={`grid shrink-0 place-items-center rounded-lg transition ${
                up ? 'h-6 w-6' : 'h-7 w-7'
              } ${
                danger
                  ? 'bg-red/10 text-red'
                  : 'bg-white/[0.06] text-body-300 group-hover:text-body'
              }`}
            >
              <Icon className={up ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );

  const menuHeader = avatarOnly ? (
    <div className={`flex items-center gap-2 border-b border-white/[0.07] ${up ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}>
      <span aria-hidden className={`shrink-0 overflow-hidden rounded-full bg-background-alt ${up ? 'h-7 w-7' : 'h-8 w-8'}`}>
        <Image src={avatarUrl} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold capitalize text-body">
          {name}
        </span>
        <span className="block text-[11px] text-green">Online</span>
      </span>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative inline-flex w-fit flex-col text-left">
      <button
        type="button"
        className={
          avatarOnly
            ? 'group relative grid place-items-center rounded-full transition focus:outline-none'
            : 'inline-flex max-w-44 items-center text-sm font-medium capitalize leading-none text-body-700 transition hover:text-body focus:outline-none'
        }
        ref={triggerRef}
        id={buttonId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        aria-label={avatarOnly ? `Account menu for ${name}` : undefined}
        onClick={toggleDropdown}
      >
        <span
          className={`relative z-10 shrink-0 overflow-hidden rounded-full border-2 bg-background-alt shadow-sm transition ${
            avatarOnly
              ? `h-11 w-11 ${isOpen ? 'border-green/60 shadow-[0_0_16px_-2px_rgba(1,195,109,0.7)]' : 'border-border group-hover:border-green/40'}`
              : `border-border ${compact ? 'h-9 w-9' : 'h-11 w-11'}`
          }`}
        >
          <Image
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
          {avatarOnly && (
            <span
              aria-hidden
              className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green"
            />
          )}
        </span>
        {!avatarOnly && (
          <span
            className={`inline-flex min-w-0 items-center rounded-r-full border border-border bg-primary shadow-sm ${
              compact
                ? '-ml-3 h-7 gap-1 py-0 pl-4 pr-2'
                : '-ml-3.5 h-8 gap-1 py-0 pl-5 pr-2.5'
            }`}
          >
            <span className="min-w-0 truncate">{name}</span>
            <DropdownIcon
              className={`-mr-0.5 shrink-0 transition-transform ${
                compact ? 'h-4 w-4' : 'h-5 w-5'
              } ${isOpen ? 'rotate-180' : ''}`}
            />
          </span>
        )}
      </button>

      {isOpen ? (
        up ? (
          createPortal(
            <div
              ref={menuRef}
              id={menuId}
              onKeyDown={handleMenuKeyDown}
              className="fixed z-[60] min-w-44 overflow-hidden rounded-2xl border border-white/10 bg-primary/90 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl focus:outline-none"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                opacity: menuPos.placed ? 1 : 0,
              }}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby={buttonId}
              tabIndex={-1}
            >
              {menuHeader}
              {menuOptions}
            </div>,
            document.body
          )
        ) : (
          <div
            ref={menuRef}
            id={menuId}
            onKeyDown={handleMenuKeyDown}
            className={`absolute top-full z-60 mt-1 min-w-48 origin-top overflow-hidden rounded-2xl border border-white/10 bg-primary/90 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl focus:outline-none ${
              compact ? 'right-0 w-max min-w-full' : 'left-0 w-full'
            }`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={buttonId}
            tabIndex={-1}
          >
            {menuOptions}
          </div>
        )
      ) : null}
    </div>
  );
};

export default Dropdown;
