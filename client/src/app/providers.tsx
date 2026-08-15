import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import type { ReactNode } from 'react';
import { queryClient } from '@/app/queryClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function AppProviders({ children }: { children: ReactNode }) {
  const inner = (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        {children}
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </HelmetProvider>
    </QueryClientProvider>
  );

  // Only mount GoogleOAuthProvider when a client ID is configured.
  // The app boots fine without it — Google buttons are hidden when unconfigured.
  if (!GOOGLE_CLIENT_ID) return inner;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {inner}
    </GoogleOAuthProvider>
  );
}
