import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import '@/styles/theme.css';

/**
 * InfiniteMessageList 组件 Story 文档
 *
 * 展示无限滚动消息列表的各种用法
 */

const meta: Meta<typeof InfiniteMessageList> = {
  title: 'Messages/InfiniteMessageList',
  component: InfiniteMessageList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '无限滚动消息列表组件，支持自动加载更多历史消息。当用户滚动到顶部时自动触发加载。',
      },
    },
  },
  argTypes: {
    conversationId: {
      control: 'text',
      description: '会话 ID',
    },
    className: {
      control: 'text',
      description: '自定义类名',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full h-[600px] bg-background rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InfiniteMessageList>;

/**
 * 默认状态的无限滚动消息列表
 */
export const Default: Story = {
  args: {
    conversationId: 'conv-123',
  },
  parameters: {
    docs: {
      description: {
        story: `
默认状态的无限滚动消息列表。

**特性：**
- 自动加载消息数据
- 滚动到顶部时自动加载更多历史消息
- 显示加载状态指示器
- 错误处理和重试机制
        `,
      },
    },
  },
};

/**
 * 空状态
 */
export const Empty: Story = {
  args: {
    conversationId: 'conv-empty',
  },
  parameters: {
    docs: {
      description: {
        story: '当没有消息时显示空状态。',
      },
    },
  },
};

/**
 * 加载状态
 */
export const Loading: Story = {
  args: {
    conversationId: 'conv-loading',
  },
  parameters: {
    docs: {
      description: {
        story: '显示初始加载状态。',
      },
    },
  },
};

/**
 * 自定义样式
 */
export const CustomStyling: Story = {
  args: {
    conversationId: 'conv-123',
    className: 'bg-muted',
  },
  parameters: {
    docs: {
      description: {
        story: '通过 className 自定义样式。',
      },
    },
  },
};
