import type { Meta } from 'storybook-react-rsbuild';
import { MobileChatLayout } from '@/components/layout/MobileChatLayout';
import {
  ConfigProvider,
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  ServiceProvider,
} from '@/index';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import type {
  SendAttachmentParams,
  SendAttachmentResult,
} from '@/interfaces/attachment.interface';
import type {
  SendAudioParams,
  SendAudioResult,
} from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationStatusEnum } from '@/interfaces/conversation.interface';
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
  id: 'conv-chat-1',
  user: {
    id: 'user-chat-1',
    name: '张三',
    status: AgentStatusEnum.Online,
  },
  lastMessage: '请问账单什么时候可以还清？',
  lastMessageTime: new Date('2026-07-27T10:30:00+08:00').toISOString(),
  unreadCount: 0,
  channel: ChannelTypeEnum.WhatsApp,
  status: ConversationStatusEnum.Active,
  supportedChannels: [ChannelTypeEnum.WhatsApp],
  metadata: { assetItemNumber: 'ASSET-001' },
};

const chatMessages: StandardMessage[] = [
  {
    id: 'msg-chat-1',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:20:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '你好，我想咨询一下还款事宜' },
    sender: { app: 'storybook', pin: 'user-chat-1' },
    receiver: { app: 'storybook', pin: 'agent-chat-1' },
  },
  {
    id: 'msg-chat-2',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:22:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '您好，请问有什么可以帮您的？' },
    sender: { app: 'storybook', pin: 'agent-chat-1' },
    receiver: { app: 'storybook', pin: 'user-chat-1' },
  },
  {
    id: 'msg-chat-3',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:25:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '我最近资金周转有些困难，想问一下能不能延期还款？' },
    sender: { app: 'storybook', pin: 'user-chat-1' },
    receiver: { app: 'storybook', pin: 'agent-chat-1' },
  },
  {
    id: 'msg-chat-4',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:27:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: {
      text: '理解您的困难。我们可以帮您申请延期 7 天，不过需要您先提交相关证明材料。',
    },
    sender: { app: 'storybook', pin: 'agent-chat-1' },
    receiver: { app: 'storybook', pin: 'user-chat-1' },
  },
  {
    id: 'msg-chat-5',
    conversationId: activeConversation.id,
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:30:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '请问账单什么时候可以还清？' },
    sender: { app: 'storybook', pin: 'user-chat-1' },
    receiver: { app: 'storybook', pin: 'agent-chat-1' },
  },
];

const quickTemplates: Template[] = [
  {
    id: 'tpl-chat-1',
    name: '常规提醒',
    code: 'TPL_OVERDUE_NOTICE',
    content: '账单即将逾期通知',
    category: '常用',
  },
  {
    id: 'tpl-chat-2',
    name: '延期确认',
    code: 'TPL_DELAY_CONFIRM',
    content: '您的延期申请已受理，请按约定时间还款',
    category: '协商',
  },
];

class ConversationService implements IConversationService {
  async list() {
    return [activeConversation];
  }
  async get() {
    return activeConversation;
  }
  async create() {
    return activeConversation;
  }
  async query() {
    return activeConversation;
  }
}

class MessageService implements IMessageService {
  sendAttachment(_params: SendAttachmentParams): Promise<SendAttachmentResult> {
    throw new Error('Method not implemented.');
  }
  sendAudio(_params: SendAudioParams): Promise<SendAudioResult> {
    throw new Error('Method not implemented.');
  }
  async list() {
    return chatMessages;
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
}

class TemplateService implements ITemplateService {
  async list() {
    return quickTemplates;
  }
  async preview() {
    return {
      ...quickTemplates[0],
      params: {},
      previewContent: quickTemplates[0].content,
    };
  }
}

const services = {
  conversationService: new ConversationService(),
  messageService: new MessageService(),
  templateService: new TemplateService(),
};

function MobileChatLayoutDemo({
  theme = 'light',
  channel = ChannelTypeEnum.WhatsApp,
  showCloseButton = true,
  showBackButton = true,
}: {
  theme?: 'light' | 'dark';
  channel?: ChannelTypeEnum;
  showCloseButton?: boolean;
  showBackButton?: boolean;
}) {
  const conversation = {
    ...activeConversation,
    channel,
    supportedChannels: [channel],
  };

  return (
    <div
      className={`flex min-h-[860px] items-center justify-center bg-background p-6 ${
        theme === 'dark' ? 'dark' : ''
      }`}
      data-theme={theme}
    >
      <div className="h-[820px] w-[390px] overflow-hidden rounded-[2rem] border-8 border-gray-800 bg-background shadow-2xl">
        <ConfigProvider
          config={{
            activeConversationId: conversation.id,
            language: { code: LanguageCodeEnum.ZhCN },
            theme: {
              mode: theme === 'dark' ? ThemeModeEnum.Dark : ThemeModeEnum.Light,
            },
            strategy: {
              activeChannel: channel,
              allowedChannels: [channel],
            },
          }}
        >
          <ServiceProvider
            conversationService={services.conversationService}
            messageService={services.messageService}
            templateService={services.templateService}
          >
            <MobileChatLayout
              conversationId={conversation.id}
              onBack={showBackButton ? () => console.log('back') : undefined}
              onClose={showCloseButton ? () => console.log('close') : undefined}
            />
          </ServiceProvider>
        </ConfigProvider>
      </div>
    </div>
  );
}

const meta: Meta<typeof MobileChatLayout> = {
  title: 'Layout/MobileChatLayout',
  component: MobileChatLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default= {
  render: () => <MobileChatLayoutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '默认单聊界面：返回按钮、客户名称+渠道、关闭按钮、消息区、输入区。',
      },
    },
  },
};

export const Dark= {
  render: () => <MobileChatLayoutDemo theme="dark" />,
  parameters: {
    docs: {
      description: {
        story: '深色主题。',
      },
    },
  },
};

export const SMSChannel= {
  render: () => <MobileChatLayoutDemo channel={ChannelTypeEnum.SMS} />,
  parameters: {
    docs: {
      description: {
        story: 'SMS 渠道样式。',
      },
    },
  },
};

export const ViberChannel= {
  render: () => <MobileChatLayoutDemo channel={ChannelTypeEnum.Viber} />,
  parameters: {
    docs: {
      description: {
        story: 'Viber 渠道样式。',
      },
    },
  },
};

export const WithoutBackButton= {
  render: () => <MobileChatLayoutDemo showBackButton={false} />,
  parameters: {
    docs: {
      description: {
        story: '嵌入场景：无返回按钮，仅显示关闭按钮。',
      },
    },
  },
};

export const WithoutCloseButton= {
  render: () => <MobileChatLayoutDemo showCloseButton={false} />,
  parameters: {
    docs: {
      description: {
        story: '仅返回按钮，无关闭按钮。',
      },
    },
  },
};
