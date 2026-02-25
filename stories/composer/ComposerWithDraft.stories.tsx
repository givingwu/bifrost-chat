import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ComposerWithDraft } from '@/components/composer/ComposerWithDraft';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import '@/styles/theme.css';

/**
 * ComposerWithDraft 组件 Story 文档
 *
 * 展示带草稿功能的输入工具栏的各种用法：
 * - 基础使用
 * - 不同会话的草稿隔离
 * - 发送成功后清除草稿
 * - 草稿自动保存和加载
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const meta: Meta<typeof ComposerWithDraft> = {
  title: 'Composer/ComposerWithDraft',
  component: ComposerWithDraft,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ConfigProvider config={{}}>
          <Story />
        </ConfigProvider>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    conversationId: {
      control: 'text',
      description: '会话 ID（用于草稿存储）',
    },
    channel: {
      control: 'select',
      description: '当前激活渠道',
      options: ['sms', 'whatsapp', 'email', 'waba'],
      mapping: {
        sms: ChannelTypeEnum.SMS,
        whatsapp: ChannelTypeEnum.WhatsApp,
        email: ChannelTypeEnum.Email,
        waba: ChannelTypeEnum.Waba,
      },
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    loading: {
      control: 'boolean',
      description: '是否加载中',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerWithDraft>;

/**
 * 基础示例 - 默认输入框
 */
export const Default = () => {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = async (content: string) => {
    // 模拟发送延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessages((prev) => [...prev, content]);
    console.log('Message sent:', content);
  };

  return (
    <div className="space-y-4">
      <div className="w-96">
        <ComposerWithDraft conversationId="default" onSend={handleSend} />
      </div>
      <div className="w-96 h-48 overflow-y-auto p-2 bg-muted rounded">
        {messages.length === 0 ? (
          <p className="text-text-muted text-sm">暂无消息</p>
        ) : (
          messages.map((msg) => (
            <div key={msg} className="p-2 mb-2 bg-card rounded text-sm">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * 不同渠道 - 展示不同渠道的输入框
 */
export const DifferentChannels = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = async (content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessages((prev) => [...prev, `[${activeChannel}] ${content}`]);
    console.log('Message sent:', content);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveChannel(ChannelTypeEnum.WhatsApp)}
          className={`px-3 py-1 rounded ${
            activeChannel === ChannelTypeEnum.WhatsApp
              ? 'bg-green-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel(ChannelTypeEnum.SMS)}
          className={`px-3 py-1 rounded ${
            activeChannel === ChannelTypeEnum.SMS
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          SMS
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel(ChannelTypeEnum.Email)}
          className={`px-3 py-1 rounded ${
            activeChannel === ChannelTypeEnum.Email
              ? 'bg-purple-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Email
        </button>
      </div>
      <div className="w-96">
        <ComposerWithDraft
          key={activeChannel}
          conversationId={`channel-${activeChannel}`}
          channel={activeChannel}
          onSend={handleSend}
        />
      </div>
      <div className="w-96 h-48 overflow-y-auto p-2 bg-muted rounded">
        {messages.length === 0 ? (
          <p className="text-text-muted text-sm">暂无消息</p>
        ) : (
          messages.map((msg) => (
            <div key={msg} className="p-2 mb-2 bg-card rounded text-sm">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * 草稿隔离 - 展示不同会话的草稿隔离
 */
export const DraftIsolation = () => {
  const [activeConversation, setActiveConversation] = useState('conv1');
  const [messages, setMessages] = useState<Record<string, string[]>>({
    conv1: [],
    conv2: [],
    conv3: [],
  });

  const handleSend = async (content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessages((prev) => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), content],
    }));
    console.log('Message sent:', content);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveConversation('conv1')}
          className={`px-3 py-1 rounded ${
            activeConversation === 'conv1'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          会话 1
        </button>
        <button
          type="button"
          onClick={() => setActiveConversation('conv2')}
          className={`px-3 py-1 rounded ${
            activeConversation === 'conv2'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          会话 2
        </button>
        <button
          type="button"
          onClick={() => setActiveConversation('conv3')}
          className={`px-3 py-1 rounded ${
            activeConversation === 'conv3'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          会话 3
        </button>
      </div>
      <div className="w-96">
        <ComposerWithDraft
          key={activeConversation}
          conversationId={activeConversation}
          onSend={handleSend}
        />
      </div>
      <div className="w-96 h-48 overflow-y-auto p-2 bg-muted rounded">
        {messages[activeConversation]?.length === 0 ? (
          <p className="text-text-muted text-sm">暂无消息</p>
        ) : (
          messages[activeConversation]?.map((msg) => (
            <div key={msg} className="p-2 mb-2 bg-card rounded text-sm">
              {msg}
            </div>
          ))
        )}
      </div>
      <p className="text-sm text-text-muted">
        提示：在不同会话之间切换，草稿会自动保存和加载
      </p>
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="w-96">
      <ComposerWithDraft
        conversationId="disabled"
        onSend={async () => console.log('Send')}
        disabled
      />
    </div>
  );
};

/**
 * 加载状态
 */
export const Loading = () => {
  return (
    <div className="w-96">
      <ComposerWithDraft
        conversationId="loading"
        onSend={async () => console.log('Send')}
        loading
      />
    </div>
  );
};
