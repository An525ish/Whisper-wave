import type { RoomReminderControl } from '../types';

type Props = {
  title: string;
  control: RoomReminderControl;
};

const LABEL: Record<RoomReminderControl['kind'], string> = {
  remind: 'Remind me',
  on: 'Reminder on',
  enable: 'Turn on push to get reminders',
};

/** Sits beside (never inside) the card link — a button in an anchor is invalid. */
const RoomReminderButton = ({ title, control }: Props) => (
  <button
    type="button"
    className="rm-remind"
    aria-pressed={control.kind === 'enable' ? undefined : control.kind === 'on'}
    aria-label={`${LABEL[control.kind]} — ${title}`}
    disabled={control.pending}
    onClick={control.onClick}
  >
    {LABEL[control.kind]}
  </button>
);

export default RoomReminderButton;
