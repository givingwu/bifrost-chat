import type { ReactNode } from 'react';
import { ComposerToolbarContainer } from '@/components/composer/ComposerWithSend';
import { ConversationList } from '@/components/conversation/ConversationList';
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActions, useConversation, useProfile, useStrategy } from '@/store';
import { ConversationHeader } from '../conversation/ConversationHeader';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { Profile } from '../profile/Profile';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { Topbar } from '../toolbar/Topbar';
import { TopbarTools } from '../toolbar/TopbarTools';
import { ChatLayout } from './ChatLayout';

export interface DefaultChatLayoutProps {
  /** 消息区域内容（可选） */
  children?: ReactNode;
}

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
  const { t } = useTranslation();
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
        <Topbar
          title={t('title')}
          subtitle={strategy.activeChannel}
          extra={<TopbarTools />}
        />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader title={t('conversation.title')}>
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
