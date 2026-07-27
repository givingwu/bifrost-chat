import type { Meta } from 'storybook-react-rsbuild';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { MobileChatContainer } from '@/components/layout/MobileChatContainer';
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

// Mock 数据
const conversations: Conversation[] = [
  {
    id: 'conv-1',
    user: { id: 'user-1', name: '张三', status: AgentStatusEnum.Online },
    lastMessage: '请问账单什么时候可以还清？',
    lastMessageTime: new Date('2026-07-27T10:30:00+08:00').toISOString(),
    unreadCount: 2,
    channel: ChannelTypeEnum.WhatsApp,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.SMS],
    metadata: { assetItemNumber: 'ASSET-001' },
  },
  {
    id: 'conv-2',
    user: { id: 'user-2', name: '李四', status: AgentStatusEnum.Offline },
    lastMessage: '好的，我会尽快处理',
    lastMessageTime: new Date('2026-07-27T09:15:00+08:00').toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.SMS,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.SMS],
    metadata: { assetItemNumber: 'ASSET-002' },
  },
  {
    id: 'conv-3',
    user: { id: 'user-3', name: '王五', status: AgentStatusEnum.Online },
    lastMessage: '谢谢您的提醒',
    lastMessageTime: new Date('2026-07-26T18:00:00+08:00').toISOString(),
    unreadCount: 5,
    channel: ChannelTypeEnum.Viber,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.Viber],
    metadata: { assetItemNumber: 'ASSET-003' },
  },
  {
    id: 'conv-4',
    user: { id: 'user-4', name: '赵六', status: AgentStatusEnum.Busy },
    lastMessage: '请问可以延期还款吗？',
    lastMessageTime: new Date('2026-07-26T15:30:00+08:00').toISOString(),
    unreadCount: 1,
    channel: ChannelTypeEnum.Email,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.Email],
    metadata: { assetItemNumber: 'ASSET-004' },
  },
];

const mobileMessages: StandardMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:28:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '你好，我想咨询一下还款事宜' },
    sender: { app: 'storybook', pin: 'user-1' },
    receiver: { app: 'storybook', pin: 'agent-1' },
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:29:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '您好，请问有什么可以帮您的？' },
    sender: { app: 'storybook', pin: 'agent-1' },
    receiver: { app: 'storybook', pin: 'user-1' },
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: new Date('2026-07-27T10:30:00+08:00').getTime(),
    type: MessageTypeEnum.Text,
    content: { text: '请问账单什么时候可以还清？' },
    sender: { app: 'storybook', pin: 'user-1' },
    receiver: { app: 'storybook', pin: 'agent-1' },
  },
];

const quickTemplates: Template[] = [
  {
    id: 'tpl-1',
    name: '常规提醒',
    code: 'TPL_OVERDUE_NOTICE',
    content: '账单即将逾期通知',
    category: '常用',
  },
  {
    id: 'tpl-2',
    name: '严重警告',
    code: 'TPL_LEGAL_NOTICE',
    content: '法务诉讼最后通牒',
    category: '催收',
  },
];

// Mock Services
class ConversationService implements IConversationService {
  async list() {
    return conversations;
  }
  async get(id: string) {
    return conversations.find((c) => c.id === id) || null;
  }
  async create() {
    return conversations[0];
  }
  async query() {
    return conversations[0];
  }
  async getUnreadCount() {
    return {
      [ChannelTypeEnum.WhatsApp]: 7,
      [ChannelTypeEnum.SMS]: 0,
      [ChannelTypeEnum.Viber]: 5,
      [ChannelTypeEnum.Email]: 1,
    };
  }
}

class MessageService implements IMessageService {
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

function MobileChatContainerDemo({
  theme = 'light',
  initialView = 'list',
}: {
  theme?: 'light' | 'dark';
  initialView?: 'list' | 'chat';
}) {
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
            language: { code: LanguageCodeEnum.ZhCN },
            theme: {
              mode: theme === 'dark' ? ThemeModeEnum.Dark : ThemeModeEnum.Light,
            },
            strategy: {
              activeChannel: ChannelTypeEnum.WhatsApp,
              allowedChannels: [
                ChannelTypeEnum.WhatsApp,
                ChannelTypeEnum.SMS,
                ChannelTypeEnum.Viber,
                ChannelTypeEnum.Email,
              ],
            },
          }}
        >
          <ServiceProvider {...services}>
            <ChatContainer>
              <MobileChatContainer
                initialView={initialView}
                initialConversationId="conv-1"
              />
            </ChatContainer>
          </ServiceProvider>
        </ConfigProvider>
      </div>
    </div>
  );
}

const meta: Meta<typeof MobileChatContainer> = {
  title: 'Layout/MobileChatContainer',
  component: MobileChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default= {
  render: () => <MobileChatContainerDemo />,
  parameters: {
    docs: {
      description: {
        story: '默认列表视图，显示消息中心标题、资产搜索、渠道切换和会话列表。',
      },
    },
  },
};

export const Dark= {
  render: () => <MobileChatContainerDemo theme="dark" />,
  parameters: {
    docs: {
      description: {
        story: '深色主题下的消息中心。',
      },
    },
  },
};

export const InitialChatView= {
  render: () => <MobileChatContainerDemo initialView="chat" />,
  parameters: {
    docs: {
      description: {
        story: '直接进入聊天视图的场景。',
      },
    },
  },
};
