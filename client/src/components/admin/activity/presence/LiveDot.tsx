const LiveDot = ({ className = '' }: { className?: string }) => (
  <span className={`relative inline-flex h-2 w-2 ${className}`}>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-40" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
  </span>
);

export default LiveDot;
