import type { ReactNode } from 'react';
import { ComposerToolbarContainer } from '@/components/composer/ComposerWithSend';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { Profile } from '@/components/profile/Profile';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { Topbar } from '@/components/toolbar/Topbar';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
import { useConversations } from '@/hooks/use-conversations.hook';
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActions, useConversation, useProfile, useStrategy } from '@/store';
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
  const { data: conversations } = useConversations();

  // 获取当前激活的会话 ID
  const activeConversationId = conversation.activeConversationId;

  // 从会话列表中找到当前激活的会话
  const activeConversation = conversations?.find(
    (c) => c.id === activeConversationId,
  );

  // 计算 title：如果有激活的会话，显示用户名；否则显示默认标题
  const title = activeConversation
    ? activeConversation.user.name
    : t('conversation.title');

  // 计算 subtitle：如果有激活的会话，显示"渠道 · 状态"；否则显示当前渠道
  const subtitle = activeConversation
    ? `${t(`toolbar.channel.${activeConversation.channel}`)} · ${t(`conversation.status.${activeConversation.status || 'active'}`)}`
    : strategy.activeChannel;

  return (
    <ChatLayout
      className="max-w-[1400px] max-h-[85vh]"
      topbar={
        <Topbar
          title={title}
          subtitle={subtitle}
          avatarUrl={activeConversation?.user.avatarUrl}
          extra={<TopbarTools />}
        />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader title={t('title')}>
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
