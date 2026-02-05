import type { ReactNode } from 'react';
import { ComposerToolbarContainer } from '@/components/composer/ComposerToolbarContainer';
import { ConversationListContainer } from '@/components/conversation/ConversationListContainer';
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

export interface DefaultChatLayoutContainerProps {
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
 * DefaultChatLayoutContainer：默认布局容器组件（新架构）
 *
 * @description
 * 使用 React Query Hooks 和容器组件的默认布局。
 * 这是新架构的推荐使用方式。
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ReactQueryProvider>
 *       <ServiceProvider {...services}>
 *         <DefaultChatLayoutContainer conversationId="conv-123">
 *           <ChatMessageListContainer conversationId="conv-123" />
 *         </DefaultChatLayoutContainer>
 *       </ServiceProvider>
 *     </ReactQueryProvider>
 *   );
 * }
 * ```
 */
export function DefaultChatLayoutContainer({
  children,
}: DefaultChatLayoutContainerProps) {
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
          <ConversationListContainer
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
      {/* 消息区域由 ChatMessageList 渲染 */}
      {children}
    </ChatLayout>
  );
}
