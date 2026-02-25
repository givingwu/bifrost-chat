import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState } from 'react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import '@/styles/theme.css';

/**
 * ComposerToolbar 组件 Story 文档
 *
 * 展示完整的输入工具栏的各种用法：
 * - 不同渠道的工具栏
 * - 附件上传
 * - 表情选择
 * - 模板选择
 */
const meta: Meta<typeof ComposerToolbar> = {
  title: 'Composer/ComposerToolbar',
  component: ComposerToolbar,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      defaultValue: ChannelTypeEnum.WhatsApp,
      control: { type: 'select' },
      options: AvailableChannelTypes,
    },
    onSend: { action: 'send' },
    onSendAttachment: { action: 'sendAttachment' },
    onSendAudio: { action: 'sendAudio' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    onEmojiClick: { action: 'emojiClick' },
    maxLength: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerToolbar>;

/**
 * WhatsApp 渠道
 */
export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerToolbar
        channel={ChannelTypeEnum.WhatsApp}
        onSend={(content) => console.log('Send:', content)}
        onSendAttachment={(attachments, text) =>
          console.log('Attachments:', attachments, 'Text:', text)
        }
        onSendAudio={(audio) => console.log('Audio:', audio)}
      />
    </div>
  );
};

/**
 * SMS 渠道
 */
export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerToolbar
        channel={ChannelTypeEnum.SMS}
        onSend={(content) => console.log('Send:', content)}
      />
    </div>
  );
};

/**
 * Email 渠道
 */
export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerToolbar
        channel={ChannelTypeEnum.Email}
        onSend={(content) => console.log('Send:', content)}
      />
    </div>
  );
};

/**
 * 所有功能 - 展示所有 UI 元素
 */
export const WithAllFeatures = () => {
  const config = {
    composer: {
      enableAttachments: true,
      enableAudioInput: true,
      showChannelBadge: true,
      showCharCount: true,
      showHint: true,
      showEmojiButton: true,
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.WhatsApp}
          onSend={(content) => console.log('Send:', content)}
          onSendAttachment={(attachments, text) =>
            console.log('Attachments:', attachments, 'Text:', text)
          }
          onSendAudio={(audio) => console.log('Audio:', audio)}
        />
      </div>
    </ConfigProvider>
  );
};

/**
 * 最小化配置 - 仅显示必要元素
 */
export const Minimal = () => {
  const config = {
    composer: {
      enableAttachments: false,
      enableAudioInput: false,
      showChannelBadge: false,
      showCharCount: false,
      showHint: false,
      showEmojiButton: true,
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.WhatsApp}
          onSend={(content) => console.log('Send:', content)}
        />
      </div>
    </ConfigProvider>
  );
};

/**
 * 自定义配置 - 可动态调整配置
 */
export const CustomConfig = () => {
  const [showChannelBadge, setShowChannelBadge] = useState(true);
  const [showCharCount, setShowCharCount] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [showEmojiButton, setShowEmojiButton] = useState(true);
  const [enableAttachments, setEnableAttachments] = useState(true);

  const config = {
    composer: {
      enableAttachments,
      enableAudioInput: false,
      showChannelBadge,
      showCharCount,
      showHint,
      showEmojiButton,
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="space-y-4">
        <div className="p-4 bg-card rounded-lg space-y-2">
          <p className="text-sm font-medium">配置选项：</p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showChannelBadge}
              onChange={(e) => setShowChannelBadge(e.target.checked)}
            />
            <span className="text-sm">显示渠道徽章</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCharCount}
              onChange={(e) => setShowCharCount(e.target.checked)}
            />
            <span className="text-sm">显示字符计数</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showHint}
              onChange={(e) => setShowHint(e.target.checked)}
            />
            <span className="text-sm">显示提示信息</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showEmojiButton}
              onChange={(e) => setShowEmojiButton(e.target.checked)}
            />
            <span className="text-sm">显示表情按钮</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableAttachments}
              onChange={(e) => setEnableAttachments(e.target.checked)}
            />
            <span className="text-sm">启用附件功能</span>
          </label>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <ComposerToolbar
            channel={ChannelTypeEnum.WhatsApp}
            onSend={(content) => console.log('Send:', content)}
            onSendAttachment={(attachments, text) =>
              console.log('Attachments:', attachments, 'Text:', text)
            }
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerToolbar
        channel={ChannelTypeEnum.WhatsApp}
        disabled
        onSend={(content) => console.log('Send:', content)}
      />
    </div>
  );
};
