import { useQueryClient } from '@tanstack/react-query';
import { useUpdateProfileMutation } from '@/features/auth';
import { queryKeys } from '@/features/chat';

/** Own-profile update that also refreshes the chat list, where the name/avatar show up. */
export function useUpdateOwnProfile() {
  const queryClient = useQueryClient();
  return useUpdateProfileMutation(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
  });
}
