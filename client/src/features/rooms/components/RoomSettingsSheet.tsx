import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useDeleteRoomMutation, useRequestListingMutation, useUpdateRoomMutation } from '../hooks/useRoomMutations';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { editRoomFormSchema, editRoomRules, type EditRoomForm } from '../utils/roomValidators';
import RoomSheetHead from './RoomSheetHead';
import './rooms.css';

type Props = {
  slug: string;
  open: boolean;
  onClose: () => void;
};

type FormProps = {
  slug: string;
  initial: { title: string; description: string; rules: string[] };
  onClose: () => void;
};

/**
 * Host room settings: title, description, rules — plus delete. Slug, caps,
 * type and visibility never move here (visibility is the approval flow).
 */
const RoomSettingsSheet = ({ slug, open, onClose }: Props) => {
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite') ?? undefined;
  const { data: room } = useRoomInfo(slug, invite, open);

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="room-settings-title">
      {room ? (
        <SettingsForm
          slug={slug}
          initial={{ title: room.title, description: room.description, rules: room.rules }}
          onClose={onClose}
        />
      ) : (
        <div className="px-5 pb-6 pt-2" aria-label="Loading room settings">
          <div className="h-40 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none" />
        </div>
      )}
    </BottomSheet>
  );
};

const SettingsForm = ({ slug, initial, onClose }: FormProps) => {
  const update = useUpdateRoomMutation(slug);
  const remove = useDeleteRoomMutation();
  const request = useRequestListingMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requested, setRequested] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditRoomForm>({
    resolver: zodResolver(editRoomFormSchema),
    defaultValues: {
      title: initial.title,
      description: initial.description,
      rulesText: initial.rules.join('\n'),
    },
  });

  const submit = (values: EditRoomForm) => {
    update.mutate(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        rules: editRoomRules(values.rulesText),
      },
      { onSuccess: () => onClose() }
    );
  };

  const inputClass = 'rm-input';
  const errorClass = 'rm-error';

  return (
    <div className="rm-sheetbody">
      <RoomSheetHead
        titleId="room-settings-title"
        eyebrow="Host controls"
        title="Room settings"
        icon={
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        }
      />

      <form onSubmit={handleSubmit(submit)} className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="room-settings-title-input" className="text-sm font-medium text-body">Title</label>
          <input id="room-settings-title-input" {...register('title')} maxLength={60} className={inputClass} />
          {errors.title && <p role="alert" className={errorClass}>{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="room-settings-desc" className="text-sm font-medium text-body">About</label>
          <textarea id="room-settings-desc" {...register('description')} maxLength={280} rows={2} className={inputClass} />
          {errors.description && <p role="alert" className={errorClass}>{errors.description.message}</p>}
        </div>
        <div>
          <label htmlFor="room-settings-rules" className="text-sm font-medium text-body">
            House rules (one per line, up to ten)
          </label>
          <textarea id="room-settings-rules" {...register('rulesText')} rows={4} className={inputClass} />
          {errors.rulesText && <p role="alert" className={errorClass}>{errors.rulesText.message}</p>}
        </div>
        <button
          type="submit"
          disabled={update.isPending}
          className="rm-joinbtn"
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="rm-sect">
        <button
          type="button"
          onClick={() => request.mutate(slug, { onSuccess: () => setRequested(true) })}
          disabled={request.isPending || requested}
          className="rm-joinbtn"
        >
          {requested ? 'Listing requested ✓' : 'Request lobby listing'}
        </button>
        <p className="rm-sect__note">
          {requested
            ? 'The Wave team reviews new rooms.'
            : 'Unlisted rooms are invite-only. Approval puts this room in the public lobby.'}
        </p>
      </div>

      <div className="rm-sect">
        {!confirmDelete ? (
          <div className="rm-danger">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rm-danger__btn"
            >
              Delete this room…
            </button>
          </div>
        ) : (
          <div role="alertdialog" aria-label="Confirm room deletion" className="rm-danger">
            <p className="text-sm text-body">
              Delete this room for everyone? Live threads end, the template goes away. Reports and bans stay on record.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => remove.mutate(slug)}
                disabled={remove.isPending}
                className="rounded-full bg-red/20 px-4 py-1.5 text-sm font-medium text-red hover:bg-red/30 disabled:opacity-50"
              >
                {remove.isPending ? 'Deleting…' : 'Delete room'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-body-300"
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSettingsSheet;
