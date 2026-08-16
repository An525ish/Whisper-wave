import ChatIcon from '@/components/ui/icons/Chat';
import MembersIcon from '@/components/ui/icons/Members';
import MessageEvent from './MessageEvent';
import SignupEvent from './SignupEvent';
import type { AdminActivityEvent } from '@/types/admin';

type TimelineRowProps = {
  event: AdminActivityEvent;
  isLast: boolean;
};

const TimelineRow = ({ event, isLast }: TimelineRowProps) => (
  <div className="relative flex gap-3 sm:gap-4">
    <div className="relative flex w-7 shrink-0 flex-col items-center pt-3">
      {!isLast && (
        <div
          className="absolute top-9 bottom-0 w-px bg-linear-to-b from-border/70 to-transparent"
          aria-hidden
        />
      )}
      <div
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${
          event.kind === 'message' ? 'bg-blue/12 text-blue' : 'bg-green/12 text-green'
        }`}
      >
        {event.kind === 'message' ? (
          <ChatIcon className="h-3.5 w-3.5" />
        ) : (
          <MembersIcon className="h-3.5 w-3.5" />
        )}
      </div>
    </div>
    <div className="min-w-0 flex-1 pb-1">
      {event.kind === 'message' ? (
        <MessageEvent msg={event.data} />
      ) : (
        <SignupEvent user={event.data} />
      )}
    </div>
  </div>
);

export default TimelineRow;
