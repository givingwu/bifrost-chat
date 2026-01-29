import type { Conversation } from '@/interfaces/conversation.interface';
import { cn } from '@/utils/class.util';
import { ConversationItem } from './ConversationItem';

export interface ConversationListProps {
  conversations: Conversation[];
  onSelect?: (conversationId: string) => void;
}

export const ConversationList = ({
  conversations,
  onSelect,
}: ConversationListProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text">
          Messages
        </h2>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search"
            className={cn(
              'w-full rounded-xl border border-transparent bg-muted px-4 py-2',
              'text-sm text-text outline-none focus:ring-2 focus:ring-primary/30',
            )}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
