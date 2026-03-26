import { useEffect, useRef, useState } from 'react';
import type { Meta } from 'storybook-react-rsbuild';
import {
  ComposerToolbar,
  type ComposerToolbarRef,
} from '@/components/composer/ComposerToolbar';
import {
  AvailableChannels,
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
      options: AvailableChannels,
    },
    onSend: { action: 'send' },
    onSendAttachment: { action: 'sendAttachment' },
    onSendAudio: { action: 'sendAudio' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    maxLength: { control: 'number' },
  },
};

export default meta;

/**
 * WhatsApp 渠道
 */
export const WhatsApp = () => {
  return (
    <div className="rounded-lg">
      <ComposerToolbar
        conversationId="conv-1"
        channel={ChannelTypeEnum.WhatsApp}
        onSend={async (content) => console.log('Send:', content)}
        onSendAttachment={async (attachments, text) =>
          console.log('Attachments:', attachments, 'Text:', text)
        }
        onSendAudio={async (audio) => console.log('Audio:', audio)}
      />
    </div>
  );
};

/**
 * SMS 渠道
 */
export const SMS = () => {
  return (
    <div className="rounded-lg">
      <ComposerToolbar
        conversationId="conv-1"
        channel={ChannelTypeEnum.SMS}
        onSend={async (content) => console.log('Send:', content)}
      />
    </div>
  );
};

/**
 * Email 渠道
 */
export const Email = () => {
  return (
    <div className="rounded-lg">
      <ComposerToolbar
        conversationId="conv-1"
        channel={ChannelTypeEnum.Email}
        onSend={async (content) => console.log('Send:', content)}
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
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="rounded-lg">
        <ComposerToolbar
          conversationId="conv-1"
          channel={ChannelTypeEnum.WhatsApp}
          onSend={async (content) => console.log('Send:', content)}
          onSendAttachment={async (attachments, text) =>
            console.log('Attachments:', attachments, 'Text:', text)
          }
          onSendAudio={async (audio) => console.log('Audio:', audio)}
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
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="rounded-lg">
        <ComposerToolbar
          conversationId="conv-1"
          channel={ChannelTypeEnum.WhatsApp}
          onSend={async (content) => console.log('Send:', content)}
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
  const [enableAttachments, setEnableAttachments] = useState(true);

  const config = {
    composer: {
      enableAttachments,
      enableAudioInput: false,
      showChannelBadge,
      showCharCount,
      showHint,
    },
  };

  return (
    <ConfigProvider config={config}>
      <div className="space-y-4">
        <div className="bg-card rounded-lg space-y-2">
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
              checked={enableAttachments}
              onChange={(e) => setEnableAttachments(e.target.checked)}
            />
            <span className="text-sm">启用附件功能</span>
          </label>
        </div>
        <div className="rounded-lg">
          <ComposerToolbar
            conversationId="conv-1"
            channel={ChannelTypeEnum.WhatsApp}
            onSend={async (content) => console.log('Send:', content)}
            onSendAttachment={async (attachments, text) =>
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
    <div className="rounded-lg">
      <ComposerToolbar
        conversationId="conv-1"
        channel={ChannelTypeEnum.WhatsApp}
        disabled
        onSend={async (content) => console.log('Send:', content)}
      />
    </div>
  );
};

/**
 * 模板消息默认不受字数限制，自定义消息继续受限
 */
export const TemplateIgnoresLengthLimit = () => {
  const ref = useRef<ComposerToolbarRef>(null);

  useEffect(() => {
    ref.current?.setValue(
      '模板内容模板内容模板内容模板内容模板内容',
      'template-long',
    );
  }, []);

  return (
    <ConfigProvider
      config={{
        composer: {
          customMessageMaxLength: 10,
          ignoreMaxLengthForTemplateMessages: true,
        },
      }}
    >
      <div className="space-y-3 rounded-lg">
        <p className="text-sm text-text-muted">
          自定义消息最多 10 字；当前通过模板注入的内容不会被截断。
        </p>
        <ComposerToolbar
          ref={ref}
          conversationId="conv-1"
          channel={ChannelTypeEnum.WhatsApp}
          onSend={async (content) => console.log('Send:', content)}
        />
      </div>
    </ConfigProvider>
  );
};
