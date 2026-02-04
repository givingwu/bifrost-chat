import type { Meta, StoryObj } from '@storybook/react';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import '@/styles/theme.css';

/**
 * ConversationPanel 组件 Story 文档
 */

const meta: Meta<typeof ConversationPanel> = {
  title: 'Conversation/ConversationPanel',
  component: ConversationPanel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConversationPanel>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationPanel />
    </div>
  );
};
