import type { Meta, StoryObj } from '@storybook/react';
import { ChatTopbar } from '@/components/layout/ChatTopbar';
import '@/styles/theme.css';
import { DefaultTools } from '@/components/layout/DefaultChatLayout';

/**
 * ChatTopbar 组件 Story 文档
 */

const meta: Meta<typeof ChatTopbar> = {
  title: 'Layout/ChatTopbar',
  component: ChatTopbar,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '当前会话标题',
    },
    subtitle: {
      control: 'text',
      description: '当前会话副标题',
    },
    avatarUrl: {
      control: 'text',
      description: '会话头像',
    },
    extra: {
      control: false,
      description: '附加内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatTopbar>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChatTopbar extra={<div>Extra content</div>} />
    </div>
  );
};

export const WithExtra = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChatTopbar
        avatarUrl="/logo.jpeg"
        title="Conversation"
        subtitle="Hello World!"
        extra={<DefaultTools />}
      />
    </div>
  );
};
