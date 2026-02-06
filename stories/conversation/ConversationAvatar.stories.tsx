import type { Meta, StoryObj } from '@storybook/react';
import { ConversationAvatar } from '@/components/conversation/ConversationAvatar';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ConversationAvatar 组件 Story 文档
 */

const meta: Meta<typeof ConversationAvatar> = {
  title: 'Conversation/ConversationAvatar',
  component: ConversationAvatar,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      control: 'select',
      options: ['whatsapp', 'sms', 'email', 'im', 'voip'],
      description: '渠道类型',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationAvatar>;

export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar channel={ChannelTypeEnum.WhatsApp} />
    </div>
  );
};

export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar channel={ChannelTypeEnum.SMS} />
    </div>
  );
};

export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar channel={ChannelTypeEnum.Email} />
    </div>
  );
};
