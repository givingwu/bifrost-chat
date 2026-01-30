import { Mail, MessageSquare, Smartphone } from 'lucide-react';
import { ChannelType } from '@/interfaces/channel.interface';

const channelComponents = {
  [ChannelType.WhatsApp]: () => (
    <div className="rounded-full bg-success p-0.5">
      <MessageSquare className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelType.SMS]: () => (
    <div className="rounded-full bg-primary p-0.5">
      <Smartphone className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelType.Email]: () => (
    <div className="rounded-full bg-primary/70 p-0.5">
      <Mail className="h-3 w-3 text-white" />
    </div>
  ),
};

export const ChannelBadge = ({ type }: { type: ChannelType }) => {
  const ChannelComponent = channelComponents[type];
  return ChannelComponent ? <ChannelComponent /> : null;
};
