import { useEffect, useState, type ReactNode } from 'react';

export type ContextMenuPosition = {
  x: number;
  y: number;
};

export type ContextMenuOption = {
  icon: string | ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export type ContextMenuState = {
  visible: boolean;
  position: ContextMenuPosition;
  options: ContextMenuOption[];
};

const useContextMenu = () => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    options: [],
  });

  const showContextMenu = (
    position: ContextMenuPosition,
    options: ContextMenuOption[],
  ): void => {
    setMenuState({ visible: true, position, options });
  };

  const hideContextMenu = (): void => {
    setMenuState((prev) =>
      prev.visible ? { ...prev, visible: false } : prev,
    );
  };

  useEffect(() => {
    if (!menuState.visible) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-context-menu]')) return;
      hideContextMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideContextMenu();
    };

    const handleDismiss = () => hideContextMenu();

    // Defer so the opening right-click does not immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleDismiss);
      window.addEventListener('scroll', handleDismiss, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [menuState.visible]);

  return {
    menuState,
    showContextMenu,
    hideContextMenu,
  };
};

export default useContextMenu;
