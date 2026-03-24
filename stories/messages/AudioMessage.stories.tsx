import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { AudioMessage } from '@/components/messages/AudioMessage';
import '@/styles/theme.css';

/**
 * AudioMessage 组件 Story 文档
 *
 * 展示语音消息的各种用法：
 * - 不同时长
 * - 播放状态
 */

const meta: Meta<typeof AudioMessage> = {
  title: 'Messages/AudioMessage',
  component: AudioMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AudioMessage>;

/**
 * 基础示例 - 默认语音消息
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <AudioMessage
        content={{
          url: 'https://cdn.pixabay.com/audio/2025/09/17/audio_32aeb1ec12.mp3',
          mimeType: 'audio/ogg',
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
          <AudioMessage
            content={{
              url: 'https://cdn.pixabay.com/audio/2025/09/17/audio_32aeb1ec12.mp3',
              mimeType: 'audio/ogg',
            }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-xs text-primary-foreground/70 mb-2">
            长语音 (60s)
          </p>
          <AudioMessage
            content={{
              url: 'https://cdn.pixabay.com/audio/2025/09/17/audio_32aeb1ec12.mp3',
              mimeType: 'audio/ogg',
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
          <AudioMessage
            content={{
              url: 'https://cdn.pixabay.com/audio/2025/09/17/audio_32aeb1ec12.mp3',
              mimeType: 'audio/ogg',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 错误状态 - 资源不可用
 */
export const ErrorState = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <AudioMessage
        content={{
          url: 'https://example.com/invalid-audio.mp3',
          mimeType: 'audio/mp3',
        }}
      />
    </div>
  );
};

/**
 * 无效 URL - 展示错误处理
 */
export const InvalidUrl = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">缺少 URL 字段</p>
          <AudioMessage content={{ text: 'No URL field' } as never} />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">无效的 URL 格式</p>
          <AudioMessage
            content={{
              url: 'not-a-valid-url',
              mimeType: 'audio/mp3',
            }}
          />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">不支持的协议</p>
          <AudioMessage
            content={{
              url: 'ftp://example.com/audio.mp3',
              mimeType: 'audio/mp3',
            }}
          />
        </div>
      </div>
    </div>
  );
};
