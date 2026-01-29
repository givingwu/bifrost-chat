import { Mail, MessageSquare, Smartphone } from 'lucide-react';
import { ChannelType } from '@/interfaces/channel.interface';

export const ChannelBadge = ({ type }: { type: ChannelType }) => {
  if (type === ChannelType.WhatsApp) {
    return (
      <span className="rounded-full bg-green-500 p-0.5">
        <MessageSquare className="h-3 w-3 text-white" />
      </span>
    );
  }

  if (type === ChannelType.SMS) {
    return (
      <span className="rounded-full bg-blue-500 p-0.5">
        <Smartphone className="h-3 w-3 text-white" />
      </span>
    );
  }

  if (type === ChannelType.Email) {
    return (
      <span className="rounded-full bg-blue-400 p-0.5">
        <Mail className="h-3 w-3 text-white" />
      </span>
    );
  }

  return null;
};
