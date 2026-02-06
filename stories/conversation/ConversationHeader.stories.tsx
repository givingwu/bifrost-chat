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
  argTypes: {
    className: {
      control: 'text',
      description: '自定义类名',
    },
    title: {
      control: 'text',
      description: '标题',
    },
    children: {
      control: false,
      description: '子组件',
    },
    showSearch: {
      control: 'boolean',
      description: '是否显示搜索框',
    },
    searchPlaceholder: {
      control: 'text',
      description: '搜索框占位符',
    },
    searchValue: {
      control: 'text',
      description: '搜索框值',
    },
    onSearchChange: {
      control: false,
      description: '搜索回调',
    },
    onSearchSubmit: {
      control: false,
      description: '搜索提交回调',
    },
  },
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
