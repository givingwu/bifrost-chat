import type { Meta, StoryObj } from '@storybook/react';
import { ChatContainer } from '@/components/layout/ChatContainer';
import '@/styles/theme.css';

/**
 * ChatContainer 组件 Story 文档
 */

const meta: Meta<typeof ChatContainer> = {
  title: 'Layout/ChatContainer',
  component: ChatContainer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChatContainer>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChatContainer>
        <div className="p-4 text-text">聊天内容</div>
      </ChatContainer>
    </div>
  );
};
