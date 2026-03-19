import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { DefaultChatLayout } from '@/components/layout/DefaultChatLayout';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import enUS from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';
import {
  ConfigProvider,
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  ServiceProvider,
} from '@/index';
import type { PaginatedResponse } from '@/services/core/conversation.service';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { SendAttachmentResult } from '@/interfaces/attachment.interface';
import type { SendAudioResult } from '@/interfaces/audio.interface';
import {
  AvailableChannels,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
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

// 共享数据源
const MOCK_NAMES = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
  '孙八',
  '周九',
  '吴十',
  '郑十一',
  '冯十二',
  '陈十三',
  '褚十四',
  '卫十五',
  '蒋十六',
  '沈十七',
  '韩十八',
  '杨十九',
  '朱二十',
  '秦二十一',
  '尤二十二',
  '许二十三',
  '何二十四',
  '吕二十五',
  '施二十六',
  '张二十七',
  '孔二十八',
  '曹二十九',
  '严三十',
  '华三十一',
  '金三十二',
  '魏三十三',
  '陶三十四',
  '姜三十五',
  '戚三十六',
  '谢三十七',
  '邹三十八',
  '喻三十九',
  '柏四十',
  '窦四十一',
];

const MOCK_MESSAGES = [
  '你好，请问有什么可以帮助您的？',
  '好的，谢谢',
  '请问产品价格是多少？',
  '我想了解一下产品详情',
  '什么时候可以发货？',
  '收到，谢谢您的回复',
  '请问还有其他问题吗？',
  '好的，我稍后联系您',
  '请问有什么优惠活动吗？',
  '感谢您的耐心解答',
  '我需要咨询一下售后服务',
  '请问支持哪些支付方式？',
  '好的，我明白了',
  '请问可以开发票吗？',
  '感谢您的支持',
  '请问产品有保修吗？',
  '好的，我会考虑的',
  '请问什么时候有货？',
  '感谢您的反馈',
  '请问可以退货吗？',
];

const MOCK_STATUSES = [
  AgentStatusEnum.Online,
  AgentStatusEnum.Offline,
  AgentStatusEnum.Away,
  AgentStatusEnum.Busy,
];

function generateMockConversations(): Conversation[] {
  return Array.from({ length: 40 }, (_, i) => {
    const id = i + 1;
    return {
      id: `conv-${id}`,
      user: {
        id: `user-${id}`,
        name: MOCK_NAMES[i % MOCK_NAMES.length],
        avatarUrl: `https://i.pravatar.cc/150?img=${id}`,
        status: MOCK_STATUSES[i % MOCK_STATUSES.length],
      },
      lastMessage: MOCK_MESSAGES[i % MOCK_MESSAGES.length],
      lastMessageTime: new Date(Date.now() - i * 60000 * 5).toISOString(),
      unreadCount: i % 5 === 0 ? Math.floor(Math.random() * 10) + 1 : 0,
      channel: AvailableChannels[i % AvailableChannels.length],
      supportedChannels: [...AvailableChannels],
      isActive: i === 0,
    };
  });
}

// 全局共享会话存储
const mockConversationStore = generateMockConversations();

// Mock 服务实现
class MockConversationService implements IConversationService {
  async list() {
    return {
      current: 1,
      data: [...mockConversationStore],
      total: mockConversationStore.length,
      size: 20,
    } as PaginatedResponse<Conversation>;
  }

  async get(conversationId: string) {
    return mockConversationStore.find(
      (c) => c.id === conversationId,
    ) as Conversation;
  }

  async create(params?: {
    debtorId?: number;
    contactId?: number;
    sourceChatId?: string;
    channelType?: ChannelTypeEnum;
  }) {
    const newId = params?.sourceChatId
      ? `${params.sourceChatId}-${params.channelType ?? 'whatsapp'}`
      : `conv-${mockConversationStore.length + 1}`;

    const newConversation: Conversation = {
      id: newId,
      user: {
        id: '13800000000',
        name: '新用户',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      channel: params?.channelType ?? ChannelTypeEnum.WhatsApp,
      isActive: true,
      supportedChannels: [
        ChannelTypeEnum.WhatsApp,
        ChannelTypeEnum.SMS,
        ChannelTypeEnum.Email,
      ],
      metadata: {
        debtorId: params?.debtorId ?? 10001,
        contactId: params?.contactId ?? 20001,
        customerPin: '13800000000',
        customerApp: 'fox_collect.customer',
        assetFromApp: 'fox.collect',
        whatsappFreeTemplate: 'WA_FREE_TEXT',
        uplinkSmsFreeTemplate: 'SMS_FREE_TEXT',
      },
    };

    // 添加到共享存储
    mockConversationStore.unshift(newConversation);
    return newConversation;
  }

  async query(params?: { conversationId?: string }) {
    const conversationId = params?.conversationId;

    if (conversationId) {
      return this.get(conversationId);
    }

    return mockConversationStore[0] ?? null;
  }
}

class MockMessageService implements IMessageService {
  sendAttachment(_params: unknown): Promise<SendAttachmentResult> {
    throw new Error('Method not implemented.');
  }
  sendAudio(_params: unknown): Promise<SendAudioResult> {
    throw new Error('Method not implemented.');
  }
  async list(conversationId: string) {
    // 随机生成 20~100 条消息数据用于测试虚拟滚动
    const messageCount = Math.floor(Math.random() * 81) + 20; // 20-100
    const messages: StandardMessage[] = Array.from(
      { length: messageCount },
      (_, i) => {
        const id = i + 1;
        const directions = [
          MessageDirectionEnum.Incoming,
          MessageDirectionEnum.Outgoing,
        ];
        const statuses = [
          MessageStatusEnum.Created,
          MessageStatusEnum.Sending,
          MessageStatusEnum.Sent,
          MessageStatusEnum.Delivered,
          MessageStatusEnum.Read,
          MessageStatusEnum.Failed,
        ];
        const channels = [
          ChannelTypeEnum.WhatsApp,
          ChannelTypeEnum.SMS,
          ChannelTypeEnum.Email,
          ChannelTypeEnum.WhatsApp,
        ];
        const textMessages = [
          '你好，请问有什么可以帮助您的？',
          '我想咨询一下产品信息',
          '请问产品价格是多少？',
          '好的，谢谢',
          '什么时候可以发货？',
          '收到，谢谢您的回复',
          '请问还有其他问题吗？',
          '好的，我稍后联系您',
          '请问有什么优惠活动吗？',
          '感谢您的耐心解答',
          '我需要咨询一下售后服务',
          '请问支持哪些支付方式？',
          '好的，我明白了',
          '请问可以开发票吗？',
          '感谢您的支持',
          '请问产品有保修吗？',
          '好的，我会考虑的',
          '请问什么时候有货？',
          '感谢您的反馈',
          '请问可以退货吗？',
          '这个产品看起来很不错',
          '请问有其他颜色吗？',
          '好的，我下单了',
          '请问发货需要多长时间？',
          '感谢您的服务',
          '请问可以加急处理吗？',
          '好的，我等您消息',
          '请问有现货吗？',
          '感谢您的耐心等待',
          '请问可以修改订单吗？',
        ];

        const direction = directions[i % directions.length];

        return {
          id: `msg-${id}`,
          conversationId,
          direction,
          channelType: channels[i % channels.length],
          status: statuses[i % statuses.length],
          timestamp: Date.now() - i * 60000 * 3,
          type: MessageTypeEnum.Text,
          content: {
            text: textMessages[i % textMessages.length],
          },
          sender: { app: 'sender-app', pin: 'sender-pin' },
          receiver: { app: 'receiver-app', pin: 'receiver-pin' },
        };
      },
    );
    return messages;
  }

  async send(_conversationId: string) {
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
        code: 'TPL_GREETING',
        content: '您好，有什么可以帮助您的吗？',
        category: '常用',
        tags: ['问候', '开场'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        name: '感谢',
        code: 'TPL_THANKS',
        content: '非常感谢您的支持！',
        category: '常用',
        tags: ['感谢', '礼貌'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        name: '跟进',
        code: 'TPL_FOLLOW_UP',
        content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
        category: '销售',
        tags: ['跟进', '销售'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '4',
        name: '预约',
        code: 'TPL_BOOKING',
        content: '您好，请问您方便安排一个时间进行详细沟通吗？',
        category: '业务',
        tags: ['预约', '沟通'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '5',
        name: '结束语',
        code: 'TPL_CLOSING',
        content: '祝您生活愉快！',
        category: '常用',
        tags: ['结束语', '礼貌'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    return templates;
  }

  async preview(params: {
    conversationId: string;
    currentChannel: string;
    templateCode: string;
  }) {
    // Mock preview implementation - 模拟 /chat/v2/template/render
    const templates = await this.list();
    const template = templates.find((t) => t.code === params.templateCode);
    if (!template) {
      throw new Error(`Template with code ${params.templateCode} not found`);
    }
    return {
      ...template,
      params: {
        debtorName: '张三',
      },
      previewContent: `${template.content}（渠道: ${params.currentChannel}）`,
    };
  }
}

const meta: Meta<typeof DefaultChatLayout> = {
  title: 'Layout/DefaultChatLayout',
  component: DefaultChatLayout,
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'class name',
    },
  },
  decorators: [
    (Story) => (
      <ConfigProvider
        config={{
          strategy: {
            activeChannel: ChannelTypeEnum.WhatsApp,
            allowedChannels: [
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.Email,
            ],
          },
        }}
      >
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={new MockTemplateService()}
        >
          <Story />
        </ServiceProvider>
      </ConfigProvider>
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
        story:
          '展示默认聊天布局的完整结构，包含会话列表、消息区域和输入框。切换 active conversation 后，Composer 会在下一轮调度自动聚焦，便于直接输入。',
      },
    },
  },
};

/**
 * 详情页直达会话
 *
 * 展示 `conversationBootstrap` 在详情页场景下的 query -> create 引导能力。
 */
export const WithConversationBootstrap: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '进入详情页时，DefaultChatLayout 会先尝试 query 已有会话，未命中再 create，成功后自动激活对应会话与渠道。',
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
      <ServiceProvider
        conversationService={new MockConversationService()}
        messageService={new MockMessageService()}
        templateService={new MockTemplateService()}
      >
        <I18nProvider locale={LanguageCodeEnum.EnUS} messages={enUS}>
          <Story />
        </I18nProvider>
      </ServiceProvider>
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

/**
 * Profile + 模板面板并存
 *
 * 展示右侧边栏中 Profile（客户画像）与 TemplatePanel（快捷回复模板）同时渲染时的
 * 间距和分割线效果。
 *
 * @description
 * 通过 `configureChatStore` 注入 mock profile 数据来触发 Profile 组件渲染，
 * 同时 TemplatePanel 正常展示模板列表。两者之间由父级 `aside` 的 `divide-y`
 * 自动插入分割线，无需各自管理边框。
 */
export const WithProfileAndTemplatePanel: Story = {
  args: {},
  decorators: [
    (Story) => (
      <ConfigProvider
        config={{
          strategy: {
            activeChannel: ChannelTypeEnum.SMS,
            allowedChannels: [
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.Email,
            ],
          },
          profile: {
            profile: {
              id: 'user-demo',
              name: '张三',
              avatarUrl: 'https://i.pravatar.cc/150?img=12',
              role: 'VIP 客户',
              email: 'zhangsan@example.com',
              phone: '+86 138 0000 0000',
              tags: ['VIP', '已认证'],
            },
          },
        }}
      >
        <ServiceProvider
          conversationService={new MockConversationService()}
          messageService={new MockMessageService()}
          templateService={new MockTemplateService()}
        >
          <Story />
        </ServiceProvider>
      </ConfigProvider>
    ),
  ],
  render: (args) => (
    <DefaultChatLayout {...args}>
      <InfiniteMessageList conversationId="conv-1" />
    </DefaultChatLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '右侧面板同时展示客户画像（Profile）和快捷回复模板（TemplatePanel）。两者之间通过父容器的 divide-y 自动插入分割线，Profile 不再自持 border-b，TemplatePanel 用包裹层保证剩余空间填满与内部滚动正常。',
      },
    },
  },
};
