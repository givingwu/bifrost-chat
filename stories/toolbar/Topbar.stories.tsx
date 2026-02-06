import type { Meta, StoryObj } from '@storybook/react';
import { Topbar } from '@/components/toolbar/Topbar';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
import '@/styles/theme.css';

/**
 * Topbar 组件 Story 文档
 */

const meta: Meta<typeof Topbar> = {
  title: 'Toolbar/Topbar',
  component: Topbar,
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
type Story = StoryObj<typeof Topbar>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <Topbar extra={<div>Extra content</div>} />
    </div>
  );
};

export const WithExtra = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <Topbar
        avatarUrl="/logo.jpeg"
        title="Conversation"
        subtitle="Hello World!"
        extra={<TopbarTools />}
      />
    </div>
  );
};
