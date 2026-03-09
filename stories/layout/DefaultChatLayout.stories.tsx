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
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { SendAttachmentResult } from '@/interfaces/attachment.interface';
import type { SendAudioResult } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
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

// Mock 服务实现
class MockConversationService implements IConversationService {
  async list() {
    // 生成 40 条会话数据用于测试虚拟滚动
    const conversations: Conversation[] = Array.from({ length: 40 }, (_, i) => {
      const id = i + 1;
      const channels = [
        ChannelTypeEnum.WhatsApp,
        ChannelTypeEnum.SMS,
        ChannelTypeEnum.Email,
        ChannelTypeEnum.WhatsApp,
      ];
      const statuses = [
        AgentStatusEnum.Online,
        AgentStatusEnum.Offline,
        AgentStatusEnum.Away,
        AgentStatusEnum.Busy,
      ];
      const names = [
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
      const messages = [
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

      return {
        id: `conv-${id}`,
        user: {
          id: `user-${id}`,
          name: names[i % names.length],
          avatarUrl: `https://i.pravatar.cc/150?img=${id}`,
          status: statuses[i % statuses.length],
        },
        lastMessage: messages[i % messages.length],
        lastMessageTime: new Date(Date.now() - i * 60000 * 5).toISOString(),
        unreadCount: i % 5 === 0 ? Math.floor(Math.random() * 10) + 1 : 0,
        channel: channels[i % channels.length],
        isActive: i === 0,
      };
    });
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
  sendAttachment(params: any): Promise<SendAttachmentResult> {
    throw new Error('Method not implemented.');
  }
  sendAudio(params: any): Promise<SendAudioResult> {
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

  async preview(params: {
    conversationId: string;
    currentChannel: string;
    templateCode: string;
  }) {
    // Mock preview implementation - returns a template with preview content
    const templates = await this.list();
    const template = templates.find((t) => t.code === params.templateCode);
    if (!template) {
      throw new Error(`Template with code ${params.templateCode} not found`);
    }
    return {
      ...template,
      params: {},
      previewContent: template.content || '',
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
              ChannelTypeEnum.WhatsApp,
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
