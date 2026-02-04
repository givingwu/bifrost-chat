import type { Meta, StoryObj } from '@storybook/react';
import { UnsupportedMessage } from '@/components/messages/UnsupportedMessage';
import '@/styles/theme.css';

/**
 * UnsupportedMessage 组件 Story 文档
 *
 * 展示不支持的消息类型的占位组件：
 * - 当消息类型无法识别时显示
 * - 简洁的提示信息
 */

const meta: Meta<typeof UnsupportedMessage> = {
  title: 'Messages/UnsupportedMessage',
  component: UnsupportedMessage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UnsupportedMessage>;

/**
 * 基础示例
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <UnsupportedMessage />
    </div>
  );
};

/**
 * 在消息气泡中使用
 */
export const InMessageBubble = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
        <UnsupportedMessage />
      </div>
    </div>
  );
};

/**
 * 在消息列表中使用
 */
export const InMessageList = () => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-sm">你好，请问有什么可以帮您的？</p>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <UnsupportedMessage />
        </div>
      </div>
    </div>
  );
};
