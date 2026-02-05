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
  argTypes: {
    header: {
      control: false,
      description: '头部内容',
    },
    children: {
      control: false,
      description: '主体内容',
    },
    className: {
      control: 'text',
      description: '自定义类名',
    },
    width: {
      control: 'text',
      description: '自定义宽度',
    },
    showBorder: {
      control: 'boolean',
      description: '是否显示边框',
    },
  },
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
