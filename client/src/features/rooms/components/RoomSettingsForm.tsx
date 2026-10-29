import { useState, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROOM_LIMITS } from '../constants';
import { useRequestListingMutation, useUpdateRoomMutation } from '../hooks/useRoomMutations';
import { editRoomFormSchema, editRoomRules } from '../utils/roomValidators';
import type { EditRoomForm } from '../types';
import RoomSheetHead from './RoomSheetHead';
import './roomSheets.css';

type Props = {
  slug: string;
  initial: { title: string; description: string; rules: string[] };
  /** Ask the sheet to confirm a deletion (it owns the confirm dialog). */
  onAskDelete: () => void;
  /** Where focus returns when the confirm dialog closes. */
  deleteButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

/** Host edit form: title, description, rules, listing request, and the delete entry point. */
const RoomSettingsForm = ({ slug, initial, onAskDelete, deleteButtonRef, onClose }: Props) => {
  const update = useUpdateRoomMutation(slug);
  const request = useRequestListingMutation();
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
          <input id="room-settings-title-input" {...register('title')} maxLength={ROOM_LIMITS.TITLE_MAX} className="rm-input" />
          {errors.title && <p role="alert" className="rm-error">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="room-settings-desc" className="text-sm font-medium text-body">About</label>
          <textarea id="room-settings-desc" {...register('description')} maxLength={ROOM_LIMITS.DESCRIPTION_MAX} rows={2} className="rm-input" />
          {errors.description && <p role="alert" className="rm-error">{errors.description.message}</p>}
        </div>
        <div>
          <label htmlFor="room-settings-rules" className="text-sm font-medium text-body">
            House rules (one per line, up to {ROOM_LIMITS.EDIT_RULES_MAX})
          </label>
          <textarea id="room-settings-rules" {...register('rulesText')} rows={4} className="rm-input" />
          {errors.rulesText && <p role="alert" className="rm-error">{errors.rulesText.message}</p>}
        </div>
        <button type="submit" disabled={update.isPending} className="rm-joinbtn">
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
        <div className="rm-danger">
          <button ref={deleteButtonRef} type="button" onClick={onAskDelete} className="rm-danger__btn">
            Delete this room…
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsForm;
