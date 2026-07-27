import type { Meta } from 'storybook-react-rsbuild';
import { MobileListLayout } from '@/components/layout/MobileListLayout';
import {
  ConfigProvider,
  type IConversationService,
  ServiceProvider,
} from '@/index';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  type Conversation,
  ConversationStatusEnum,
} from '@/interfaces/conversation.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import '@/styles/theme.css';

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
    channel: ChannelTypeEnum.WhatsApp,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.WhatsApp],
    metadata: { assetItemNumber: 'ASSET-002' },
  },
  {
    id: 'conv-3',
    user: { id: 'user-3', name: '王五', status: AgentStatusEnum.Online },
    lastMessage: '谢谢您的提醒',
    lastMessageTime: new Date('2026-07-26T18:00:00+08:00').toISOString(),
    unreadCount: 5,
    channel: ChannelTypeEnum.WhatsApp,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.WhatsApp],
    metadata: { assetItemNumber: 'ASSET-003' },
  },
  {
    id: 'conv-4',
    user: { id: 'user-4', name: '赵六', status: AgentStatusEnum.Busy },
    lastMessage: '请问可以延期还款吗？',
    lastMessageTime: new Date('2026-07-26T15:30:00+08:00').toISOString(),
    unreadCount: 1,
    channel: ChannelTypeEnum.SMS,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.SMS],
    metadata: { assetItemNumber: 'ASSET-004' },
  },
  {
    id: 'conv-5',
    user: { id: 'user-5', name: '钱七', status: AgentStatusEnum.Online },
    lastMessage: '已收到您的消息',
    lastMessageTime: new Date('2026-07-26T12:00:00+08:00').toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.Viber,
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.Viber],
    metadata: { assetItemNumber: 'ASSET-005' },
  },
];

class ConversationService implements IConversationService {
  async list() {
    return conversations;
  }
  async get() {
    return conversations[0];
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
      [ChannelTypeEnum.SMS]: 1,
      [ChannelTypeEnum.Viber]: 5,
      [ChannelTypeEnum.Email]: 0,
    };
  }
}

function MobileListLayoutDemo({
  theme = 'light',
  showAssetSearch = true,
}: {
  theme?: 'light' | 'dark';
  showAssetSearch?: boolean;
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
          <ServiceProvider
            conversationService={new ConversationService()}
            messageService={{
              async list() {
                return [];
              },
              async send() {
                return {
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                };
              },
              async markAsRead() {
                return undefined;
              },
              sendAttachment() {
                return Promise.resolve({
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                });
              },
              sendAudio() {
                return Promise.resolve({
                  type: MessageTypeEnum.Audio,
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                });
              },
              subscribeToMessages() {
                return () => undefined;
              },
              subscribeToMessageStatus() {
                return () => undefined;
              },
            }}
            templateService={{
              async list() {
                return [];
              },
              async preview() {
                return {
                  id: '',
                  name: '',
                  code: '',
                  content: '',
                  params: {},
                  previewContent: '',
                };
              },
            }}
          >
            <MobileListLayout
              showAssetSearch={showAssetSearch}
              renderItemMeta={(conv) => (
                <span className="text-xs text-muted-foreground">
                  {String(conv.metadata?.assetItemNumber ?? '')}
                </span>
              )}
              onSelectConversation={(id) => console.log('Selected:', id)}
            />
          </ServiceProvider>
        </ConfigProvider>
      </div>
    </div>
  );
}

const meta: Meta<typeof MobileListLayout> = {
  title: 'Layout/MobileListLayout',
  component: MobileListLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default= {
  render: () => <MobileListLayoutDemo />,
  parameters: {
    docs: {
      description: {
        story: '默认会话列表：标题、资产搜索、渠道切换和会话列表。',
      },
    },
  },
};

export const Dark= {
  render: () => <MobileListLayoutDemo theme="dark" />,
  parameters: {
    docs: {
      description: {
        story: '深色主题。',
      },
    },
  },
};

export const WithoutSearch= {
  render: () => <MobileListLayoutDemo showAssetSearch={false} />,
  parameters: {
    docs: {
      description: {
        story: '隐藏资产搜索框的布局。',
      },
    },
  },
};

export const WithUnreadBadges= {
  render: () => <MobileListLayoutDemo />,
  parameters: {
    docs: {
      description: {
        story: '渠道 Tab 显示未读角标：WhatsApp 7 条、SMS 1 条、Viber 5 条。',
      },
    },
  },
};

// 生成大量测试数据用于虚拟滚动
function generateManyConversations(count: number): Conversation[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `conv-${i + 1}`,
    user: {
      id: `user-${i + 1}`,
      name: `用户${i + 1}`,
      status: i % 4 === 0 ? AgentStatusEnum.Online : AgentStatusEnum.Offline,
    },
    lastMessage: `测试消息 ${i + 1} 的内容`,
    lastMessageTime: new Date(Date.now() - i * 60000000).toISOString(),
    unreadCount: i % 5 === 0 ? (i % 10) + 1 : 0,
    channel: [
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.Viber,
      ChannelTypeEnum.Email,
    ][i % 4],
    status: ConversationStatusEnum.Active,
    supportedChannels: [ChannelTypeEnum.WhatsApp],
    metadata: { assetItemNumber: `ASSET-${String(i + 1).padStart(4, '0')}` },
  }));
}

const manyConversations = generateManyConversations(50);

export const VirtualScroll= {
  render: () => (
    <div
      className="flex min-h-[860px] items-center justify-center bg-background p-6"
      data-theme="light"
    >
      <div className="h-[820px] w-[390px] overflow-hidden rounded-[2rem] border-8 border-gray-800 bg-background shadow-2xl">
        <ConfigProvider
          config={{
            language: { code: LanguageCodeEnum.ZhCN },
            theme: { mode: ThemeModeEnum.Light },
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
          <ServiceProvider
            conversationService={{
              async list() {
                return manyConversations;
              },
              async get() {
                return manyConversations[0];
              },
              async create() {
                return manyConversations[0];
              },
              async query() {
                return manyConversations[0];
              },
              async getUnreadCount() {
                return {
                  [ChannelTypeEnum.WhatsApp]: 25,
                  [ChannelTypeEnum.SMS]: 12,
                  [ChannelTypeEnum.Viber]: 8,
                  [ChannelTypeEnum.Email]: 5,
                };
              },
            }}
            messageService={{
              async list() {
                return [];
              },
              async send() {
                return {
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                };
              },
              async markAsRead() {
                return undefined;
              },
              sendAttachment() {
                return Promise.resolve({
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                });
              },
              sendAudio() {
                return Promise.resolve({
                  type: MessageTypeEnum.Audio,
                  tempId: `tmp-${Date.now()}`,
                  messageId: `msg-${Date.now()}`,
                  status: MessageStatusEnum.Sent,
                });
              },
              subscribeToMessages() {
                return () => undefined;
              },
              subscribeToMessageStatus() {
                return () => undefined;
              },
            }}
            templateService={{
              async list() {
                return [];
              },
              async preview() {
                return {
                  id: '',
                  name: '',
                  code: '',
                  content: '',
                  params: {},
                  previewContent: '',
                };
              },
            }}
          >
            <MobileListLayout
              renderItemMeta={(conv) => (
                <span className="text-xs text-muted-foreground">
                  {String(conv.metadata?.assetItemNumber ?? '')}
                </span>
              )}
              onSelectConversation={(id) => console.log('Selected:', id)}
            />
          </ServiceProvider>
        </ConfigProvider>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '虚拟滚动测试：50 条会话数据，验证虚拟滚动性能和滚动行为。',
      },
    },
  },
};
