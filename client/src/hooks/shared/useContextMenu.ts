import type { ReactNode } from 'react';
import type { ContextMenuPosition, ContextMenuOption, ContextMenuState } from '@/types';
import { useEffect, useState } from 'react';


const useContextMenu = () => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    options: [],
  });

  const showContextMenu = (
    position: ContextMenuPosition,
    options: ContextMenuOption[],
    header?: ReactNode,
  ): void => {
    setMenuState({ visible: true, position, options, header, hideOptions: false });
  };

  const hideContextMenu = (): void => {
    setMenuState((prev) =>
      prev.visible ? { ...prev, visible: false, hideOptions: false } : prev,
    );
  };

  const setContextMenuOptionsVisible = (visible: boolean): void => {
    setMenuState((prev) =>
      prev.visible ? { ...prev, hideOptions: !visible } : prev,
    );
  };

  useEffect(() => {
    if (!menuState.visible) return;

    const isInsideContextMenu = (target: EventTarget | null): boolean =>
      target instanceof Element && Boolean(target.closest('[data-context-menu]'));

    const handlePointerDown = (event: MouseEvent) => {
      if (isInsideContextMenu(event.target)) return;
      hideContextMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideContextMenu();
    };

    const handleScroll = (event: Event) => {
      // Scrolling inside the menu (e.g. emoji picker list) must not dismiss it.
      if (isInsideContextMenu(event.target)) return;
      hideContextMenu();
    };

    const handleDismiss = () => hideContextMenu();

    // Defer so the opening right-click does not immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleDismiss);
      window.addEventListener('scroll', handleScroll, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuState.visible]);

  return {
    menuState,
    showContextMenu,
    hideContextMenu,
    setContextMenuOptionsVisible,
  };
};

export default useContextMenu;
