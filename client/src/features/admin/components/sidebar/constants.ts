/** Layout tokens — single source for sidebar spacing and widths */
export const SIDEBAR_WIDTH = {
  expanded: 'w-64',
  collapsed: 'w-20',
} as const;

export const SIDEBAR_PAD = 'pl-4 pr-3 py-2';
export const SIDEBAR_ROW = 'flex min-h-10 items-center gap-3 py-1';
export const BRAND_SLOT = 'flex h-11 w-11 shrink-0 items-center justify-center';
export const ICON_SLOT = 'flex h-8 w-8 shrink-0 items-center justify-center';
export const ICON_TILE = 'h-8 w-8';

export const sidebarAsideClass = (expanded: boolean) =>
  `sticky top-0 z-30 flex h-dvh shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background transition-[width] duration-300 ease-out ${
    expanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed
  }`;

/** Expanded: in-flow flex-1. Collapsed: removed from flex so siblings sit flush. */
export const collapseTextClass = (expanded: boolean) =>
  expanded
    ? 'order-2 min-w-0 flex-1 overflow-hidden opacity-100 transition-[max-width,opacity] duration-300 ease-out'
    : 'pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0';

export const collapseLabelClass = (expanded: boolean) =>
  `relative z-10 truncate text-sm font-medium transition-[max-width,opacity,flex] duration-300 ease-out ${
    expanded ? 'max-w-40 flex-1 opacity-100' : 'max-w-0 flex-[0_0_0px] opacity-0'
  }`;
