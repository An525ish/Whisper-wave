import { useCallback, useRef, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import toast from 'react-hot-toast';

type MutationHook<TData, TVariables, TError = Error> = () => UseMutationResult<
  TData,
  TError,
  TVariables
>;

function readMessage(res: unknown): string | undefined {
  if (
    res &&
    typeof res === 'object' &&
    'message' in res &&
    typeof (res as { message: unknown }).message === 'string'
  ) {
    return (res as { message: string }).message;
  }
  return undefined;
}

function readData(res: unknown): unknown {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data?: unknown }).data ?? res;
  }
  return res;
}

const useAsyncMutation = <
  TData = unknown,
  TVariables = unknown,
  TError = Error,
>(
  mutationHook: MutationHook<TData, TVariables, TError>,
): [
  (
    toastMessage: string | false | null | undefined,
    variables: TVariables,
  ) => Promise<unknown>,
  { isLoading: boolean; data: unknown },
] => {
  const [data, setData] = useState<unknown>(null);
  const mutation = mutationHook();

  // Keep mutation in a ref so execMutation can stay referentially stable
  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;

  const execMutation = useCallback(
    async (
      toastMessage: string | false | null | undefined,
      variables: TVariables,
    ): Promise<unknown> => {
      const toastId =
        toastMessage && toast.loading(toastMessage || 'Updating data...');
      try {
        const res = await mutationRef.current.mutateAsync(variables);
        const payload = readData(res);
        setData(payload);
        if (toastMessage && toastId) {
          toast.success(readMessage(res) || 'Updated', {
            id: toastId,
          });
        }
        // Return unwrapped `data` so callers can use `_id` etc. directly
        return payload;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Something went wrong';
        if (toastId) toast.error(message, { id: toastId });
        else toast.error(message);
        return null;
      }
    },
    [], // stable — reads mutation via ref
  );

  return [execMutation, { isLoading: mutation.isPending, data }];
};

export default useAsyncMutation;
