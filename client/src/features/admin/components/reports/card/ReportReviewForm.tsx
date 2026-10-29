import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REPORT_NOTE_MAX, reportReviewSchema } from '../../../utils/reportForm';
import type { ReportReviewForm } from '../../../types';

type Props = {
  reportId: string;
  busy: boolean;
  onSubmit: (actionNote: string) => Promise<boolean>;
  onCancel: () => void;
};

/** Resolving a report needs a note: what was done (RUNBOOK). */
const ReportReviewFormView = ({ reportId, busy, onSubmit, onCancel }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportReviewForm>({
    resolver: zodResolver(reportReviewSchema),
    defaultValues: { actionNote: '' },
  });
  const inputId = `report-note-${reportId}`;

  return (
    <form
      onSubmit={handleSubmit(async ({ actionNote }) => {
        if (await onSubmit(actionNote)) onCancel();
      })}
      className="mt-3 flex flex-col gap-2"
    >
      <label htmlFor={inputId} className="text-xs font-medium text-body-300">
        What was done? (required)
      </label>
      <textarea
        id={inputId}
        {...register('actionNote')}
        rows={2}
        maxLength={REPORT_NOTE_MAX}
        aria-invalid={Boolean(errors.actionNote)}
        className="rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        placeholder="e.g. Hid the message, banned the guest for 24h"
      />
      {errors.actionNote && (
        <p role="alert" className="text-xs text-red">
          {errors.actionNote.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-xs text-body-300 hover:text-body">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
        >
          Confirm reviewed
        </button>
      </div>
    </form>
  );
};

export default ReportReviewFormView;
