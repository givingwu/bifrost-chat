import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Composer, type ComposerRef } from '@/components/composer/Composer';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import { Profile, type ProfileAction } from '@/components/profile/Profile';
import { TemplatePanel } from '@/components/template/TemplatePanel';
import { Topbar } from '@/components/toolbar/Topbar';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
import { useActiveConversationMetadata } from '@/hooks/use-active-conversation-metadata.hook';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useMessageStatusSync } from '@/hooks/use-message-status-sync.hook';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import { useTemplatePreview } from '@/hooks/use-template-preview.hook';
import { useTotalUnread } from '@/hooks/use-total-unread.hook';
import { useUnreadSync } from '@/hooks/use-unread-sync.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import type { TemplatePreviewResult } from '@/services/core/template.service';
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
  /** 当前激活会话（供宿主在 renderTopbar / renderMeta 中访问会话元数据） */
  conversation?: Conversation;
  /**
   * 自定义渲染元数据区域
   * 在标题和副标题之间渲染
   */
  renderMeta?: (conversation?: Conversation) => React.ReactNode;
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
  /**
   * 全量未读总数变化回调（所有会话的未读之和）
   * 便于业务方做标题栏徽章、埋点等
   */
  onTotalUnreadChange?: (total: number) => void;
  /**
   * 客户画像头部快捷操作按钮
   * 不传则不渲染按钮栏
   *
   * @example
   * ```tsx
   * profileActions={[
   *   { icon: <Phone className="h-4 w-4" />, label: '拨打电话', onClick: () => callPhone(profile?.phone) },
   *   { icon: <Mail  className="h-4 w-4" />, label: '发送邮件', onClick: () => openMail(profile?.email) },
   * ]}
   * ```
   */
  profileActions?: ProfileAction[];
  /**
   * 自定义渲染会话列表项的元数据区域
   * 在人名和最后消息之间渲染
   * @example
   * ```tsx
   * renderConversationItemMeta={(conv) => (
   *   <div className="text-xs text-gray-500">
   *     <span>({conv.metadata?.relationship})</span>
   *     <span className="ml-2">{conv.metadata?.assetItemNumber}</span>
   *   </div>
   * )}
   * ```
   */
  renderConversationItemMeta?: (conversation: Conversation) => React.ReactNode;
  /**
   * 自定义渲染 Topbar 的元数据区域
   * 在标题和副标题之间渲染，接收当前激活会话作为参数。
   * 旧的无参用法（`() => ReactNode`）运行时不受影响。
   * @example
   * ```tsx
   * renderTopbarMeta={(conversation) => (
   *   <button
   *     className="text-xs text-blue-500 hover:underline"
   *     onClick={() => navigateToAsset(conversation?.metadata?.assetItemNumber)}
   *   >
   *     {conversation?.metadata?.assetItemNumber}
   *   </button>
   * )}
   * ```
   */
  renderTopbarMeta?: (conversation?: Conversation) => React.ReactNode;
  /**
   * 自定义会话列表项标题 formatter
   *
   * 左侧列表第一行 和 右侧 Topbar 标题同时使用此 formatter，实现两处展示统一。
   * 未传时回退到 `conversation.user.name`。
   *
   * @example
   * ```tsx
   * getConversationDisplayTitle={(conv) =>
   *   conv.metadata?.relationship
   *     ? `${conv.user.name}（${conv.metadata.relationship}）`
   *     : conv.user.name
   * }
   * ```
   */
  getConversationDisplayTitle?: (conversation: Conversation) => string;
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
  onTotalUnreadChange,
  profileActions,
  renderConversationItemMeta,
  renderTopbarMeta,
  getConversationDisplayTitle,
}: DefaultChatLayoutProps) {
  const actions = useActions();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { activeChannel } = useStrategy();
  const { templateMode } = useComposerConfig();
  const {
    data: conversations = [],
    isFetching: isConversationsFetching,
    isLoading: isConversationsLoading,
  } = useConversations();
  const { activeConversationId, searchQuery } = useConversation();

  // Composer ref，用于外部控制输入框
  const composerRef = useRef<ComposerRef>(null);
  // 使用 useTransition 标记搜索过滤为过渡更新（低优先级）
  const [isPending, startTransition] = useTransition();

  // 模板预览相关状态
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const [renderingTemplateId, setRenderingTemplateId] = useState<
    string | number | undefined
  >();

  // 后台静默同步会话元数据（supportedChannels 等）
  const { metadata: conversationMetadata } = useActiveConversationMetadata();
  // 初始化 useSendMessage 时传入 conversationMetadata
  const sendMessage = useSendMessage({ conversationMetadata });
  // 从会话列表中找到当前激活的会话
  const activeConversation = useMemo(
    () =>
      conversations?.find(
        (conversation) => conversation.id === activeConversationId,
      ),
    [activeConversationId, conversations],
  );
  // 计算 title：优先使用 getConversationDisplayTitle formatter；否则显示 user.name
  const title = activeConversation
    ? (getConversationDisplayTitle
        ? getConversationDisplayTitle(activeConversation)
        : (activeConversation?.user?.name ?? t('conversation.title')))
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
      // 搜索手机号/联系方式 (pin)
      const phone = String(conversation.metadata?.pin ?? '').toLowerCase();
      // 搜索资产编号 (assetItemNumber)
      const assetNumber = String(
        conversation.metadata?.assetItemNumber ?? '',
      ).toLowerCase();
      // 搜索债务人 ID (subjectId)
      const debtorId = String(
        conversation.metadata?.subjectId ?? '',
      ).toLowerCase();

      return (
        userName.includes(query) ||
        lastMessage.includes(query) ||
        conversationId.includes(query) ||
        phone.includes(query) ||
        assetNumber.includes(query) ||
        debtorId.includes(query)
      );
    });
  }, [conversations, searchQuery]);
  // 全量未读总数（基于完整会话列表，不随搜索筛选变化）
  const { totalUnread } = useTotalUnread();

  // 选会话时：仅设置激活 ID；未读数完全由 socket ACK 驱动（msg_receive_ack +1 / msg_read_ack -1）
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      actions.setActiveConversationId(conversationId);
    },
    [actions],
  );

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
   * 统一的消息发送处理函数
   * @param content 消息内容
   * @param options 可选的发送选项
   */
  const handleSend = useCallback(
    async (content: string, options?: Record<string, unknown>) => {
      if (!activeConversationId) {
        return;
      }

      await sendMessage.mutateAsync({
        conversationId: activeConversationId,
        content,
        options,
      });
    },
    [activeConversationId, sendMessage],
  );

  /**
   * 处理模板选择
   * 根据 templateMode 配置决定行为：
   * - direct: 直接发送模板消息
   * - edit: 调用 preview 获取预览内容后填充到输入框
   */
  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      if (!activeConversationId) {
        return;
      }

      // 设置渲染中状态
      setRenderingTemplateId(template.id);

      try {
        // 仅调用一次 preview：同时得到预览内容与 templateMetadata
        let contentToUse = template.content;
        let templateMetadata: TemplatePreviewResult | undefined;

        if (template.code) {
          try {
            templateMetadata = await previewTemplate({
              conversationId: activeConversationId,
              currentChannel: activeChannel,
              templateCode: template.code,
            });
            contentToUse = templateMetadata.previewContent;
          } catch (previewError) {
            console.warn(
              '[DefaultChatLayout] Template preview failed, using fallback content:',
              previewError,
            );
          }
        }

        if (templateMode === 'direct') {
          // 模式 1：直接发送（复用上方已取得的 templateMetadata）
          await handleSend(contentToUse, { templateMetadata });
        } else {
          // 模式 2：填充到输入框（复用上方已取得的 templateMetadata）
          composerRef.current?.setValue(
            contentToUse,
            template.code,
            templateMetadata,
          );
          composerRef.current?.focus();
        }
      } catch (error) {
        console.error('[DefaultChatLayout] Failed to handle template:', error);
      } finally {
        setRenderingTemplateId(undefined);
      }
    },
    [
      activeConversationId,
      activeChannel,
      previewTemplate,
      handleSend,
      templateMode,
    ],
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
        conversation: activeConversation,
        renderMeta: renderTopbarMeta
          ? () => renderTopbarMeta(activeConversation)
          : undefined,
      });
    }

    // 兼容老用法：直接传入 ReactNode
    if (renderTopbar) {
      return renderTopbar;
    }

    // 默认实现
    return (
      <Topbar
        title={title}
        subtitle={subtitle}
        extra={defaultTopbarExtra}
        renderMeta={
          renderTopbarMeta
            ? () => renderTopbarMeta(activeConversation)
            : undefined
        }
      />
    );
  }, [defaultTopbarExtra, renderTopbar, subtitle, title, renderTopbarMeta, activeConversation]);

  // 库内订阅 messageService 实时消息/状态，自动维护未读增量（无需订阅方注册）
  useUnreadSync();
  // 消息状态实时同步（ACK/已读），在布局顶层调用一次，避免多实例重复订阅
  useMessageStatusSync();
  // 当未读消息变化需要更新消息数量
  useEffect(() => {
    onTotalUnreadChange?.(totalUnread);
  }, [totalUnread, onTotalUnreadChange]);
  // 自动选中会话：初始加载或渠道切换时
  // 注意：conversations 已经由 useConversations 按当前渠道过滤
  // 三重幂等守卫，防止无效 store 写入触发循环：
  //   1. conversations 正在 fetch 时跳过（渠道切换竞态）
  //   2. 清空 activeId 前检查是否已经为空
  //   3. auto-select 前检查目标 id 是否和当前相同
  useEffect(() => {
    if (isConversationsFetching) return;

    if (!conversations || conversations.length === 0) {
      if (activeConversationId !== '') {
        actions.setActiveConversationId('');
      }
      return;
    }

    // 检查当前 activeConversationId 是否在会话列表中
    const exists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    );

    if (!exists) {
      const firstId = conversations[0].id;
      if (firstId !== activeConversationId) {
        actions.setActiveConversationId(firstId);
      }
    }
  }, [conversations, activeConversationId, actions, isConversationsFetching]);

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
            />
          }
        >
          <ConversationList
            className={cn(
              'transition-opacity duration-150',
              // 搜索过渡（低优先级更新）：轻微透明
              isPending && 'opacity-80',
              // 后台静默刷新（invalidate refetch）：轻微透明，不展示空态/骨架
              // isLoading（初始加载）时不加此样式，让列表保持 placeholderData 的旧数据可见
              !isConversationsLoading &&
                isConversationsFetching &&
                'opacity-60',
            )}
            conversations={filteredConversations}
            onSelect={handleSelectConversation}
            renderItemMeta={renderConversationItemMeta}
            getConversationDisplayTitle={getConversationDisplayTitle}
          />
        </ConversationPanel>
      }
      composer={
        activeConversationId ? (
          <Composer
            ref={composerRef}
            conversationId={activeConversationId}
            channel={activeChannel}
            onSend={handleSend}
          />
        ) : null
      }
      profilePanel={
        <aside className="flex flex-col w-75 shrink-0 border-l border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 divide-y divide-gray-200/50 dark:divide-white/10">
          {profile && <Profile profile={profile} actions={profileActions} />}
          <div className="flex flex-col flex-1 min-h-0">
            <TemplatePanel
              onTemplateSelect={handleTemplateSelect}
              conversationId={activeConversationId ?? undefined}
              currentChannel={activeChannel}
              renderingTemplateId={renderingTemplateId}
            />
          </div>
        </aside>
      }
    >
      {/* 消息区域由 MessageList 渲染 */}
      <InfiniteMessageList
        conversationId={activeConversationId as string}
        currentChannel={activeChannel}
      />
    </ChatLayout>
  );
}
