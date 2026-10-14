import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import useContextMenu from '@/shared/hooks/useContextMenu';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useLongPress } from '@/shared/hooks/useLongPress';
import { ROOM_MUTE_MINUTES } from '../constants';
import { menuIcon } from '../utils/menuIcon';
import type { RoomMenuItem, RoomMessage, RoomModAction, RoomRole } from '../types';

interface Params {
  role: RoomRole | undefined;
  onReply: (messageId: string) => void;
  onReport: (messageId: string) => void;
  onKick: (message: RoomMessage) => void;
  onMod: (action: RoomModAction) => void;
}

const MENU_ITEM = '[data-context-menu] [role="menuitem"]';

/**
 * The per-message menu: right-click, touch long-press and the focusable
 * "Message actions" button all open this one list (Reply / Copy / Report, plus
 * the mod tools where the role allows). Opening from the button moves focus
 * into the menu and hands it back to the button when the menu closes.
 */
export function useRoomMessageMenu({ role, onReply, onReport, onKick, onMod }: Params) {
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const { copy } = useCopyToClipboard();
  const triggerRef = useRef<HTMLElement | null>(null);
  const canModerate = role !== undefined && role !== 'member';

  const itemsFor = useCallback(
    (message: RoomMessage): RoomMenuItem[] => {
      const items: RoomMenuItem[] = [
        {
          id: 'reply',
          label: 'Reply',
          icon: menuIcon(<path d="M9 17l-5-5 5-5 M4 12h9a7 7 0 0 1 7 7v1" />),
          run: () => onReply(message.id),
        },
        {
          id: 'copy',
          label: 'Copy text',
          icon: menuIcon(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
          run: () => copy(message.text),
        },
        {
          id: 'report',
          label: 'Report',
          danger: true,
          icon: menuIcon(<><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></>),
          run: () => onReport(message.id),
        },
      ];
      if (!canModerate) return items;
      const target = message.from.alias;
      if (message.hidden) {
        items.push({
          id: 'unhide',
          label: 'Unhide message',
          icon: menuIcon(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
          run: () => onMod({ action: 'unhide', messageId: message.id }),
        });
      } else {
        items.push({
          id: 'delete',
          label: 'Delete message',
          danger: true,
          icon: menuIcon(<path d="M4 7h16 M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />),
          run: () => onMod({ action: 'delete', messageId: message.id }),
        });
      }
      items.push(
        {
          id: 'mute',
          label: `Mute ${ROOM_MUTE_MINUTES} min`,
          icon: menuIcon(<path d="M11 5L6 9H3v6h3l5 4V5z M22 9l-6 6 M16 9l6 6" />),
          run: () => onMod({ action: 'mute', target, minutes: ROOM_MUTE_MINUTES }),
        },
        {
          id: 'shadowmute',
          label: 'Shadow-mute',
          icon: menuIcon(<><path d="M17.9 17.9A10 10 0 0 1 12 20c-6 0-10-8-10-8a18 18 0 0 1 5-5.9" /><path d="M1 1l22 22" /></>),
          run: () => onMod({ action: 'shadowmute', target }),
        },
        {
          id: 'kick',
          label: 'Kick from room',
          danger: true,
          icon: menuIcon(<path d="M13 4L4 14h6l-1 8 9-12h-6l1-8z" />),
          run: () => onKick(message),
        }
      );
      return items;
    },
    [canModerate, copy, onKick, onMod, onReply, onReport]
  );

  const open = useCallback(
    (message: RoomMessage, x: number, y: number) => {
      if (message.system) return;
      showContextMenu(
        { x, y },
        itemsFor(message).map(({ label, icon, danger, run }) => ({ label, icon, danger, onClick: run }))
      );
    },
    [itemsFor, showContextMenu]
  );

  const bindLongPress = useLongPress<RoomMessage>((message, point) => {
    triggerRef.current = null;
    open(message, point.clientX, point.clientY);
  });

  const onContextMenu = useCallback(
    (e: ReactMouseEvent, message: RoomMessage) => {
      e.preventDefault();
      triggerRef.current = null;
      open(message, e.clientX, e.clientY);
    },
    [open]
  );

  /** Keyboard / screen-reader entry: anchor under the button and take focus. */
  const openFromButton = useCallback(
    (message: RoomMessage, button: HTMLElement) => {
      const rect = button.getBoundingClientRect();
      triggerRef.current = button;
      open(message, rect.left, rect.bottom + 4);
    },
    [open]
  );

  const visible = menuState.visible;
  useEffect(() => {
    if (!visible) {
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
      return;
    }
    if (!triggerRef.current) return;
    // The menu mounts in a portal after this render; focus its first row next frame.
    const id = requestAnimationFrame(() => document.querySelector<HTMLElement>(MENU_ITEM)?.focus());
    return () => cancelAnimationFrame(id);
  }, [visible]);

  return { menuState, hideContextMenu, bindLongPress, onContextMenu, openFromButton };
}
