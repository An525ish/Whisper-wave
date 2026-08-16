import { MESSAGES_EMPTY_IMAGE } from '@/constants/admin/messages';

type MessagesEmptyStateProps = {
  description: string;
};

const MessagesEmptyState = ({ description }: MessagesEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <img src={MESSAGES_EMPTY_IMAGE} alt="" className="h-24 w-24 opacity-40" aria-hidden />
    <div>
      <p className="text-sm font-medium text-body">No messages found</p>
      <p className="mt-1 text-xs text-body-300/60">{description}</p>
    </div>
  </div>
);

export default MessagesEmptyState;
