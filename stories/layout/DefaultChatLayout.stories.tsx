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
  },
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
type Story = StoryObj<typeof DefaultChatLayout>;

/**
 * 基础示例 - 默认布局
 *
 * 展示完整的聊天界面布局，包括：
 * - 顶部工具栏（网络状态、主题切换、语言切换）
 * - 左侧会话列表面板（带渠道筛选）
 * - 中间消息区域（需要传入 InfiniteMessageList）
 * - 底部输入框（选中会话后显示）
 * - 右侧客户画像面板
 *
 * @description
 * 这是最基础的使用方式，展示了默认布局的所有功能区域。
 * 消息区域需要通过 children 传入 InfiniteMessageList 组件。
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
默认布局展示了完整的聊天界面结构：

\`\`\`tsx
<DefaultChatLayout>
  <InfiniteMessageList conversationId="conv-1" />
</DefaultChatLayout>
\`\`\`

**布局结构：**
- **顶部工具栏**：显示网络状态、主题切换、语言切换
- **左侧面板**：会话列表，支持渠道筛选（WhatsApp、SMS、Email 等）
- **中间区域**：消息列表（需要通过 children 传入）
- **底部输入框**：选中会话后自动显示，根据渠道类型动态调整
- **右侧面板**：客户画像信息

**特性：**
- 响应式布局，适配不同屏幕尺寸
- 支持主题切换（浅色/深色）
- 支持多语言（中文/英文）
- 根据选中会话动态显示输入框
- 支持多渠道消息发送
        `,
      },
    },
  },
};

/**
 * 带消息列表的完整示例
 *
 * 展示包含消息列表的完整聊天界面。
 * 通过 children 传入 InfiniteMessageList 组件来显示消息内容。
 *
 * @description
 * 这是最常用的使用方式，展示了完整的聊天功能：
 * - 会话列表（左侧）
 * - 消息列表（中间）
 * - 输入框（底部）
 * - 客户画像（右侧）
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
        story: `
带消息列表的完整示例展示了最常用的聊天界面配置：

\`\`\`tsx
<DefaultChatLayout>
  <InfiniteMessageList conversationId="conv-1" />
</DefaultChatLayout>
\`\`\`

**功能说明：**
- 消息列表会自动加载指定会话的消息
- 支持滚动加载历史消息
- 支持消息状态显示（发送中、已发送、已读等）
- 支持多种消息类型（文本、图片、文件、视频等）
- 底部输入框会根据当前会话状态自动显示/隐藏
        `,
      },
    },
  },
};

/**
 * 不同主题 - 展示主题切换
 *
 * 展示浅色和深色两种主题下的布局效果。
 * 通过 data-theme 属性控制主题样式。
 *
 * @description
 * SDK 支持浅色和深色两种主题，可以通过以下方式切换：
 * - 使用 ThemeSwitcher 组件（顶部工具栏）
 * - 通过 data-theme 属性设置
 * - 通过 useTheme hook 的 setTheme 方法
 *
 * 主题样式定义在 src/styles/theme.css 中。
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
        story: `
展示浅色和深色两种主题下的布局效果。

**主题切换方式：**

1. **通过 data-theme 属性**（静态设置）：
\`\`\`tsx
<div data-theme="light">
  <DefaultChatLayout />
</div>
\`\`\`

2. **通过 ThemeSwitcher 组件**（动态切换）：
\`\`\`tsx
const { mode, setTheme } = useTheme();

<ThemeSwitcher value={mode} onChange={setTheme} />
\`\`\`

3. **通过 useTheme hook**：
\`\`\`tsx
const { setTheme } = useTheme();

setTheme('dark'); // 切换到深色主题
setTheme('light'); // 切换到浅色主题
\`\`\`

**主题样式变量：**
- \`--color-background\`: 背景色
- \`--color-surface\`: 表面色
- \`--color-primary\`: 主色调
- \`--color-text\`: 文本色
- \`--color-border\`: 边框色
- \`--spacing-*\`: 间距变量
        `,
      },
    },
  },
};

/**
 * 英文版本
 *
 * 展示英文语言环境下的布局效果。
 * 通过 I18nProvider 的 locale 属性设置语言。
 *
 * @description
 * SDK 支持多语言国际化，默认支持中文和英文。
 * 语言切换方式：
 * - 使用 LanguageSwitcher 组件（顶部工具栏）
 * - 通过 I18nProvider 的 locale 属性
 * - 通过 useLanguage hook 的 setLanguage 方法
 *
 * 语言文件位于 src/locales/ 目录下。
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
  parameters: {
    docs: {
      description: {
        story: `
展示英文语言环境下的布局效果。

**语言切换方式：**

1. **通过 I18nProvider**（应用级别设置）：
\`\`\`tsx
<I18nProvider locale="en-US" messages={enUS}>
  <DefaultChatLayout />
</I18nProvider>
\`\`\`

2. **通过 LanguageSwitcher 组件**（动态切换）：
\`\`\`tsx
const { code, setLanguage } = useLanguage();

<LanguageSwitcher value={code} onChange={setLanguage} />
\`\`\`

3. **通过 useLanguage hook**：
\`\`\`tsx
const { setLanguage } = useLanguage();

setLanguage('zh-CN'); // 切换到中文
setLanguage('en-US'); // 切换到英文
\`\`\`

**添加新语言：**

1. 在 \`src/locales/\` 目录下创建新的语言文件（如 \`ja-JP.json\`）
2. 复制现有语言文件的结构并翻译内容
3. 在 I18nProvider 中导入并使用新的语言文件

**语言文件结构：**
\`\`\`json
{
  "chat": {
    "title": "Chat",
    "send": "Send",
    "typeMessage": "Type a message..."
  },
  "conversation": {
    "list": "Conversations",
    "search": "Search conversations..."
  }
}
\`\`\`
        `,
      },
    },
  },
};
