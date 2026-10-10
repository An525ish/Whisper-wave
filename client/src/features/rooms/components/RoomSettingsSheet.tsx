import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useDeleteRoomMutation, useRequestListingMutation, useUpdateRoomMutation } from '../hooks/useRoomMutations';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { editRoomFormSchema, editRoomRules, type EditRoomForm } from '../utils/roomValidators';

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

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border/60 bg-white/[0.03] px-4 py-2.5 text-body outline-none placeholder:text-body-700 focus:border-green/50';
  const errorClass = 'mt-1 text-xs text-red';

  return (
    <div className="px-5 pb-6 pt-2">
      <h2 id="room-settings-title" className="text-lg font-semibold text-white">
        Room settings
      </h2>

      <form onSubmit={handleSubmit(submit)} className="mt-3 flex flex-col gap-3">
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
          className="rounded-3xl bg-gradient-action-button-green px-5 py-2.5 text-sm font-medium text-body transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-5 border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={() => request.mutate(slug, { onSuccess: () => setRequested(true) })}
          disabled={request.isPending || requested}
          className="w-full rounded-3xl border border-green/40 px-5 py-2.5 text-sm font-medium text-green transition hover:bg-green/10 disabled:opacity-50"
        >
          {requested ? 'Listing requested ✓ — the Wave team reviews new rooms' : 'Request lobby listing'}
        </button>
        <p className="mt-2 text-xs text-body-700">
          Unlisted rooms are invite-only. Approval puts this room in the public lobby.
        </p>
      </div>

      <div className="mt-4 border-t border-border/50 pt-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm font-medium text-red hover:underline"
          >
            Delete this room…
          </button>
        ) : (
          <div role="alertdialog" aria-label="Confirm room deletion">
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
