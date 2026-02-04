import type { Meta, StoryObj } from '@storybook/react';
import { ChatLayout } from '@/components/layout/ChatLayout';
import '@/styles/theme.css';

/**
 * ChatLayout 组件 Story 文档
 */

const meta: Meta<typeof ChatLayout> = {
  title: 'Layout/ChatLayout',
  component: ChatLayout,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChatLayout>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChatLayout>
        <div className="p-4 text-text">聊天布局内容</div>
      </ChatLayout>
    </div>
  );
};
