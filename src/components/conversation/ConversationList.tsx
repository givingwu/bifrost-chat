import type { Conversation } from '@/interfaces/conversation.interface';
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
    <div className="px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
