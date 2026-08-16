import { ICON_TILE } from '@/components/ui/sidebar/constants';

type ItemStyleInput = {
  expanded: boolean;
  isActive: boolean;
};

export const navRowClass = ({ expanded, isActive }: ItemStyleInput) =>
  [
    'group relative flex min-h-10 w-full items-center gap-3 rounded-xl py-1 transition-colors duration-300',
    isActive ? 'text-blue' : 'text-body-300',
    expanded && !isActive ? 'hover:bg-primary/50 hover:text-body' : '',
  ]
    .filter(Boolean)
    .join(' ');

export const navIconTileClass = ({ expanded, isActive }: ItemStyleInput) => {
  const base = `relative z-10 flex ${ICON_TILE} shrink-0 items-center justify-center rounded-lg transition-[background-color,box-shadow,ring-color] duration-200`;

  if (isActive) {
    return expanded
      ? `${base} bg-transparent ring-1 ring-blue/25`
      : `${base} bg-gradient-idea-blue ring-1 ring-blue/35 shadow-[0_0_10px_rgba(86,152,255,0.12)]`;
  }

  return expanded
    ? `${base} bg-primary/30 ring-1 ring-border/40 group-hover:bg-primary/50`
    : `${base} bg-primary/30 ring-1 ring-border/40 group-hover:bg-primary/55 group-hover:ring-blue/15`;
};

export const navIconClass = (isActive: boolean) =>
  `h-4 w-4 transition-colors ${
    isActive
      ? 'fill-blue stroke-blue'
      : 'fill-body-300 stroke-body-300 group-hover:fill-body group-hover:stroke-body'
  }`;
