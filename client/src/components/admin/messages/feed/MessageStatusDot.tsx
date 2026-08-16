type MessageStatusDotProps = {
  status?: string;
};

const MessageStatusDot = ({ status }: MessageStatusDotProps) => {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        Sent
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red">
        <span className="h-1.5 w-1.5 rounded-full bg-red" />
        Failed
      </span>
    );
  }
  return <span className="text-[11px] text-body-300/50">{status ?? 'Unknown'}</span>;
};

export default MessageStatusDot;
