import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMyFriendsQuery } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';
import type { FriendsResponse } from '@/types/chat';

/** Navigate to the 1:1 chat with a group member (must already be friends). */
export function useOpenMemberChat() {
  const navigate = useNavigate();
  const selfId = useAuthStore((s) => s.user?._id);
  const { data } = useMyFriendsQuery({});

  const chatIdByUserId = useMemo(() => {
    const friends = (data as FriendsResponse | undefined)?.data ?? [];
    return new Map(
      friends
        .filter((f) => f.chatId)
        .map((f) => [String(f._id), String(f.chatId)]),
    );
  }, [data]);

  return useCallback(
    (memberId: string) => {
      if (!memberId || String(memberId) === String(selfId ?? '')) return;

      const chatId = chatIdByUserId.get(String(memberId));
      if (!chatId) {
        toast.error('No personal chat with this member');
        return;
      }

      navigate(`/chat/${chatId}`);
    },
    [chatIdByUserId, navigate, selfId],
  );
}
