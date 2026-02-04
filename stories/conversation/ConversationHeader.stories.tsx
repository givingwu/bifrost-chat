import type { Meta, StoryObj } from '@storybook/react';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import '@/styles/theme.css';

/**
 * ConversationHeader 组件 Story 文档
 */

const meta: Meta<typeof ConversationHeader> = {
  title: 'Conversation/ConversationHeader',
  component: ConversationHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConversationHeader>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationHeader />
    </div>
  );
};
