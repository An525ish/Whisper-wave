import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useHubSummary } from '@/features/hub';
import { PANIC_FEATURES } from '../constants/rooms';
import { useFeatureFlagMutation } from './useAdminRooms';
import type { AdminFeatureFlag } from '../types';

export function usePanicCard() {
  const { data: summary, isLoading, isError, refetch } = useHubSummary();
  const [flip, { isLoading: flipping }] = useAsyncMutation(useFeatureFlagMutation);
  const features = summary?.features;

  const toggles = PANIC_FEATURES.map((item) => ({
    ...item,
    on: features?.[item.id] ?? false,
  }));

  const toggle = (feature: AdminFeatureFlag, enabled: boolean) =>
    flip(`${enabled ? 'Enabling' : 'Disabling'} ${feature}…`, { feature, enabled });

  return { toggles, isLoading, isError, refetch, flipping, toggle, ready: Boolean(features) };
}
