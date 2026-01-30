import type { Conversation } from '@/interfaces/conversation.interface';
import { cn } from '@/utils/class.util';
import { ChannelBadge } from '../toolbar/ChannelBadge';

export const ConversationItem = ({
  conversation,
  onSelect,
}: {
  conversation: Conversation;
  onSelect?: (conversationId: string) => void;
}) => {
  return (
    <button
      key={conversation.id}
      type="button"
      onClick={() => onSelect?.(conversation.id)}
      className={cn(
        'w-full flex items-start p-3 rounded-xl transition-all duration-200 text-left group relative',
        conversation.isActive
          ? 'bg-primary shadow-md shadow-primary/20'
          : 'hover:bg-gray-200/50 dark:hover:bg-white/5 bg-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <img
            src={conversation.user.avatarUrl}
            alt={conversation.user.name}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-card">
            <ChannelBadge type={conversation.channel} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4
              className={cn(
                'truncate text-sm font-semibold',
                conversation.isActive ? 'text-primary-foreground' : 'text-text',
              )}
            >
              {conversation.user.name}
            </h4>
            <span
              className={cn(
                'text-xs',
                conversation.isActive
                  ? 'text-primary-foreground/70'
                  : 'text-text-muted',
              )}
            >
              {conversation.lastMessageTime}
            </span>
          </div>
          <p
            className={cn(
              'line-clamp-2 text-sm',
              conversation.isActive
                ? 'text-primary-foreground/80'
                : 'text-text-muted',
            )}
          >
            {conversation.lastMessage}
          </p>
        </div>
      </div>
      {conversation.unreadCount > 0 && !conversation.isActive && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
};
