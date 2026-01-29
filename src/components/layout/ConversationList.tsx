import { Mail, MessageSquare, Smartphone } from 'lucide-react';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { cn } from '@/utils/class.util';

export interface ConversationListProps {
  conversations: Conversation[];
  onSelect?: (conversationId: string) => void;
}

const ChannelBadge = ({ type }: { type: ChannelType }) => {
  if (type === 'whatsapp') {
    return (
      <span className="rounded-full bg-green-500 p-0.5">
        <MessageSquare className="h-3 w-3 text-white" />
      </span>
    );
  }
  if (type === 'sms') {
    return (
      <span className="rounded-full bg-blue-500 p-0.5">
        <Smartphone className="h-3 w-3 text-white" />
      </span>
    );
  }
  if (type === 'email') {
    return (
      <span className="rounded-full bg-blue-400 p-0.5">
        <Mail className="h-3 w-3 text-white" />
      </span>
    );
  }
  return null;
};

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
          {conversations.map((convo) => (
            <button
              key={convo.id}
              type="button"
              onClick={() => onSelect?.(convo.id)}
              className={cn(
                'relative w-full rounded-xl p-3 text-left transition',
                convo.isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'hover:bg-muted/60',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={convo.user.avatarUrl}
                    alt={convo.user.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-card">
                    <ChannelBadge type={convo.channel} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className={cn(
                        'truncate text-sm font-semibold',
                        convo.isActive
                          ? 'text-primary-foreground'
                          : 'text-text',
                      )}
                    >
                      {convo.user.name}
                    </h4>
                    <span
                      className={cn(
                        'text-xs',
                        convo.isActive
                          ? 'text-primary-foreground/70'
                          : 'text-text-muted',
                      )}
                    >
                      {convo.lastMessageTime}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'line-clamp-2 text-sm',
                      convo.isActive
                        ? 'text-primary-foreground/80'
                        : 'text-text-muted',
                    )}
                  >
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
              {convo.unreadCount > 0 && !convo.isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                  {convo.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
