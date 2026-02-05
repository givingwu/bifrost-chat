import type { ReactNode } from 'react';
import { ComposerToolbarContainer } from '@/components/composer/ComposerWithSend';
import { ConversationList } from '@/components/conversation/ConversationList';
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import {
  useActions,
  useConversation,
  useLanguage,
  useNetwork,
  useProfile,
  useStrategy,
  useTheme,
} from '@/store';
import { ConversationHeader } from '../conversation/ConversationHeader';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { Profile } from '../profile/Profile';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { NetworkStatus } from '../toolbar/NetworkStatus';
import { ThemeSwitcher } from '../toolbar/ThemeSwitcher';
import { ChatLayout } from './ChatLayout';
import { ChatTopbar } from './ChatTopbar';

export interface DefaultChatLayoutProps {
  /** 消息区域内容（可选） */
  children?: ReactNode;
}

export const DefaultTools = () => {
  const { status } = useNetwork();
  const { mode } = useTheme();
  const { code } = useLanguage();
  const { setTheme, setLanguage } = useActions();

  return (
    <div className="flex items-center gap-4">
      <NetworkStatus status={status} />

      <div className="flex gap-1">
        <LanguageSwitcher value={code} onChange={setLanguage} />
        <ThemeSwitcher value={mode} onChange={setTheme} />
      </div>
    </div>
  );
};

/**
 * DefaultChatLayout：默认布局组件
 *
 * @description
 * 完整的聊天布局，包含会话列表、消息区域、输入框和右侧面板。
 * 使用 React Query Hooks 和 Zustand Store 进行状态管理。
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ReactQueryProvider>
 *       <ServiceProvider {...services}>
 *         <DefaultChatLayout>
 *           <InfiniteMessageList conversationId="conv-123" />
 *         </DefaultChatLayout>
 *       </ServiceProvider>
 *     </ReactQueryProvider>
 *   );
 * }
 * ```
 */
export function DefaultChatLayout({ children }: DefaultChatLayoutProps) {
  const strategy = useStrategy();
  const conversation = useConversation();
  const profileState = useProfile();
  const actions = useActions();

  // 从 conversation ID 获取会话数据（这里需要从 React Query 获取）
  // 暂时使用 activeConversationId，实际应该从 useConversations Hook 获取
  const activeConversationId = conversation.activeConversationId;

  return (
    <ChatLayout
      className="max-w-[1400px] max-h-[85vh]"
      topbar={
        <ChatTopbar
          title={
            activeConversationId ? `会话 ${activeConversationId}` : undefined
          }
          subtitle={strategy.activeChannel}
          extra={<DefaultTools />}
        />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader
              title={
                activeConversationId
                  ? `会话 ${activeConversationId}`
                  : undefined
              }
            >
              <ChannelFilter
                channels={AvailableChannelTypes}
                activeChannel={strategy.activeChannel}
                onChannelClick={actions.setActiveChannel}
              />
            </ConversationHeader>
          }
        >
          <ConversationList
            onSelect={(id) => actions.setActiveConversationId(id)}
          />
        </ConversationPanel>
      }
      composer={
        activeConversationId ? (
          <ComposerToolbarContainer
            conversationId={activeConversationId}
            channel={strategy.activeChannel}
          />
        ) : null
      }
      profilePanel={<Profile profile={profileState.profile} />}
    >
      {/* 消息区域由 MessageList 渲染 */}
      {children}
    </ChatLayout>
  );
}
