import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { toErrorMessage } from '@/shared/utils/helpers';
import * as passApi from '../api/pass';
import { passKeys } from './queryKeys';

/** Spend one boost credit. The server returns the new balance, which goes straight into the cache. */
export function useActivateBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: passApi.activateBoost,
    onSuccess: (next) => {
      queryClient.setQueryData(passKeys.me, next);
      toast.success('Boost is on. You go first for 30 minutes.');
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
      void queryClient.invalidateQueries({ queryKey: passKeys.me });
    },
  });
}
