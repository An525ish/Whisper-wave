import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ContextMenuOption, ContextMenuState } from '@/types';

type ContextMenuProps = {
  menuState: ContextMenuState;
  hideContextMenu: () => void;
};

const VIEWPORT_PADDING = 8;

const optionsShellClass =
  'w-fit min-w-44 overflow-hidden rounded-xl border border-border bg-primary py-0.5 shadow-lg';

const ContextMenu = ({ menuState, hideContextMenu }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState(menuState.position);

  useLayoutEffect(() => {
    if (!menuState.visible) return;

    const menu = menuRef.current;
    if (!menu) {
      setCoords(menuState.position);
      return;
    }

    const { width, height } = menu.getBoundingClientRect();
    const maxX = window.innerWidth - width - VIEWPORT_PADDING;
    const maxY = window.innerHeight - height - VIEWPORT_PADDING;

    setCoords({
      x: Math.min(Math.max(VIEWPORT_PADDING, menuState.position.x), Math.max(VIEWPORT_PADDING, maxX)),
      y: Math.min(Math.max(VIEWPORT_PADDING, menuState.position.y), Math.max(VIEWPORT_PADDING, maxY)),
    });
  }, [menuState.visible, menuState.position.x, menuState.position.y, menuState.options, menuState.header, menuState.hideOptions]);

  if (!menuState.visible) return null;

  return createPortal(
    <div
      ref={menuRef}
      data-context-menu
      className="fixed z-300 flex w-max max-w-[calc(100vw-1rem)] flex-col items-center gap-2 overflow-visible"
      style={{ top: coords.y, left: coords.x }}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {menuState.header ? (
        <div className="flex justify-center">{menuState.header}</div>
      ) : null}
      {!menuState.hideOptions ? (
      <ul role="menu" className={optionsShellClass}>
        {menuState.options.map((option: ContextMenuOption) => (
          <li key={option.label} role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 whitespace-nowrap border-0 border-b px-3.5 py-2 text-left text-sm text-body-700 transition hover:bg-gradient-dark-black hover:text-body hover:filter-none full-border last:border-b-0"
              onClick={() => {
                option.onClick();
                hideContextMenu();
              }}
            >
              {typeof option.icon === 'string' ? (
                <img className="h-5 w-5 shrink-0" src={option.icon} alt="" />
              ) : (
                <span className="grid h-5 w-5 shrink-0 place-items-center text-body-700">
                  {option.icon}
                </span>
              )}
              <span>{option.label}</span>
            </button>
          </li>
        ))}
      </ul>
      ) : null}
    </div>,
    document.body,
  );
};

export default ContextMenu;
