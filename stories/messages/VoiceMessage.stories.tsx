import type { Meta, StoryObj } from '@storybook/react';
import { VoiceMessage } from '@/components/messages/VoiceMessage';
import '@/styles/theme.css';

/**
 * VoiceMessage 组件 Story 文档
 *
 * 展示语音消息的各种用法：
 * - 不同时长
 * - 播放状态
 */

const meta: Meta<typeof VoiceMessage> = {
  title: 'Messages/VoiceMessage',
  component: VoiceMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VoiceMessage>;

/**
 * 基础示例 - 默认语音消息
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <VoiceMessage
        content={{
          url: 'https://example.com/voice.mp3',
          mimeType: 'audio/mp3',
        }}
      />
    </div>
  );
};

/**
 * 不同时长 - 展示不同语音时长
 */
export const DifferentDurations = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">短语音 (5s)</p>
          <VoiceMessage
            content={{
              url: 'https://example.com/voice1.mp3',
              mimeType: 'audio/mp3',
            }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-xs text-primary-foreground/70 mb-2">
            长语音 (60s)
          </p>
          <VoiceMessage
            content={{
              url: 'https://example.com/voice2.mp3',
              mimeType: 'audio/mp3',
            }}
          />
        </div>
      </div>
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
          <VoiceMessage
            content={{
              url: 'https://example.com/voice.mp3',
              mimeType: 'audio/mp3',
            }}
          />
        </div>
      </div>
    </div>
  );
};
