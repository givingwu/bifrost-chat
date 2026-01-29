import { Mic, Send } from 'lucide-react';

export const ComposerActions = ({
  canSend,
  onSend,
}: {
  canSend: boolean;
  onSend?: () => void;
}) => {
  if (canSend) {
    return (
      <button
        type="button"
        onClick={onSend}
        className="rounded-full bg-primary p-3 text-primary-foreground shadow-soft transition hover:opacity-90"
      >
        <Send className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="rounded-full bg-muted p-3 text-text-muted transition hover:text-text"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
};
