import type { Conversation } from '@/interfaces/conversation.interface';
import { ChannelBadge } from '../toolbar/ChannelBadge';

export const ConversationAvatar = ({
  url,
  name,
  channel,
}: {
  url: string;
  name: string;
  channel: Conversation['channel'];
}) => {
  return (
    <div className="relative">
      <img
        src={url}
        alt={name}
        className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-200"
      />
      <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white dark:border-gray-900">
        <ChannelBadge type={channel} />
      </div>
    </div>
  );
};
