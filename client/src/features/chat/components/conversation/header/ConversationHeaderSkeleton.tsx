import {
  CONVERSATION_HEADER_INNER_CLASS,
  CONVERSATION_HEADER_SHELL_CLASS,
} from '../../../constants/chat';

const bone = 'animate-pulse bg-white/18';

const ConversationHeaderSkeleton = () => (
  <div className={CONVERSATION_HEADER_SHELL_CLASS}>
    <div className={CONVERSATION_HEADER_INNER_CLASS}>
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
          <div className="inline-flex h-11 w-8 shrink-0 md:hidden" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
            <div
              className={`mx-1 h-11 w-11 shrink-0 rounded-full border-2 border-white/10 ${bone} md:mx-2 md:h-12 md:w-12`}
            />
            <div className="min-w-0 pr-2">
              <div className={`h-4.75 w-28 rounded-md ${bone} md:h-5 md:w-36`} />
              <div className={`mt-1 h-3.5 w-16 rounded-md ${bone} md:h-4 md:w-24`} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className={`h-10 w-10 rounded-full border border-white/15 ${bone}`} />
        </div>
      </div>
    </div>
  </div>
);

export default ConversationHeaderSkeleton;
