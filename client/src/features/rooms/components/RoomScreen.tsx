import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useRoomStore } from '../stores/roomStore';
import { useRoomsPersona } from '../hooks/useRoomsPersona';
import { useRoomsSocket } from '../hooks/useRoomsSocket';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import type { RoomJoinParams, RoomsPersona } from '../types';
import RoomRulesSheet from './RoomRulesSheet';
import RoomStateCard from './RoomStateCard';
import RoomView from './RoomView';
import './roomsFocus.css';

type Props = {
  slug: string;
};

/**
 * One room route: an ending card if the visit ended, the live thread while
 * seated (or reseating after a drop), the rules sheet otherwise. Owns the single
 * `/rooms` socket — children receive emitters as props, so the connection is
 * never doubled. Join state lives in the room store (ROOM_STATE seats it), so a
 * refresh replays the sheet, never a stale thread.
 */
const RoomScreen = ({ slug }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Invite links carry `?invite=` — the only way into unlisted rooms. It leaves
  // the address bar after a join, so the store's copy keeps room info readable.
  const storedInvite = useRoomStore((s) => s.joinParams?.invite);
  const urlInvite = searchParams.get('invite') ?? undefined;
  const invite = urlInvite ?? storedInvite;
  const joinStatus = useRoomStore((s) => s.joinStatus);
  const joinedSlug = useRoomStore((s) => s.slug);
  const endState = useRoomStore((s) => s.endState);
  const { data: room } = useRoomInfo(slug, invite);
  const { savePersona } = useRoomsPersona();
  const { join, rejoin, leave, sendMessage, uploadImage, sendReaction, sendMod } = useRoomsSocket(slug);
  const official = room?.official ?? false;

  const handleJoin = useCallback(
    ({ useAvatar, ...persona }: RoomsPersona & { useAvatar?: boolean }) => {
      savePersona(persona);
      const joinParams: RoomJoinParams = {
        ...persona,
        ...(useAvatar ? { useAvatar } : {}),
        ...(invite ? { invite } : {}),
      };
      void join(joinParams, official).then(() => {
        // The token did its job once seated; don't leave a live invite in the address bar or history.
        if (urlInvite && useRoomStore.getState().joinStatus === 'joined') {
          navigate(ROUTES.room(slug), { replace: true });
        }
      });
    },
    [invite, join, navigate, official, savePersona, slug, urlInvite]
  );

  const handleLeave = useCallback(() => {
    leave();
    navigate(ROUTES.rooms);
  }, [leave, navigate]);

  if (endState) {
    return <RoomStateCard state={endState} onRejoin={() => rejoin(official)} />;
  }

  const seated = joinStatus === 'joined' || joinStatus === 'rejoining';
  if (seated && joinedSlug === slug) {
    return (
      <RoomView slug={slug} onLeave={handleLeave} onSend={sendMessage} onUploadImage={uploadImage} onReact={sendReaction} onMod={sendMod} />
    );
  }
  return <RoomRulesSheet slug={slug} invite={invite} onJoin={handleJoin} />;
};

export default RoomScreen;
