import { Mail, MessageSquare, Phone, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

const channelComponents: Record<ChannelTypeEnum, () => ReactNode> = {
  [ChannelTypeEnum.WhatsApp]: () => (
    <div className="rounded-full bg-success p-0.5">
      <MessageSquare className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelTypeEnum.SMS]: () => (
    <div className="rounded-full bg-primary p-0.5">
      <Smartphone className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelTypeEnum.Email]: () => (
    <div className="rounded-full bg-primary/70 p-0.5">
      <Mail className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelTypeEnum.Viber]: () => (
    <div className="rounded-full bg-purple-500 p-0.5">
      <MessageSquare className="h-3 w-3 text-white" />
    </div>
  ),
  [ChannelTypeEnum.IVR]: () => (
    <div className="rounded-full bg-orange-500 p-0.5">
      <Phone className="h-3 w-3 text-white" />
    </div>
  ),
};

export const ChannelBadge = ({ type }: { type: ChannelTypeEnum }) => {
  const ChannelComponent = channelComponents[type];
  return ChannelComponent ? <ChannelComponent /> : null;
};
