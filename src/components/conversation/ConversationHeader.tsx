import type { ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export const ConversationHeader = ({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) => {
  return (
    <div className="p-4 pt-6 pb-2 space-y-4">
      {(typeof title === 'string' && (
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
      )) ||
        title}

      <div className="relative" data-component="conversation-list-search">
        <input
          type="text"
          placeholder="Search"
          className={cn(
            'w-full bg-gray-200/50 dark:bg-white/10 border-none rounded-xl px-4 py-2 text-sm  focus:bg-white dark:focus:bg-black/40',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-900 dark:text-white placeholder-gray-500',
          )}
        />
      </div>

      {children}
    </div>
  );
};
