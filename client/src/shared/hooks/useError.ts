import type { ErrorEntry } from '@/shared/types';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '@/api/client';


function readErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'message' in error.data &&
    typeof (error.data as { message: unknown }).message === 'string'
  ) {
    return (error.data as { message: string }).message;
  }

  return 'Something went wrong';
}

const useErrors = (errors: ErrorEntry[] = []): void => {
  const shownRef = useRef<Set<string>>(new Set());

  const signature = errors
    .map((e) => (e.isError ? `1:${readErrorMessage(e.error)}` : '0'))
    .join('|');

  useEffect(() => {
    errors.forEach(({ isError, error, fallback }) => {
      if (!isError) return;

      const key = readErrorMessage(error);
      if (shownRef.current.has(key)) return;
      shownRef.current.add(key);

      if (fallback) fallback();
      else toast.error(key);
    });

    const active = new Set(
      errors.filter((e) => e.isError).map((e) => readErrorMessage(e.error)),
    );
    for (const key of [...shownRef.current]) {
      if (!active.has(key)) shownRef.current.delete(key);
    }
    // Toast only when the error signature changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
};

export default useErrors;
