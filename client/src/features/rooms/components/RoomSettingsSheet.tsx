import { useRef, useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import { useDeleteRoomMutation } from '../hooks/useRoomMutations';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { useRoomStore } from '../stores/roomStore';
import RoomSettingsForm from './RoomSettingsForm';
import './roomSheets.css';

type Props = {
  slug: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Host room settings: title, description, rules — plus delete. Slug, caps,
 * type and visibility never move here (visibility is the approval flow).
 * Every branch (loading, failed, ready) names the dialog by the same title id.
 */
const RoomSettingsSheet = ({ slug, open, onClose }: Props) => {
  const invite = useRoomStore((s) => s.joinParams?.invite);
  const { data: room, isError } = useRoomInfo(slug, invite, open);
  const remove = useDeleteRoomMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const closeConfirm = () => {
    setConfirmDelete(false);
    requestAnimationFrame(() => deleteButtonRef.current?.focus());
  };

  return (
    <>
      {/* While the confirm dialog is up, Escape belongs to it — not to the sheet underneath. */}
      <BottomSheet open={open} onClose={confirmDelete ? closeConfirm : onClose} labelledBy="room-settings-title">
        {room ? (
          <RoomSettingsForm
            slug={slug}
            initial={{ title: room.title, description: room.description, rules: room.rules }}
            onAskDelete={() => setConfirmDelete(true)}
            deleteButtonRef={deleteButtonRef}
            onClose={onClose}
          />
        ) : (
          <div className="px-5 pb-6 pt-2">
            <h2 id="room-settings-title" className="sr-only">Room settings</h2>
            {isError ? (
              <p role="alert" className="rm-emptyline">Couldn’t load the room settings — close this and try again.</p>
            ) : (
              <div role="status" aria-label="Loading room settings" className="rm-settingsskel" />
            )}
          </div>
        )}
      </BottomSheet>
      {confirmDelete && (
        <ConfirmationModal
          onClose={closeConfirm}
          handleConfirmationModal={({ accept }) => {
            if (accept) remove.mutate(slug);
            else closeConfirm();
          }}
          variant="danger"
          title="Delete this room?"
          description="Live threads end for everyone and the template goes away. Reports and bans stay on record."
          confirmLabel={remove.isPending ? 'Deleting…' : 'Delete room'}
          cancelLabel="Keep it"
        />
      )}
    </>
  );
};

export default RoomSettingsSheet;
