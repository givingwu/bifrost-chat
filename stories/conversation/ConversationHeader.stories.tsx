import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { SearchInput } from '@/components/SearchInput';
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
    extra: {
      control: false,
      description: '头部扩展内容',
    },
    search: {
      control: false,
      description: '搜索区域',
    },
    children: {
      control: false,
      description: '子组件',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationHeader>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationHeader
        title="会话"
        search={<SearchInput value="" onChange={() => undefined} />}
      />
    </div>
  );
};

export const WithExtra = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ConversationHeader
        title="会话"
        extra={
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs text-text"
          >
            账号管理
          </button>
        }
        search={<SearchInput value="" onChange={() => undefined} />}
      />
    </div>
  );
};
