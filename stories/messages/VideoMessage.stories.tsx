import type { Meta, StoryObj } from '@storybook/react';
import { VideoMessage } from '@/components/messages/VideoMessage';
import '@/styles/theme.css';

/**
 * VideoMessage 组件 Story 文档
 *
 * 展示视频消息的各种用法：
 * - 不同尺寸
 * - 不同格式
 */

const meta: Meta<typeof VideoMessage> = {
  title: 'Messages/VideoMessage',
  component: VideoMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VideoMessage>;

/**
 * 基础示例 - 默认视频
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <VideoMessage
        content={{
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          mimeType: 'video/mp4',
        }}
      />
    </div>
  );
};

/**
 * 在消息气泡中使用 - 展示实际应用场景
 */
export const InMessageBubble = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <VideoMessage
            content={{
              url: 'https://www.w3schools.com/html/mov_bbb.mp4',
              mimeType: 'video/mp4',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 不同时长 - 展示不同视频时长
 */
export const DifferentDurations = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">短视频</p>
          <VideoMessage
            content={{
              url: 'https://www.w3schools.com/html/mov_bbb.mp4',
              mimeType: 'video/mp4',
            }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-xs text-primary-foreground/70 mb-2">长视频</p>
          <VideoMessage
            content={{
              url: 'https://www.w3schools.com/html/mov_bbb.mp4',
              mimeType: 'video/mp4',
            }}
          />
        </div>
      </div>
    </div>
  );
};
