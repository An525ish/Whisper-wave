type SkeletonBoxProps = {
  className?: string;
};

const SkeletonBox = ({ className }: SkeletonBoxProps) => {
  return (
    <div
      className={`h-20 px-4 py-2 bg-background-alt animate-pulse ${className}`}
    ></div>
  );
};

export default SkeletonBox;
