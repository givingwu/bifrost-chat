import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { MessageList } from '@/components/messages/MessageList';
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
import {
  type Conversation,
  ConversationStatusEnum,
} from '@/interfaces/conversation.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import {
  MessageDirectionEnum,
  type MessageSendResult,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type { Template } from '@/interfaces/template.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import '@/styles/theme.css';

const activeConversation: Conversation = {
  id: 'conv-mobile-1',
  user: {
    id: 'user-mobile-1',
    name: '叶+义',
    status: AgentStatusEnum.Online,
  },
  lastMessage:
    '您好，您的逾期已经影响信用记录，建议您今天先处理一半以避免违约金增加。',
  lastMessageTime: new Date('2026-05-11T14:22:00+08:00').toISOString(),
  unreadCount: 0,
  channel: ChannelTypeEnum.Viber,
  status: ConversationStatusEnum.Active,
  supportedChannels: [ChannelTypeEnum.Viber],
  metadata: {
    customerPin: 'user-mobile-1',
    customerApp: 'bifrost.storybook',
  },
};

const mobileMessages: StandardMessage[] = [
  {
    id: 'msg-mobile-1',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.Viber,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-05-11T14:20:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: {
      text: '你好，我目前资金周转困难，能不能延期几天？',
    },
    sender: { app: 'bifrost.storybook', pin: 'user-mobile-1' },
    receiver: { app: 'bifrost.storybook', pin: 'agent-mobile-1' },
  },
  {
    id: 'msg-mobile-2',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.Viber,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-05-11T14:22:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: {
      text: '您好，您的逾期已经影响信用记录，建议您今天先处理一半以避免违约金增加。您可以点击之前的还款链接进行操作。',
    },
    sender: { app: 'bifrost.storybook', pin: 'agent-mobile-1' },
    receiver: { app: 'bifrost.storybook', pin: 'user-mobile-1' },
  },
];

const quickTemplates: Template[] = [
  {
    id: 'tpl-mobile-1',
    name: '常规提醒',
    code: 'TPL_OVERDUE_NOTICE',
    content: '账单即将逾期通知',
    category: '常用',
  },
  {
    id: 'tpl-mobile-2',
    name: '严重警告',
    code: 'TPL_LEGAL_NOTICE',
    content: '法务诉讼最后通牒',
    category: '催收',
  },
  {
    id: 'tpl-mobile-3',
    name: '协商方案',
    code: 'TPL_NEGOTIATION',
    content: '专属减免限时发放',
    category: '协商',
  },
  {
    id: 'tpl-mobile-4',
    name: '外呼转接',
    code: 'TPL_CALLBACK',
    content: '请求回电核实意愿',
    category: '外呼',
  },
];

class MobileConversationService implements IConversationService {
  async list() {
    return [activeConversation];
  }

  async get(conversationId: string) {
    return conversationId === activeConversation.id ? activeConversation : null;
  }

  async create() {
    return activeConversation;
  }

  async query() {
    return activeConversation;
  }
}

class MobileMessageService implements IMessageService {
  async list() {
    return mobileMessages;
  }

  async send(): Promise<MessageSendResult> {
    return {
      tempId: `tmp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
  }

  async markAsRead() {
    return undefined;
  }

  subscribeToMessages() {
    return () => undefined;
  }

  subscribeToMessageStatus() {
    return () => undefined;
  }

  async sendAttachment(): Promise<SendAttachmentResult> {
    return {
      tempId: `attachment-tmp-${Date.now()}`,
      messageId: `attachment-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
  }

  async sendAudio(): Promise<SendAudioResult> {
    return {
      type: MessageTypeEnum.Audio,
      tempId: `audio-tmp-${Date.now()}`,
      messageId: `audio-${Date.now()}`,
      status: 'sent',
    };
  }
}

class MobileTemplateService implements ITemplateService {
  async list() {
    return quickTemplates;
  }

  async preview(params: {
    conversationId: string;
    currentChannel: string;
    templateCode: string;
  }) {
    const template = quickTemplates.find(
      (item) => item.code === params.templateCode,
    );

    if (!template) {
      throw new Error(`Template ${params.templateCode} not found`);
    }

    return {
      ...template,
      params: {},
      previewContent: `${template.content}：您好，建议您今天优先处理账单，避免违约金继续增加。`,
    };
  }
}

const services = {
  conversationService: new MobileConversationService(),
  messageService: new MobileMessageService(),
  templateService: new MobileTemplateService(),
};

function MobileLayoutDemo({
  theme,
  channel = ChannelTypeEnum.Viber,
  activeConversationId = activeConversation.id,
  avatarUrl,
  customMessageMaxLength,
  initialValue,
}: {
  theme?: 'light' | 'dark';
  channel?: ChannelTypeEnum;
  activeConversationId?: string;
  avatarUrl?: string;
  customMessageMaxLength?: number;
  initialValue?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const conversation = {
    ...activeConversation,
    channel,
    supportedChannels: [channel],
    user: {
      ...activeConversation.user,
      avatarUrl,
    },
  };

  useEffect(() => {
    if (!initialValue) return;

    const timer = window.setTimeout(() => {
      const input = rootRef.current?.querySelector<HTMLInputElement>(
        'input[placeholder="输入消息..."]',
      );
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;

      if (!input || !valueSetter) return;

      valueSetter.call(input, initialValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialValue]);

  const renderMessageList = activeConversationId
    ? () => (
        <MessageList messages={mobileMessages} enableVirtualization={false} />
      )
    : undefined;
  const conversationService: IConversationService = {
    async list() {
      return [conversation];
    },
    async get() {
      return conversation;
    },
    async create() {
      return conversation;
    },
    async query() {
      return conversation;
    },
  };

  return (
    <div
      ref={rootRef}
      className={`flex min-h-[860px] items-center justify-center bg-background p-6 ${
        theme === 'dark' ? 'dark' : ''
      }`}
      data-theme={theme}
    >
      <div className="h-[820px] w-[390px] overflow-hidden rounded-[2rem] border-8 border-gray-800 bg-background shadow-2xl">
        <ConfigProvider
          config={{
            activeConversationId,
            language: { code: LanguageCodeEnum.ZhCN },
            theme: {
              mode: theme === 'dark' ? ThemeModeEnum.Dark : ThemeModeEnum.Light,
            },
            strategy: {
              activeChannel: channel,
              allowedChannels: [channel],
            },
            composer: {
              placeholder: '输入消息...',
              templateMode: 'edit',
              allowTemplateEdit: false,
              customMessageMaxLength,
            },
          }}
        >
          <ServiceProvider
            conversationService={conversationService}
            messageService={services.messageService}
            templateService={services.templateService}
          >
            <ChatContainer>
              <MobileLayout
                onClose={() => {
                  console.log('close mobile layout');
                }}
                renderMessageList={renderMessageList}
              />
            </ChatContainer>
          </ServiceProvider>
        </ConfigProvider>
      </div>
    </div>
  );
}

function MobileLayoutTemplateSheetOpenDemo() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const root = rootRef.current;
      root
        ?.querySelector<HTMLButtonElement>('[aria-label="打开快捷话术模板"]')
        ?.click();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={rootRef}>
      <MobileLayoutDemo channel={ChannelTypeEnum.SMS} />
    </div>
  );
}

const meta: Meta<typeof MobileLayout> = {
  title: 'Layout/MobileLayout',
  component: MobileLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MobileLayout>;

/**
 * 默认移动端布局
 */
export const Default: Story = {
  render: () => <MobileLayoutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '移动端基础布局：Header、消息列表、底部快捷模板入口、输入框和发送按钮；模板回填后默认不可编辑，与 PC 端保持一致。',
      },
    },
  },
};

/**
 * 无激活会话状态
 */
export const EmptyConversation: Story = {
  render: () => <MobileLayoutDemo activeConversationId="" />,
  parameters: {
    docs: {
      description: {
        story: '无激活会话时消息区显示空态，模板和发送入口不可操作。',
      },
    },
  },
};

/**
 * 深色主题
 */
export const Dark: Story = {
  render: () => <MobileLayoutDemo theme="dark" />,
  parameters: {
    docs: {
      description: {
        story: '深色主题下的移动端布局，主题由 ConfigProvider 注入。',
      },
    },
  },
};

/**
 * WhatsApp 渠道
 */
export const WhatsAppChannel: Story = {
  render: () => (
    <MobileLayoutDemo
      channel={ChannelTypeEnum.WhatsApp}
      avatarUrl="https://i.pravatar.cc/64?u=wa"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'WhatsApp 渠道：Header 背景为 WhatsApp 绿色品牌色，显示用户头像。',
      },
    },
  },
};

/**
 * SMS 渠道（无头像）
 */
export const SmsChannelNoAvatar: Story = {
  render: () => <MobileLayoutDemo channel={ChannelTypeEnum.SMS} />,
  parameters: {
    docs: {
      description: {
        story: 'SMS 渠道：Header 背景为蓝色品牌色，无头像时显示 SMS 渠道图标。',
      },
    },
  },
};

/**
 * 模板 ActionSheet 打开状态
 */
export const TemplateActionSheetOpen: Story = {
  render: () => <MobileLayoutTemplateSheetOpenDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '模板 ActionSheet 打开后使用高层级 overlay 覆盖消息区，避免对话内容遮挡模板列表。',
      },
    },
  },
};

/**
 * Email 渠道
 */
export const EmailChannel: Story = {
  render: () => <MobileLayoutDemo channel={ChannelTypeEnum.Email} />,
  parameters: {
    docs: {
      description: {
        story: 'Email 渠道：Header 背景为橙色品牌色，渲染 Email 图标。',
      },
    },
  },
};

/**
 * RCS 渠道
 */
export const RcsChannel: Story = {
  render: () => <MobileLayoutDemo channel={ChannelTypeEnum.RCS} />,
  parameters: {
    docs: {
      description: {
        story: 'RCS 渠道：Header 背景为青色品牌色。',
      },
    },
  },
};

/**
 * 输入长度限制
 */
export const LengthLimit: Story = {
  render: () => (
    <MobileLayoutDemo
      customMessageMaxLength={12}
      initialValue="这是一段超过限制的移动端输入"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '移动端输入区展示当前字数和最大长度，超过限制时字数文案使用错误色提示，发送时按当前上限裁剪实际发送内容。',
      },
    },
  },
};
