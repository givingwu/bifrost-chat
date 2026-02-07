import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import '@/styles/theme.css';
import { I18nProvider, zhCNMessages } from '@/index';

/**
 * ComposerWithSend 组件 Story 文档
 *
 * 展示带发送功能的输入工具栏的各种用法
 */

// 创建 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const meta: Meta<typeof ComposerWithSend> = {
  title: 'Composer/ComposerWithSend',
  component: ComposerWithSend,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    conversationId: {
      control: 'text',
      description: '会话 ID',
    },
    channel: {
      control: 'select',
      options: Object.values(ChannelTypeEnum),
      description: '当前激活渠道',
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCNMessages}>
          <Story />
        </I18nProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComposerWithSend>;

/**
 * 默认状态的 ComposerWithSend
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
export const WhatsApp: Story = {
  args: {
    conversationId: 'conv-123',
    channel: ChannelTypeEnum.WhatsApp,
  },
  parameters: {
    docs: {
      description: {
        story: 'WhatsApp 渠道支持发送文本、图片、视频、文件等多种消息类型。',
      },
    },
  },
};

/**
 * SMS 渠道
 */
export const SMS: Story = {
  args: {
    conversationId: 'conv-123',
    channel: ChannelTypeEnum.SMS,
  },
  parameters: {
    docs: {
      description: {
        story: 'SMS 渠道只支持发送文本消息，会显示字符数和计费条数。',
      },
    },
  },
};

/**
 * Email 渠道
 */
export const Email: Story = {
  args: {
    conversationId: 'conv-123',
    channel: ChannelTypeEnum.Email,
  },
  parameters: {
    docs: {
      description: {
        story: 'Email 渠道支持富文本编辑，包含主题和正文。',
      },
    },
  },
};
