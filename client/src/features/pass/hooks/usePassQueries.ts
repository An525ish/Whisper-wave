import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import * as passApi from '../api/pass';
import { passKeys } from './queryKeys';

/** Prices and whether buying is switched on. Public, so guests see it too. */
export const usePlansQuery = () =>
  useQuery({ queryKey: passKeys.plans, queryFn: passApi.getPlans, staleTime: 5 * 60_000 });

/** The signed-in account's pass. Guests have none and never hit the server. */
export const useEntitlementsQuery = () => {
  const signedIn = useAuthStore((s) => s.user !== null);
  return useQuery({
    queryKey: passKeys.me,
    queryFn: passApi.getEntitlements,
    enabled: signedIn,
    staleTime: 60_000,
  });
};

/** True only while a live pass is confirmed by the server. Never true for guests. */
export const useHasPass = (): boolean => useEntitlementsQuery().data?.pass.active ?? false;
