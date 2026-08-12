type ChatMessageSkeletonProps = {
  variant: 'in' | 'out';
  width: string;
  minHeight?: string;
};

const bubbleShell = (isOut: boolean, minHeight: string) =>
  `animate-pulse pt-2 pb-2.5 pl-3.5 pr-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.28)] ${minHeight} ${
    isOut
      ? 'bubble-out border border-green/35 bg-green-dark/55'
      : 'bubble-in border border-border bg-primary/90'
  }`;

const ChatMessageSkeleton = ({
  variant,
  width,
  minHeight = 'min-h-[2.375rem]',
}: ChatMessageSkeletonProps) => {
  const isOut = variant === 'out';

  return (
    <div
      className={`flex w-full pb-4 ${isOut ? 'justify-end' : 'justify-start'}`}
    >
      <div className="w-fit max-w-[min(88%,20rem)] md:max-w-[70%]">
        <div
          className={bubbleShell(isOut, minHeight)}
          style={{ width }}
          aria-hidden
        />
      </div>
    </div>
  );
};

const SKELETON_THREAD: Array<{
  variant: 'in' | 'out';
  width: string;
  minHeight?: string;
}> = [
  { variant: 'in', width: '4.5rem' },
  { variant: 'out', width: '3rem' },
  { variant: 'in', width: '9.25rem' },
  { variant: 'out', width: '5.5rem' },
  { variant: 'in', width: '12rem' },
  { variant: 'out', width: '7.25rem' },
  { variant: 'in', width: '6rem' },
  { variant: 'out', width: '4.25rem' },
  { variant: 'in', width: '14.5rem', minHeight: 'min-h-[3.5rem]' },
  { variant: 'out', width: '10rem' },
  { variant: 'in', width: '5.75rem' },
  { variant: 'out', width: '8.5rem' },
  { variant: 'in', width: '11.25rem' },
  { variant: 'out', width: '3.75rem' },
  { variant: 'in', width: '7.5rem' },
  { variant: 'out', width: '6.25rem' },
];

export const ChatMessagesSkeleton = () => (
  <div className="flex min-h-full flex-col justify-end">
    {SKELETON_THREAD.map((item, index) => (
      <ChatMessageSkeleton key={index} {...item} />
    ))}
  </div>
);

export default ChatMessageSkeleton;
