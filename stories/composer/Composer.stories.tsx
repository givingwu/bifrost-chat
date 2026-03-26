import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { ComposerRef } from '@/components/composer/Composer';
import { Composer } from '@/components/composer/Composer';
import { ChannelTypeEnum, MessageStatusEnum } from '@/index';
import { ConfigProvider } from '@/providers/config.provider';
import '@/styles/theme.css';

/**
 * Composer 组件 Story 文档
 *
 * 统一的消息输入组件，整合了草稿、附件、录音等功能。
 *
 * 特性：
 * - 支持多渠道（SMS、WhatsApp、Email等）
 * - 内置草稿自动保存
 * - 支持附件上传和预览
 * - 支持语音录制
 * - 支持模板内容填充
 */

const meta: Meta<typeof Composer> = {
  title: 'Composer/Composer',
  component: Composer,
  tags: ['autodocs'],
  argTypes: {
    conversationId: {
      control: 'text',
      description: '会话 ID（用于草稿存储）',
    },
    channel: {
      control: 'select',
      options: Object.values(ChannelTypeEnum),
      description: '当前激活渠道',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    loading: {
      control: 'boolean',
      description: '是否显示 ComposerSkeleton 占位',
    },
    maxLength: {
      control: 'number',
      description: '最大输入长度',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/**
 * 默认状态
 */
export const Default: Story = {
  args: {
    conversationId: 'conv-123',
    channel: ChannelTypeEnum.WhatsApp,
  },
};

/**
 * WhatsApp 渠道
 */
export const WhatsAppChannel: Story = {
  args: {
    conversationId: 'conv-whatsapp',
    channel: ChannelTypeEnum.WhatsApp,
  },
};

/**
 * SMS 渠道
 */
export const SMSChannel: Story = {
  args: {
    conversationId: 'conv-sms',
    channel: ChannelTypeEnum.SMS,
  },
};

/**
 * Email 渠道
 */
export const EmailChannel: Story = {
  args: {
    conversationId: 'conv-email',
    channel: ChannelTypeEnum.Email,
  },
};

/**
 * 禁用状态
 */
export const Disabled: Story = {
  args: {
    conversationId: 'conv-disabled',
    channel: ChannelTypeEnum.WhatsApp,
    disabled: true,
  },
};

/**
 * 加载占位状态
 */
export const Loading: Story = {
  args: {
    conversationId: 'conv-loading',
    channel: ChannelTypeEnum.WhatsApp,
    loading: true,
  },
};

/**
 * 带发送回调
 */
export const WithSendCallback: Story = {
  args: {
    conversationId: 'conv-callback',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (
      content: string,
      options?: { templateMetadata?: unknown },
    ) => {
      console.log('Sending message:', { content, options });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Message sent!');
      // 返回 MessageSendResult 以匹配组件类型定义
      return {
        tempId: `temp-${Date.now()}`,
        status: MessageStatusEnum.Sent,
      };
    },
    onSendAttachment: async (attachments, text) => {
      console.log('Sending attachments:', { attachments, text });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Attachments sent!');
    },
  },
};

/**
 * 模板编辑态默认不受字数限制
 */
export const TemplateIgnoresLengthLimit: Story = {
  render: () => {
    const ref = useRef<ComposerRef>(null);

    useEffect(() => {
      ref.current?.setTemplate({
        content: '模板内容模板内容模板内容模板内容模板内容',
        templateCode: 'template-long',
      });
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
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            自定义消息最多 10 字；模板回填到 Composer 后不截断。
          </p>
          <Composer
            ref={ref}
            conversationId="conv-template-limit"
            channel={ChannelTypeEnum.WhatsApp}
          />
        </div>
      </ConfigProvider>
    );
  },
};
