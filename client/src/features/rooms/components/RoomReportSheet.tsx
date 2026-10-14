import BottomSheet from '@/shared/components/ui/BottomSheet';
import RoomReportForm from './RoomReportForm';

type Props = {
  slug: string;
  messageId: string | null;
  onClose: () => void;
};

/**
 * Report one room message. Names the message, never the person — the sheet
 * says so. At three distinct reporters the message hides pending review.
 * The form is keyed by message, so every report starts fresh.
 */
const RoomReportSheet = ({ slug, messageId, onClose }: Props) => (
  <BottomSheet open={messageId !== null} onClose={onClose} labelledBy="room-report-title">
    {messageId !== null && <RoomReportForm key={messageId} slug={slug} messageId={messageId} onClose={onClose} />}
  </BottomSheet>
);

export default RoomReportSheet;
