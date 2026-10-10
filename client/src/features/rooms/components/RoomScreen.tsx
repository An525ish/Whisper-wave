import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useRoomStore } from '../stores/roomStore';
import { saveRoomsPersona } from '../utils/persona';
import { useRoomsSocket } from '../hooks/useRoomsSocket';
import RoomRulesSheet from './RoomRulesSheet';
import RoomView from './RoomView';

type Props = {
  slug: string;
};

/**
 * One room route: the rules sheet until joined, the live thread after.
 * Owns the single `/rooms` socket — children receive emitters as props, so
 * the connection is never doubled. Join state lives in the room store (set
 * by the socket's ROOM_STATE), so a refresh replays the sheet, never a stale
 * thread.
 */
const RoomScreen = ({ slug }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Invite links carry `?invite=` — the only way into unlisted rooms.
  const invite = searchParams.get('invite') ?? undefined;
  const joinedSlug = useRoomStore((s) => s.slug);
  const instanceId = useRoomStore((s) => s.instanceId);
  const { join, leave, sendMessage, sendReaction, sendMod } = useRoomsSocket(slug);

  const handleJoin = useCallback(
    (params: { alias: string; color: string }) => {
      saveRoomsPersona(params);
      join({ ...params, ...(invite ? { invite } : {}) });
    },
    [join, invite]
  );

  const handleLeave = useCallback(() => {
    leave();
    navigate(ROUTES.rooms);
  }, [leave, navigate]);

  if (joinedSlug === slug && instanceId) {
    return (
      <RoomView
        slug={slug}
        onLeave={handleLeave}
        onSend={sendMessage}
        onReact={sendReaction}
        onMod={sendMod}
      />
    );
  }
  return <RoomRulesSheet slug={slug} invite={invite} onJoin={handleJoin} />;
};

export default RoomScreen;
