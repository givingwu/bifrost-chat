import { Paperclip } from 'lucide-react';

export const ComposerAttachments = ({ disabled }: { disabled?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        className="rounded-full p-2 text-text-muted transition hover:text-text"
      >
        <Paperclip className="h-5 w-5" />
      </button>
    </div>
  );
};
