import { useCallback, useMemo, useTransition } from 'react';
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import { Profile } from '@/components/profile/Profile';
import { TemplatePanel } from '@/components/template/TemplatePanel';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { Topbar } from '@/components/toolbar/Topbar';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActions, useConversation, useProfile, useStrategy } from '@/store';
import { cn } from '@/utils/class.util';
import { ChatLayout } from './ChatLayout';

export interface DefaultChatLayoutProps {
  className?: string;
  style?: React.CSSProperties;
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
 *     <QueryProvider>
 *       <ServiceProvider {...services}>
 *         <DefaultChatLayout>
 *           <InfiniteMessageList conversationId="conv-123" />
 *         </DefaultChatLayout>
 *       </ServiceProvider>
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function DefaultChatLayout({
  className,
  style,
}: DefaultChatLayoutProps) {
  const { t } = useTranslation();
  const actions = useActions();
  const { activeChannel, allowedChannels } = useStrategy();
  const { profile } = useProfile();
  const sendMessage = useSendMessage();
  const { data: conversations = [] } = useConversations();
  const { activeConversationId, searchQuery } = useConversation();

  // 使用 useTransition 标记搜索过滤为过渡更新（低优先级）
  const [isPending, startTransition] = useTransition();

  // 从会话列表中找到当前激活的会话
  const activeConversation = useMemo(
    () =>
      conversations?.find(
        (conversation) => conversation.id === activeConversationId,
      ),
    [activeConversationId, conversations?.find],
  );
  // 计算 title：如果有激活的会话，显示用户名；否则显示默认标题
  const title = activeConversation
    ? activeConversation.user.name
    : t('conversation.title');
  // 计算 subtitle：如果有激活的会话，显示"渠道 · 状态"；否则显示当前渠道
  const subtitle = activeConversation
    ? `${t(`toolbar.channel.${activeConversation.channel}`)} · ${t(`conversation.status.${activeConversation.status || 'active'}`)}`
    : activeChannel;

  // 搜索过滤逻辑（使用 startTransition 标记为过渡更新）
  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return conversations;
    }

    const query = searchQuery.toLowerCase().trim();

    return conversations.filter((conversation: Conversation) => {
      // 搜索用户名
      const userName = conversation.user.name?.toLowerCase() || '';
      // 搜索最后一条消息
      const lastMessage = conversation.lastMessage?.toLowerCase() || '';
      // 搜索会话 ID
      const conversationId = conversation.id?.toLowerCase() || '';

      return (
        userName.includes(query) ||
        lastMessage.includes(query) ||
        conversationId.includes(query)
      );
    });
  }, [conversations, searchQuery]);

  // 搜索回调（使用 startTransition 标记为过渡更新）
  const handleSearchChange = useCallback(
    (value: string) => {
      // 使用 startTransition 标记状态更新为低优先级
      // 这样可以确保输入框的更新优先于搜索过滤
      startTransition(() => {
        actions.setSearchQuery(value);
      });
    },
    [actions],
  );
  const handleSearchSubmit = useCallback(
    (value: string) => {
      console.log('搜索会话:', value);
      // 搜索提交时，立即更新搜索关键词
      actions.setSearchQuery(value);
    },
    [actions],
  );
  /**
   * TODO: 这里需要支持 2 种模式
   * 1. 点击模版后直接发送。（当前模式）
   * 2. 点击模版后将文案输出到 Composer 输入框，然后用户自己决定修改后发或者直接发
   */
  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      if (!activeConversationId) {
        return;
      }

      try {
        await sendMessage.mutateAsync({
          conversationId: activeConversationId,
          content: template.content,
          extra: {
            templateId: template.id,
            templateName: template.name,
            templateCategory: template.category,
          },
        });
      } catch (error) {
        console.error('Failed to send template message:', error);
      }
    },
    [activeConversationId, sendMessage],
  );

  return (
    <ChatLayout
      className={cn('max-w-[1400px] h-[80vh]', className)}
      style={style}
      topbar={
        <Topbar title={title} subtitle={subtitle} extra={<TopbarTools />} />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader
              title={t('title')}
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
            >
              {allowedChannels.length > 1 && (
                <ChannelFilter
                  channels={allowedChannels}
                  activeChannel={activeChannel}
                  onChannelClick={actions.setActiveChannel}
                />
              )}
            </ConversationHeader>
          }
        >
          <ConversationList
            className={cn(isPending ? 'animate-pulse' : '')}
            conversations={filteredConversations}
            onSelect={actions.setActiveConversationId}
          />
        </ConversationPanel>
      }
      composer={
        activeConversationId ? (
          <ComposerWithSend
            conversationId={activeConversationId}
            channel={activeChannel}
          />
        ) : null
      }
      profilePanel={
        <aside className="flex flex-col w-[300px] shrink-0 border-l border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
          {profile && <Profile profile={profile} />}
          <TemplatePanel onTemplateSelect={handleTemplateSelect} />
        </aside>
      }
    >
      {/* 消息区域由 MessageList 渲染 */}
      <InfiniteMessageList conversationId={activeConversationId as string} />
    </ChatLayout>
  );
}
