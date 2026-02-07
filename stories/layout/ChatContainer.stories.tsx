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
import { ConfigProvider } from '@/providers/config.provider';
import { useActions, useLanguage, useTheme } from '@/store';
import '@/styles/theme.css';

/**
 * ChatContainer 组件 Story 文档
 *
 * ## 组件说明
 * ChatContainer 是 SDK 的根容器，负责：
 * - 提供全局状态管理（Zustand Store）
 * - 提供国际化支持（I18n）
 * - 支持多种使用模式
 *
 * ## 使用模式
 *
 * ### 1. Headless 模式（完全自定义）
 * 直接传入自定义组件，完全控制 UI
 *
 * ### 2. Compound 模式（部分自定义）
 * 使用 ChatLayout 组合各个子组件
 *
 * ### 3. Render Props 模式（显式传递状态）
 * 通过函数接收 store，访问全局状态
 *
 * ## Props
 * - `children`: 子组件或 render props 函数
 *
 * ## 语言设置
 * 使用 ConfigProvider 包裹 ChatContainer 来设置语言：
 * ```tsx
 * <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
 *   <ChatContainer>...</ChatContainer>
 * </ConfigProvider>
 * ```
 */

const meta: Meta<typeof ChatContainer> = {
  title: 'Layout/ChatContainer',
  component: ChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    children: {
      control: false,
      description: '子组件或 render props 函数',
    },
  },
};

export default meta;
// biome-ignore lint: Used for Storybook type inference
type Story = StoryObj<typeof ChatContainer>;

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
 * 默认容器
 * - 使用默认语言（自动检测）
 * - 简单的内容展示
 */
export const Default = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ChatContainer>
          <div className="flex h-full items-center justify-center rounded-3xl border border-border bg-card/80 p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-text">
                ChatContainer 默认示例
              </h2>
              <p className="text-muted-foreground">
                使用默认语言设置（自动检测浏览器语言）
              </p>
            </div>
          </div>
        </ChatContainer>
      </div>
    </div>
  );
};

/**
 * 中文语言环境
 * - 显式设置中文语言
 * - 展示中文界面
 * - 使用内置组件
 */
export const ChineseLocale = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-5xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
          <ChatContainer>
            <ChatLayout
              topbar={
                <Topbar
                  title="中文聊天界面"
                  subtitle="使用内置组件"
                  avatarUrl="https://i.pravatar.cc/150?img=1"
                  extra={
                    <div className="flex items-center gap-2">
                      <NetworkStatus status={NetworkStatusEnum.Connected} />
                      <LanguageSwitcher
                        value={LanguageCodeEnum.ZhCN}
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
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * 英文语言环境
 * - 显式设置英文语言
 * - 展示英文界面
 * - 使用内置组件
 */
export const EnglishLocale = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-5xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.EnUS } }}>
          <ChatContainer>
            <ChatLayout
              topbar={
                <Topbar
                  title="English Chat Interface"
                  subtitle="Using built-in components"
                  avatarUrl="https://i.pravatar.cc/150?img=1"
                  extra={
                    <div className="flex items-center gap-2">
                      <NetworkStatus status={NetworkStatusEnum.Connected} />
                      <LanguageSwitcher
                        value={LanguageCodeEnum.EnUS}
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
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * Headless 模式
 * - 完全自定义 UI
 * - 只使用容器提供的功能
 */
export const HeadlessMode = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
          <ChatContainer>
            <div className="flex h-full flex-col rounded-3xl border-2 border-dashed border-border bg-card/40 p-8">
              <div className="mb-4 text-center">
                <h2 className="mb-2 text-2xl font-bold text-text">
                  Headless 模式
                </h2>
                <p className="text-sm text-muted-foreground">
                  完全自定义 UI，只使用容器提供的功能
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
                  <p className="text-center text-text">
                    在这里构建你自己的聊天界面
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-text">
                      自定义消息气泡 1
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3 text-sm text-text self-end">
                      自定义消息气泡 2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChatContainer>
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * Render Props 模式
 * - 通过函数接收 store
 * - 访问全局状态和方法
 */
export const RenderPropsMode = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
          <ChatContainer>
            {(store) => (
              <ChatLayout
                topbar={
                  <Topbar
                    title="Render Props 模式"
                    subtitle="访问全局状态"
                    extra={
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
                          Theme: {store.theme.mode}
                        </span>
                        <ThemeSwitcher
                          value={store.theme.mode}
                          onChange={(mode) => {
                            store.actions.setTheme(mode);
                          }}
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
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm">当前输入内容：</p>
                    <p className="mt-1 font-medium">{'Empty content'}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <p className="text-sm">当前语言：</p>
                    <p className="mt-1 font-medium">{store.language.code}</p>
                  </div>
                </div>
              </ChatLayout>
            )}
          </ChatContainer>
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * 完整聊天界面
 * - 包含所有功能模块
 * - 展示完整的聊天体验
 * - 使用内置组件
 */
export const FullChatInterface = () => {
  const { mode } = useTheme();
  const { code } = useLanguage();
  const { setLanguage, setTheme } = useActions();

  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[700px] w-full max-w-7xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
          <ChatContainer>
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
                      <ThemeSwitcher value={mode} onChange={setTheme} />
                      <LanguageSwitcher value={code} onChange={setLanguage} />
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
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * 语言切换对比
 * - 并排展示中英文界面
 * - 方便对比不同语言的效果
 * - 使用内置组件
 */
export const LanguageComparison = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 中文版本 */}
          <ConfigProvider
            config={{ language: { code: LanguageCodeEnum.ZhCN } }}
          >
            <ChatContainer>
              <ChatLayout
                topbar={
                  <Topbar
                    title="中文界面"
                    subtitle="locale=zh-CN"
                    extra={
                      <LanguageSwitcher
                        value={LanguageCodeEnum.ZhCN}
                        onChange={() => {}}
                      />
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
          </ConfigProvider>

          {/* 英文版本 */}
          <ConfigProvider
            config={{ language: { code: LanguageCodeEnum.EnUS } }}
          >
            <ChatContainer>
              <ChatLayout
                topbar={
                  <Topbar
                    title="English Interface"
                    subtitle="locale=en-US"
                    extra={
                      <LanguageSwitcher
                        value={LanguageCodeEnum.EnUS}
                        onChange={() => {}}
                      />
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
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};

/**
 * 自定义样式
 * - 展示如何在容器中自定义样式
 * - 结合 ChatContainer 和自定义样式
 */
export const CustomStyled = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-4xl">
        <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
          <ChatContainer>
            <ChatLayout
              className="border-primary bg-gradient-to-br from-primary/5 to-primary/10"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              topbar={
                <Topbar
                  title="自定义样式"
                  subtitle="使用内置组件"
                  extra={
                    <ThemeSwitcher
                      value={ThemeModeEnum.Light}
                      onChange={() => {}}
                    />
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
                    在 ChatContainer 中使用自定义样式
                  </p>
                </div>
              </div>
            </ChatLayout>
          </ChatContainer>
        </ConfigProvider>
      </div>
    </div>
  );
};

/**
 * 嵌套容器
 * - 展示如何在应用中使用多个容器
 * - 每个容器可以有独立的语言设置
 */
export const NestedContainers = () => {
  return (
    <div className="flex h-[800px] items-center justify-center bg-background p-4">
      <div className="h-[600px] w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 第一个容器 - 中文 */}
          <ConfigProvider
            config={{ language: { code: LanguageCodeEnum.ZhCN } }}
          >
            <ChatContainer>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-card/80 p-6 shadow-xl">
                <Topbar
                  title="中文容器"
                  subtitle="locale=zh-CN"
                  extra={
                    <LanguageSwitcher
                      value={LanguageCodeEnum.ZhCN}
                      onChange={() => {}}
                    />
                  }
                />
                <div className="flex-1 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-center text-sm text-text">
                    这是第一个 ChatContainer
                  </p>
                </div>
              </div>
            </ChatContainer>
          </ConfigProvider>

          {/* 第二个容器 - 英文 */}
          <ConfigProvider
            config={{ language: { code: LanguageCodeEnum.EnUS } }}
          >
            <ChatContainer>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-card/80 p-6 shadow-xl">
                <Topbar
                  title="English Container"
                  subtitle="locale=en-US"
                  extra={
                    <LanguageSwitcher
                      value={LanguageCodeEnum.EnUS}
                      onChange={() => {}}
                    />
                  }
                />
                <div className="flex-1 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-center text-sm text-text">
                    This is the second ChatContainer
                  </p>
                </div>
              </div>
            </ChatContainer>
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};
