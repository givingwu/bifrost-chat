import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { LocationMessage } from '@/components/messages/LocationMessage';
import '@/styles/theme.css';

/**
 * LocationMessage 组件 Story 文档
 *
 * 展示位置消息的各种用法：
 * - 不同位置信息
 * - 不同地图样式
 */

const meta: Meta<typeof LocationMessage> = {
  title: 'Messages/LocationMessage',
  component: LocationMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: false,
      description: '位置消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocationMessage>;

/**
 * 基础示例 - 默认位置消息
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <LocationMessage
        content={{
          text: JSON.stringify({
            latitude: 37.7749,
            longitude: -122.4194,
            address: 'San Francisco, CA',
          }),
        }}
      />
    </div>
  );
};

/**
 * 带名称的位置消息
 */
export const WithName = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <LocationMessage
        content={{
          text: JSON.stringify({
            latitude: 37.7749,
            longitude: -122.4194,
            name: '金门大桥',
            address: 'San Francisco, CA 94129, United States',
          }),
        }}
      />
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
        <LocationMessage
          content={{
            text: JSON.stringify({
              latitude: 37.7749,
              longitude: -122.4194,
              name: '金门大桥',
              address: 'San Francisco, CA 94129, United States',
            }),
          }}
        />
      </div>
    </div>
  );
};

/**
 * 无效数据
 */
export const InvalidData = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <LocationMessage
        content={{
          text: 'invalid json data',
        }}
      />
    </div>
  );
};
