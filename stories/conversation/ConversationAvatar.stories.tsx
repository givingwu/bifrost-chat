import type { Meta, StoryObj } from 'storybook-react-rsbuild';
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
};

export default meta;
type Story = StoryObj<typeof ConversationAvatar>;

export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar name="WhatsApp 用户" />
    </div>
  );
};

export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar name="短信用户" />
    </div>
  );
};

export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationAvatar name="邮件用户" />
    </div>
  );
};
