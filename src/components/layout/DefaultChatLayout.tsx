import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react';
import type { ComposerToolbarRef } from '@/components/composer/ComposerToolbar';
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
import {
  useActions,
  useComposerConfig,
  useConversation,
  useProfile,
  useStrategy,
} from '@/store';
import { cn } from '@/utils/class.util';
import { ChatLayout } from './ChatLayout';

export interface DefaultChatLayoutRenderTopbarProps {
  /** 计算后的标题文案 */
  title: string;
  /** 计算后的副标题文案 */
  subtitle?: string;
  /** 默认右侧工具区（含语言/主题等），可直接复用 */
  extra: React.ReactNode;
  /** 默认的 Topbar 组件，方便在外部包一层再渲染 */
  TopbarComponent: typeof Topbar;
}

export type DefaultChatLayoutRenderTopbar =
  | React.ReactNode
  | ((props: DefaultChatLayoutRenderTopbarProps) => React.ReactNode);

export interface DefaultChatLayoutProps {
  className?: string;
  style?: React.CSSProperties;
  extraTools?: React.ReactNode;
  /**
   * 顶部栏自定义渲染：
   * - 直接传入 ReactNode：完全自定义
   * - 传入函数：在保持默认 Topbar 行为的基础上包一层（例如增加拖拽区域）
   */
  renderTopbar?: DefaultChatLayoutRenderTopbar;
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
  extraTools,
  renderTopbar,
  className,
  style,
}: DefaultChatLayoutProps) {
  const { t } = useTranslation();
  const actions = useActions();
  const { profile } = useProfile();
  const sendMessage = useSendMessage();
  const { templateMode } = useComposerConfig();
  const { data: conversations = [] } = useConversations();
  const { activeChannel, allowedChannels } = useStrategy();
  const { activeConversationId, searchQuery } = useConversation();

  // Composer ref，用于外部控制输入框
  const composerRef = useRef<ComposerToolbarRef>(null);
  // 使用 useTransition 标记搜索过滤为过渡更新（低优先级）
  const [isPending, startTransition] = useTransition();

  // 自动选中第一个会话
  useEffect(() => {
    // 如果当前没有选中会话，且会话列表已加载且不为空
    if (!activeConversationId && conversations && conversations.length > 0) {
      actions.setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, actions]);

  // 从会话列表中找到当前激活的会话
  const activeConversation = useMemo(
    () =>
      conversations?.find(
        (conversation) => conversation.id === activeConversationId,
      ),
    [activeConversationId, conversations],
  );
  // 计算 title：如果有激活的会话，显示用户名；否则显示默认标题
  const title = activeConversation
    ? (activeConversation?.user?.name ?? t('conversation.title'))
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
      // 搜索提交时，立即更新搜索关键词
      actions.setSearchQuery(value);
    },
    [actions],
  );
  /**
   * 处理模板选择
   * 根据 templateMode 配置决定行为：
   * - direct: 直接发送模板消息
   * - edit: 将模板内容填充到输入框，用户可编辑后发送
   */
  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      if (!activeConversationId) {
        return;
      }

      if (templateMode === 'direct') {
        // 模式 1：直接发送
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
      } else {
        // 模式 2：填充到输入框，并传递 templateId
        composerRef.current?.setValue(template.content, template.id);
        composerRef.current?.focus();
      }
    },
    [activeConversationId, sendMessage, templateMode],
  );
  const defaultTopbarExtra = useMemo(
    () => <TopbarTools extra={extraTools} />,
    [extraTools],
  );

  const topbarNode = useMemo(() => {
    // 函数形式：外部拿到默认 Topbar 所需的参数与组件，自行决定如何包裹（例如加拖动区域）
    if (typeof renderTopbar === 'function') {
      return renderTopbar({
        title,
        subtitle,
        extra: defaultTopbarExtra,
        TopbarComponent: Topbar,
      });
    }

    // 兼容老用法：直接传入 ReactNode
    if (renderTopbar) {
      return renderTopbar;
    }

    // 默认实现
    return (
      <Topbar title={title} subtitle={subtitle} extra={defaultTopbarExtra} />
    );
  }, [defaultTopbarExtra, renderTopbar, subtitle, title]);

  return (
    <ChatLayout
      className={cn('max-w-350 h-[80vh]', className)}
      style={style}
      topbar={topbarNode}
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
            className={cn(
              'transition',
              isPending ? 'opacity-80' : 'opacity-100',
            )}
            conversations={filteredConversations}
            onSelect={actions.setActiveConversationId}
          />
        </ConversationPanel>
      }
      composer={
        activeConversationId ? (
          <ComposerWithSend
            ref={composerRef}
            conversationId={activeConversationId}
            channel={activeChannel}
          />
        ) : null
      }
      profilePanel={
        <aside className="flex flex-col w-75 shrink-0 border-l border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
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
