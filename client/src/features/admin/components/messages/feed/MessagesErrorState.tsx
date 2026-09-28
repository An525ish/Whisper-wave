type MessagesErrorStateProps = {
  onRetry: () => void;
};

const MessagesErrorState = ({ onRetry }: MessagesErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <p className="text-sm font-medium text-body">Couldn&apos;t load messages</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
    >
      Try again
    </button>
  </div>
);

export default MessagesErrorState;
