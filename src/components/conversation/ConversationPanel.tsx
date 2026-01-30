import type { ReactNode } from 'react';

export interface ConversationPanelProps {
  header?: ReactNode;
  children: ReactNode;
}

export const ConversationPanel = ({
  header,
  children,
}: ConversationPanelProps) => {
  return (
    <aside className="w-[320px] shrink-0 border-r border-gray-200/50 dark:border-white/10 flex flex-col bg-gray-50/50 dark:bg-black/20">
      {header}
      {children}
    </aside>
  );
};
