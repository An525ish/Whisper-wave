import type { SidebarContextValue } from '@/types';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = {
  children: ReactNode;
  defaultExpanded?: boolean;
};

export const SidebarProvider = ({
  children,
  defaultExpanded = true,
}: SidebarProviderProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const value = useMemo<SidebarContextValue>(
    () => ({
      expanded,
      toggle: () => setExpanded((prev) => !prev),
    }),
    [expanded],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextValue => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return ctx;
};
