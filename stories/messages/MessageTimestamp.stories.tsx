import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MessageTimestamp } from '@/components/messages/MessageTimestamp';

/**
 * MessageTimestamp 组件 Story 文档
 *
 * 展示消息时间戳的各种用法：
 * - 不同时间格式
 * - 相对时间
 */

const meta: Meta<typeof MessageTimestamp> = {
  title: 'Messages/MessageTimestamp',
  component: MessageTimestamp,
  tags: ['autodocs'],
  argTypes: {
    timestamp: {
      control: 'number',
      description: '时间戳（毫秒）',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageTimestamp>;

/**
 * 基础示例 - 当前时间
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageTimestamp timestamp={Date.now()} />
    </div>
  );
};

/**
 * 不同时间 - 展示各种时间格式
 */
export const DifferentTimes = () => {
  const now = Date.now();

  const times = [
    { label: '刚刚', timestamp: now - 1000 * 30 },
    { label: '1分钟前', timestamp: now - 1000 * 60 },
    { label: '5分钟前', timestamp: now - 1000 * 60 * 5 },
    { label: '30分钟前', timestamp: now - 1000 * 60 * 30 },
    { label: '1小时前', timestamp: now - 1000 * 60 * 60 },
    { label: '2小时前', timestamp: now - 1000 * 60 * 60 * 2 },
    { label: '今天 10:30', timestamp: now - 1000 * 60 * 60 * 4 },
    { label: '昨天 15:20', timestamp: now - 1000 * 60 * 60 * 24 },
    { label: '3天前', timestamp: now - 1000 * 60 * 60 * 24 * 3 },
    { label: '1周前', timestamp: now - 1000 * 60 * 60 * 24 * 7 },
    { label: '1个月前', timestamp: now - 1000 * 60 * 60 * 24 * 30 },
  ];

  return (
    <div className="space-y-2">
      {times.map((time) => (
        <div
          key={time.label}
          className="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <span className="text-sm text-text-muted">{time.label}</span>
          <MessageTimestamp timestamp={time.timestamp} />
        </div>
      ))}
    </div>
  );
};

/**
 * 在消息中使用 - 展示实际应用场景
 */
export const InMessage = () => {
  const now = Date.now();

  const messages = [
    { text: 'Hi there!', time: now - 1000 * 60 * 60 * 2 },
    { text: 'Hello! How are you?', time: now - 1000 * 60 * 55 },
    { text: 'I am doing well, thanks!', time: now - 1000 * 60 * 30 },
    { text: 'Great to hear!', time: now - 1000 * 60 * 5 },
  ];

  return (
    <div className="space-y-3">
      {messages.map((msg, index) => (
        <div
          key={`${msg.time}-${msg.text}`}
          className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
              index % 2 === 0
                ? 'bg-card text-text rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <MessageTimestamp timestamp={msg.time} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 时间序列 - 展示消息时间流
 */
export const TimeSequence = () => {
  const now = Date.now();
  const baseTime = now - 1000 * 60 * 60 * 24; // 24小时前

  const messages = [
    { text: '昨天开始对话', time: baseTime },
    { text: '今天早上继续', time: baseTime + 1000 * 60 * 60 * 16 },
    { text: '刚刚收到回复', time: now - 1000 * 60 * 5 },
  ];

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={`${msg.time}-${msg.text}`} className="flex justify-start">
          <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
            <p className="text-sm">{msg.text}</p>
            <MessageTimestamp timestamp={msg.time} />
          </div>
        </div>
      ))}
    </div>
  );
};
