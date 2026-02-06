import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultChatLayout } from '@/components/layout/DefaultChatLayout';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import enUS from '@/locales/en-US.json';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';
import {
  type IConversationService,
  type IMessageService,
  type ITemplateService,
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
import type { Template } from '@/interfaces/template.interface';

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

class MockTemplateService implements ITemplateService {
  async list() {
    const templates: Template[] = [
      {
        id: '1',
        name: '问候',
        content: '您好，有什么可以帮助您的吗？',
        category: '常用',
        tags: ['问候', '开场'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        name: '感谢',
        content: '非常感谢您的支持！',
        category: '常用',
        tags: ['感谢', '礼貌'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        name: '跟进',
        content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
        category: '销售',
        tags: ['跟进', '销售'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '4',
        name: '预约',
        content: '您好，请问您方便安排一个时间进行详细沟通吗？',
        category: '业务',
        tags: ['预约', '沟通'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '5',
        name: '结束语',
        content: '祝您生活愉快！',
        category: '常用',
        tags: ['结束语', '礼貌'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    return templates;
  }

  async send(params: any) {
    const result = {
      tempId: `temp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
    return result;
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

const meta: Meta<typeof DefaultChatLayout> = {
  title: 'Layout/DefaultChatLayout',
  component: DefaultChatLayout,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description: '消息区域内容（通常传入 InfiniteMessageList）',
      table: {
        type: {
          summary: 'ReactNode',
        },
        defaultValue: {
          summary: 'undefined',
        },
      },
    },
    className: {
      control: 'text',
      description: 'class name',
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={new MockTemplateService()}
        >
          <I18nProvider locale="zh-CN" messages={zhCN}>
            <Story />
          </I18nProvider>
        </ServiceProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DefaultChatLayout>;

/**
 * 基础示例 - 默认布局
 *
 * 展示完整的聊天界面布局结构。
 *
 * @description
 * 默认布局包含以下功能区域：
 * - 顶部工具栏：网络状态、主题切换、语言切换
 * - 左侧面板：会话列表，支持渠道筛选
 * - 中间区域：消息列表（需通过 children 传入）
 * - 底部输入框：选中会话后自动显示
 * - 右侧面板：客户画像信息
 *
 * 使用方式：
 * ```tsx
 * <DefaultChatLayout>
 *   <InfiniteMessageList conversationId="conv-1" />
 * </DefaultChatLayout>
 * ```
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: '展示默认聊天布局的完整结构，包含会话列表、消息区域和输入框。',
      },
    },
  },
};

/**
 * 带消息列表的完整示例
 *
 * 展示包含消息列表的完整聊天界面。
 *
 * @description
 * 通过 children 传入 InfiniteMessageList 组件来显示消息内容。
 * 这是最常用的使用方式，展示完整的聊天功能。
 */
export const WithMessageList: Story = {
  args: {},
  render: (args) => (
    <DefaultChatLayout {...args}>
      <InfiniteMessageList conversationId="conv-1" />
    </DefaultChatLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '展示包含消息列表的完整聊天界面，支持自动加载和滚动加载历史消息。',
      },
    },
  },
};

/**
 * 不同主题 - 展示主题切换
 *
 * 展示浅色和深色两种主题下的布局效果。
 *
 * @description
 * SDK 支持浅色和深色两种主题，可通过 ThemeSwitcher 组件或 data-theme 属性切换。
 */
export const DifferentThemes: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div className="w-full h-[900px]" data-theme="light">
        <p className="text-xs text-text-muted mb-2">浅色主题</p>
        <DefaultChatLayout {...args} />
      </div>
      <div className="w-full h-[900px]" data-theme="dark">
        <p className="text-xs text-text-muted mb-2">深色主题</p>
        <DefaultChatLayout {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '展示浅色和深色两种主题下的布局效果，支持通过 ThemeSwitcher 组件或 data-theme 属性切换主题。',
      },
    },
  },
};

/**
 * 英文版本
 *
 * 展示英文语言环境下的布局效果。
 *
 * @description
 * SDK 支持多语言国际化，默认支持中文和英文，可通过 LanguageSwitcher 组件或 I18nProvider 切换语言。
 */
export const English: Story = {
  args: {},
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={new MockTemplateService()}
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
  parameters: {
    docs: {
      description: {
        story:
          '展示英文语言环境下的布局效果。SDK 支持中文和英文两种语言，可通过 LanguageSwitcher 组件或 I18nProvider 的 locale 属性切换。',
      },
    },
  },
};
