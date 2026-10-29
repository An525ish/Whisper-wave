import SlideOverPanel from '@/shared/components/ui/SlideOverPanel';
import type { AdminRoomRow, RoomEditForm as RoomEditValues } from '../../../types';
import VisibilityBadge from '../VisibilityBadge';
import RoomEditForm from './RoomEditForm';

type Props = {
  room: AdminRoomRow;
  saving: boolean;
  onSave: (values: RoomEditValues) => void;
  onClose: () => void;
};

/** Right-side drawer for editing one room template, same shell as the user and group panels. */
const RoomEditPanel = ({ room, saving, onSave, onClose }: Props) => {
  const formId = `room-edit-form-${room.slug}`;

  return (
    <SlideOverPanel onClose={onClose} labelledById="admin-room-edit-title" className="max-w-md">
      {(requestClose) => (
        <>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-6 pb-4 pt-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Edit room</p>
              <h2 id="admin-room-edit-title" className="mt-1 truncate font-semibold text-xl text-body">
                {room.title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <VisibilityBadge visibility={room.visibility} />
                <span className="truncate font-mono text-xs text-body-700">/{room.slug}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close panel"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-primary/30 text-body-300 transition hover:bg-primary/50 hover:text-body"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 py-5 scrollbar-hide">
            <RoomEditForm room={room} formId={formId} onSave={onSave} />
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border/40 bg-background/80 p-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-full px-4 py-2 text-sm text-body-300 hover:text-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              disabled={saving}
              className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save room'}
            </button>
          </div>
        </>
      )}
    </SlideOverPanel>
  );
};

export default RoomEditPanel;
