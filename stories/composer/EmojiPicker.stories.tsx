import type { Meta } from 'storybook-react-rsbuild';
import type { StoryObj } from 'storybook-react-rsbuild';
type Story = StoryObj<any>;
import { EmojiPicker } from '@/components/composer/EmojiPicker';
import '@/styles/theme.css';

/**
 * EmojiPicker 组件 Story 文档
 *
 * 展示表情选择器的各种用法：
 * - 表情选择
 * - 常用表情
 * - 分类浏览
 */

const meta: Meta<typeof EmojiPicker> = {
  title: 'Composer/EmojiPicker',
  component: EmojiPicker,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex h-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: '是否打开',
    },
    emojis: {
      control: 'object',
      description: '自定义表情列表',
    },
    onEmojiSelect: {
      control: false,
      description: '表情选择回调函数',
    },
    onClose: {
      control: false,
      description: '关闭回调函数',
    },
  },
};

export default meta;

/**
 * 基础示例
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg relative">
      <EmojiPicker
        open
        onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
        onClose={() => console.log('Close')}
      />
    </div>
  );
};

/**
 * 自定义表情列表
 */
export const CustomEmojis = () => {
  const customEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣'];

  return (
    <div className="p-4 bg-muted rounded-lg relative">
      <EmojiPicker
        open
        emojis={customEmojis}
        onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
        onClose={() => console.log('Close')}
      />
    </div>
  );
};

/**
 * 在输入框附近使用
 */
export const InInputArea = () => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg relative">
      <input
        type="text"
        placeholder="输入消息..."
        className="px-3 py-2 text-sm border border-border rounded-md bg-card text-text"
      />
      <EmojiPicker
        open
        onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
        onClose={() => console.log('Close')}
      />
    </div>
  );
};
