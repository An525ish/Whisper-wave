import type { MessageContextMenuOption } from '@/types/chat';
import { type MouseEvent, type ReactNode, useRef, useState } from 'react';

type MessageContextMenuProps = {
  children: ReactNode;
  options?: MessageContextMenuOption[];
  disabled?: boolean;
};

type MenuPosition = { x: number; y: number };

/**
 * Wraps a message with a right-click context menu.
 * Assemble `options` in the parent; this component handles
 * trigger positioning and dismissal only.
 */
const MessageContextMenu = ({
  children,
  options = [],
  disabled = false,
}: MessageContextMenuProps) => {
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) return;
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
  };

  const close = () => setPos(null);

  return (
    <div ref={containerRef} onContextMenu={open} className="contents">
      {children}

      {pos ? (
        <>
          <div
            className="fixed inset-0 z-50"
            aria-hidden
            onClick={close}
            onContextMenu={(e) => {
              e.preventDefault();
              close();
            }}
          />
          <ul
            role="menu"
            style={{ top: pos.y, left: pos.x }}
            className="fixed z-50 min-w-36 overflow-hidden rounded-xl border border-white/10 bg-[rgba(28,22,38,0.96)] p-1 shadow-2xl backdrop-blur-xl"
          >
            {options.map((opt) => (
              <li key={opt.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    opt.onClick();
                    close();
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-white/8 ${
                    opt.danger ? 'text-red hover:text-red' : 'text-body hover:text-green'
                  }`}
                >
                  {opt.icon ? (
                    <img src={opt.icon} alt="" className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export default MessageContextMenu;
