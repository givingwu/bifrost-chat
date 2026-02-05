import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultChatLayoutContainer } from '@/components/layout/DefaultChatLayoutContainer';
import { ChatMessageListContainer } from '@/components/messages/ChatMessageListContainer';
import enUS from '@/locales/en-US.json';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';
import {
  type IConversationService,
  type IMessageService,
  ServiceProvider,
} from '@/index';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type {
  MessageSendResult,
  StandardMessage,
} from '@/interfaces/message.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';

/**
 * DefaultChatLayout 组件 Story 文档
 *
 * 展示默认聊天布局的各种用法：
 * - 完整布局
 * - 不同主题
 * - 不同语言
 */

// Mock 服务实现
class MockConversationService implements IConversationService {
  async list() {
    const conversations: Conversation[] = [
      {
        id: 'conv-1',
        user: {
          id: 'user-1',
          name: '张三',
          avatarUrl: 'https://i.pravatar.cc/150?img=1',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '你好，请问有什么可以帮助您的？',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 2,
        channel: ChannelTypeEnum.WhatsApp,
        isActive: true,
      },
      {
        id: 'conv-2',
        user: {
          id: 'user-2',
          name: '李四',
          avatarUrl: 'https://i.pravatar.cc/150?img=2',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '好的，谢谢',
        lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.SMS,
        isActive: false,
      },
    ];
    return conversations;
  }

  async get(conversationId: string) {
    const conversation: Conversation = {
      id: conversationId,
      user: {
        id: 'user-1',
        name: '张三',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '你好，请问有什么可以帮助您的？',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
    };
    return conversation;
  }

  async create() {
    const conversation: Conversation = {
      id: 'conv-new',
      user: {
        id: 'user-new',
        name: '新用户',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
    };
    return conversation;
  }

  async query() {
    const conversation: Conversation = {
      id: 'conv-1',
      user: {
        id: 'user-1',
        name: '张三',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '你好，请问有什么可以帮助您的？',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
    };
    return conversation;
  }
}

class MockMessageService implements IMessageService {
  async list(conversationId: string) {
    const messages: StandardMessage[] = [
      {
        id: 'msg-1',
        direction: MessageDirectionEnum.Incoming,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Read,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: '你好，请问有什么可以帮助您的？' },
      },
      {
        id: 'msg-2',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Delivered,
        timestamp: Date.now() - 60000,
        type: MessageTypeEnum.Text,
        content: { text: '我想咨询一下产品信息' },
      },
    ];
    return messages;
  }

  async send(conversationId: string) {
    const result: MessageSendResult = {
      tempId: `temp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
    return result;
  }

  async markAsRead() {
    // void return
  }

  subscribeToMessages() {
    return () => {};
  }

  subscribeToMessageStatus() {
    return () => {};
  }
}

// 创建 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const meta: Meta<typeof DefaultChatLayoutContainer> = {
  title: 'Layout/DefaultChatLayout',
  component: DefaultChatLayoutContainer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={{} as any}
        >
          <I18nProvider locale="zh-CN" messages={zhCN}>
            <div className="w-full h-[900px]">
              <Story />
            </div>
          </I18nProvider>
        </ServiceProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DefaultChatLayoutContainer>;

/**
 * 基础示例 - 默认布局
 */
export const Default: Story = {
  args: {},
};

/**
 * 带消息列表的完整示例
 */
export const WithMessageList: Story = {
  args: {},
  render: (args) => (
    <DefaultChatLayoutContainer {...args}>
      <ChatMessageListContainer conversationId="conv-1" />
    </DefaultChatLayoutContainer>
  ),
};

/**
 * 不同主题 - 展示主题切换
 */
export const DifferentThemes: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div className="w-full h-[900px]" data-theme="light">
        <p className="text-xs text-text-muted mb-2">浅色主题</p>
        <DefaultChatLayoutContainer {...args} />
      </div>
      <div className="w-full h-[900px]" data-theme="dark">
        <p className="text-xs text-text-muted mb-2">深色主题</p>
        <DefaultChatLayoutContainer {...args} />
      </div>
    </div>
  ),
};

/**
 * 英文版本
 */
export const English: Story = {
  args: {},
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={{} as any}
        >
          <I18nProvider locale="en-US" messages={enUS}>
            <div className="w-full h-[900px]">
              <Story />
            </div>
          </I18nProvider>
        </ServiceProvider>
      </QueryClientProvider>
    ),
  ],
};
