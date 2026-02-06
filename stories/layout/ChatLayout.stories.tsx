import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { Profile } from '@/components/profile/Profile';
import { LanguageSwitcher } from '@/components/toolbar/LanguageSwitcher';
import { NetworkStatus } from '@/components/toolbar/NetworkStatus';
import { ThemeSwitcher } from '@/components/toolbar/ThemeSwitcher';
import { Topbar } from '@/components/toolbar/Topbar';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { NetworkStatusEnum } from '@/interfaces/network.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import '@/styles/theme.css';

/**
 * ChatLayout 组件 Story 文档
 *
 * ## 组件说明
 * ChatLayout 是一个三栏布局容器，用于构建聊天界面。
 *
 * ## 布局结构
 * - 左侧：会话列表（可选）
 * - 中间：顶部栏 + 消息区域 + 输入区域
 * - 右侧：上下文面板（可选，仅在大屏幕显示）
 *
 * ## Props
 * - `conversationPanel`: 左侧会话列表
 * - `topbar`: 顶部栏
 * - `children`: 消息区域内容
 * - `composer`: 输入区域
 * - `profilePanel`: 右侧上下文面板
 * - `className`: 自定义类名
 * - `styles`: 自定义样式
 */

const meta: Meta<typeof ChatLayout> = {
  title: 'Layout/ChatLayout',
  component: ChatLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    className: {
      control: 'text',
      description: '自定义类名',
    },
    style: {
      control: 'object',
      description: '自定义样式',
    },
    conversationPanel: {
      control: false,
      description: '左侧会话列表',
    },
    topbar: {
      control: false,
      description: '顶部栏',
    },
    children: {
      control: false,
      description: '消息区域',
    },
    composer: {
      control: false,
      description: '中间输入区域',
    },
    profilePanel: {
      control: false,
      description: '右侧上下文面板',
    },
  },
};

export default meta;
// biome-ignore lint: Used for Storybook type inference
type Story = StoryObj<typeof ChatLayout>;

// Mock 数据
const mockConversations = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: '张三',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      status: AgentStatusEnum.Online,
    },
    lastMessage: '你好，有什么可以帮助你的吗？',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
    channel: ChannelTypeEnum.Waba,
    isActive: true,
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: '李四',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      status: AgentStatusEnum.Offline,
    },
    lastMessage: '我想查询一下订单状态',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.Waba,
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: '王五',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      status: AgentStatusEnum.Online,
    },
    lastMessage: '好的，谢谢',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.Waba,
  },
];

const mockMessages = [
  {
    id: '1',
    tempId: 'temp1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.Waba,
    status: MessageStatusEnum.Sent,
    timestamp: Date.now() - 1000 * 60 * 5,
    type: MessageTypeEnum.Text,
    content: { text: '你好！有什么可以帮助你的吗？' },
    receiver: { id: 'user1', channelType: ChannelTypeEnum.Waba },
  },
  {
    id: '2',
    tempId: 'temp2',
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.Waba,
    status: MessageStatusEnum.Sent,
    timestamp: Date.now() - 1000 * 60 * 4,
    type: MessageTypeEnum.Text,
    content: { text: '我想查询一下订单状态' },
    receiver: { id: 'user1', channelType: ChannelTypeEnum.Waba },
  },
];

const mockProfile = {
  id: 'user1',
  name: '张三',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  email: 'zhangsan@example.com',
  phone: '138****8888',
  tags: ['VIP', '活跃用户'],
};

/**
 * 完整布局
 * - 包含所有面板：会话列表、顶部栏、消息区域、输入区域、上下文面板
 * - 使用内置组件
 */
export const FullLayout = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[700px] w-full max-w-7xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            conversationPanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">会话列表</h3>
                </div>
                <ConversationList conversations={mockConversations} />
              </div>
            }
            topbar={
              <Topbar
                title="张三"
                subtitle="在线"
                avatarUrl="https://i.pravatar.cc/150?img=1"
                extra={
                  <div className="flex items-center gap-2">
                    <NetworkStatus status={NetworkStatusEnum.Connected} />
                    <ThemeSwitcher
                      value={ThemeModeEnum.Light}
                      onChange={() => {}}
                    />
                    <LanguageSwitcher
                      value={LanguageCodeEnum.ZhCN}
                      onChange={() => {}}
                    />
                  </div>
                }
              />
            }
            profilePanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">客户信息</h3>
                </div>
                <Profile profile={mockProfile} />
              </div>
            }
            composer={
              <ComposerToolbar
                channel={ChannelTypeEnum.Waba}
                onSend={async (message) => {
                  console.log('Send message:', message);
                }}
              />
            }
          >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
              {mockMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 仅会话列表和消息区域
 * - 适合移动端或简化视图
 */
export const WithConversationPanel = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-5xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            conversationPanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">会话列表</h3>
                </div>
                <ConversationList conversations={mockConversations} />
              </div>
            }
          >
            <div className="flex h-full items-center justify-center text-text">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">消息区域</h2>
                <p className="text-sm text-muted-foreground">
                  带会话列表的布局
                </p>
              </div>
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 带顶部栏和输入区域
 * - 标准聊天界面布局
 * - 使用内置组件
 */
export const WithTopbarAndComposer = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            topbar={
              <Topbar
                title="张三"
                subtitle="在线"
                avatarUrl="https://i.pravatar.cc/150?img=1"
                extra={
                  <div className="flex items-center gap-2">
                    <NetworkStatus status={NetworkStatusEnum.Connected} />
                    <ThemeSwitcher
                      value={ThemeModeEnum.Light}
                      onChange={() => {}}
                    />
                  </div>
                }
              />
            }
            composer={
              <ComposerToolbar
                channel={ChannelTypeEnum.Waba}
                onSend={async (message) => {
                  console.log('Send message:', message);
                }}
              />
            }
          >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
              {mockMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 仅右侧上下文面板
 * - 适合展示详细信息或辅助功能
 * - 使用内置 Profile 组件
 */
export const WithProfilePanel = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-5xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            profilePanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">客户信息</h3>
                </div>
                <Profile profile={mockProfile} />
              </div>
            }
          >
            <div className="flex h-full items-center justify-center text-text">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">消息区域</h2>
                <p className="text-sm text-muted-foreground">
                  带右侧上下文面板的布局
                </p>
              </div>
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 自定义样式
 * - 展示如何使用 className 和 styles 自定义外观
 */
export const CustomStyled = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            className="border-primary bg-gradient-to-br from-primary/5 to-primary/10"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            topbar={
              <Topbar
                title="自定义样式示例"
                subtitle="使用内置组件"
                extra={
                  <div className="flex items-center gap-2">
                    <ThemeSwitcher
                      value={ThemeModeEnum.Light}
                      onChange={() => {}}
                    />
                  </div>
                }
              />
            }
            composer={
              <ComposerToolbar
                channel={ChannelTypeEnum.Waba}
                onSend={async (message) => {
                  console.log('Send message:', message);
                }}
              />
            }
          >
            <div className="flex h-full items-center justify-center text-text">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-primary">
                  自定义样式示例
                </h2>
                <p className="text-sm text-muted-foreground">
                  使用 className 和 styles 自定义外观
                </p>
              </div>
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 响应式布局
 * - 展示在不同屏幕尺寸下的表现
 * - 右侧面板仅在大屏幕显示
 */
export const Responsive = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-7xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            conversationPanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">会话列表</h3>
                </div>
                <ConversationList conversations={mockConversations} />
              </div>
            }
            topbar={
              <Topbar
                title="响应式布局"
                subtitle="调整窗口大小查看效果"
                extra={
                  <NetworkStatus
                    status={NetworkStatusEnum.Connected}
                    showLabel
                  />
                }
              />
            }
            profilePanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">
                    上下文面板（大屏幕显示）
                  </h3>
                </div>
                <Profile profile={mockProfile} />
              </div>
            }
            composer={
              <ComposerToolbar
                channel={ChannelTypeEnum.Waba}
                onSend={async (message) => {
                  console.log('Send message:', message);
                }}
              />
            }
          >
            <div className="flex h-full items-center justify-center text-text">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">消息区域</h2>
                <p className="text-sm text-muted-foreground">
                  调整浏览器窗口大小查看响应式效果
                </p>
              </div>
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 空状态
 * - 展示没有消息时的状态
 */
export const EmptyState = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ChatContainer locale={LanguageCodeEnum.ZhCN}>
          <ChatLayout
            conversationPanel={
              <div className="flex h-full flex-col bg-muted/30">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text">会话列表</h3>
                </div>
                <ConversationList conversations={[]} />
              </div>
            }
            topbar={<Topbar title="选择一个会话" />}
          >
            <div className="flex h-full items-center justify-center text-text">
              <div className="text-center">
                <div className="mb-4 text-6xl">💬</div>
                <h2 className="mb-2 text-xl font-semibold">开始聊天</h2>
                <p className="text-sm text-muted-foreground">
                  从左侧选择一个会话开始对话
                </p>
              </div>
            </div>
          </ChatLayout>
        </ChatContainer>
      </div>
    </div>
  );
};
