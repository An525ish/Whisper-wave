import {
  attachmentEmptyStateImage,
  attachmentEmptyStateSubtitle,
  attachmentEmptyStateTitle,
} from '@/utils/admin/attachments';
import type { AttachmentKindFilter } from '@/types/admin';

type AttachmentsEmptyStateProps = {
  kindFilter: AttachmentKindFilter;
  senderName?: string;
  hasSearch: boolean;
};

const AttachmentsEmptyState = ({
  kindFilter,
  senderName,
  hasSearch,
}: AttachmentsEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <img
      src={attachmentEmptyStateImage(kindFilter)}
      alt=""
      className="h-24 w-24 opacity-60"
      aria-hidden
    />
    <div>
      <p className="text-sm font-medium text-body">
        {attachmentEmptyStateTitle(kindFilter, senderName)}
      </p>
      <p className="mt-1 text-xs text-body-300/60">
        {attachmentEmptyStateSubtitle(kindFilter, hasSearch)}
      </p>
    </div>
  </div>
);

export default AttachmentsEmptyState;
