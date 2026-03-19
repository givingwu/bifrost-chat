import { useQueryClient } from '@tanstack/react-query';
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
import { ChatLayout } from '@/components/layout/ChatLayout';
import { UnsupportedChannelWarning } from '@/components/layout/UnsupportedChannelWarning';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import type { ProfileAction } from '@/components/profile/ProfileHeader';
import { ProfilePanel } from '@/components/profile/ProfilePanel';
import { Topbar, type TopbarProps } from '@/components/toolbar/Topbar';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
import { useActiveConversationMetadata } from '@/hooks/use-active-conversation-metadata.hook';
import { useComposerFocus } from '@/hooks/use-composer-focus.hook';
import { useConversationAutoSelect } from '@/hooks/use-conversation-auto-select.hook';
import { useConversationDetail } from '@/hooks/use-conversation-detail.hook';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useMessageStatusSync } from '@/hooks/use-message-status-sync.hook';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import { useTemplatePreview } from '@/hooks/use-template-preview.hook';
import { useTotalUnread } from '@/hooks/use-total-unread.hook';
import { useUnreadSync } from '@/hooks/use-unread-sync.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { TemplatePreviewResult } from '@/services/core/template.service';
import {
  useActions,
  useComposerConfig,
  useConversation,
  useProfile,
  useStrategy,
} from '@/store';
import { cn } from '@/utils/class.util';
import { filterConversations } from '@/utils/conversation-filter.util';
import {
  buildSubTitleNode,
  checkChannelSupport,
  getDisplayTitle,
  TRANSLATION_KEYS,
} from '@/utils/layout.util';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DefaultChatLayoutRenderTopbarProps
  extends Omit<TopbarProps, 'avatarUrl'> {
  TopbarComponent: typeof Topbar;
  /** 当前激活会话（供宿主在 renderTopbar / renderMeta 中访问会话元数据） */
  conversation?: Conversation;
}

export type DefaultChatLayoutRenderTopbar =
  | React.ReactNode
  | ((props: DefaultChatLayoutRenderTopbarProps) => React.ReactNode);

export interface DefaultChatLayoutProps extends Omit<TopbarProps, 'avatarUrl'> {
  className?: string;
  style?: React.CSSProperties;
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
 * 发送消息的选项类型（与 Composer 组件的 onSend 签名保持一致）
 */
interface SendMessageOptions {
  templateMetadata?: unknown;
  [key: string]: unknown;
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
  title,
  subTitle,
  extra,
  renderTopbar,
  className,
  style,
  onTotalUnreadChange,
  profileActions,
  renderConversationItemMeta,
  renderTopbarMeta,
  getConversationDisplayTitle,
}: DefaultChatLayoutProps) {
  // ---------------------------------------------------------------------------
  // Hooks & State
  // ---------------------------------------------------------------------------
  const actions = useActions();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const { activeChannel } = useStrategy();
  const { templateMode } = useComposerConfig();

  const {
    data: conversations = [],
    isFetching: isConversationsFetching,
    isLoading: isConversationsLoading,
  } = useConversations();

  const { activeConversationId, searchQuery } = useConversation();

  const { isPending: isConversationDetailLoading } =
    useConversationDetail(activeConversationId);

  // 使用 useTransition 标记搜索过滤为过渡更新（低优先级）
  const [isSearchPending, startTransition] = useTransition();

  // 模板预览相关状态
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const [renderingTemplateId, setRenderingTemplateId] = useState<
    string | number | undefined
  >();

  // 后台静默同步会话元数据
  const { metadata: conversationMetadata } = useActiveConversationMetadata();
  const sendMessage = useSendMessage({ conversationMetadata });

  // Composer ref
  const composerRef = useRef<ComposerRef>(null);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  // 从会话列表或详情缓存中获取当前激活的会话
  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ??
      (activeConversationId
        ? ConversationCacheHelper.findConversation(
            queryClient,
            activeConversationId,
          )
        : undefined),
    [activeConversationId, conversations, queryClient],
  );

  // 检查当前渠道是否被会话支持
  const isChannelSupported = useMemo(
    () => checkChannelSupport(activeConversation, activeChannel),
    [activeConversation, activeChannel],
  );

  // 计算 title
  const titleNode = useMemo(
    () =>
      title ??
      getDisplayTitle(
        activeConversation,
        getConversationDisplayTitle,
        t(TRANSLATION_KEYS.CONVERSATION_TITLE),
      ),
    [activeConversation, getConversationDisplayTitle, t, title],
  );

  // 计算 subtitle
  const subTitleNode = useMemo(
    () =>
      buildSubTitleNode(
        activeConversation,
        activeChannel,
        subTitle,
        renderTopbarMeta,
        t,
      ),
    [activeConversation, activeChannel, subTitle, renderTopbarMeta, t],
  );

  // 搜索过滤后的会话列表
  const filteredConversations = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery],
  );

  // ---------------------------------------------------------------------------
  // Custom Hooks
  // ---------------------------------------------------------------------------

  // Composer 焦点管理
  useComposerFocus(activeConversationId, composerRef);

  // 会话自动选择
  useConversationAutoSelect({
    conversations,
    activeConversationId,
    isConversationsFetching,
    queryClient,
  });

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleSearchSubmit = useCallback(
    (value: string) => {
      actions.setSearchQuery(value);
    },
    [actions],
  );

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      actions.setActiveConversationId(conversationId);
    },
    [actions],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      // 使用 startTransition 标记状态更新为低优先级
      // 确保输入框的更新优先于搜索过滤
      startTransition(() => {
        actions.setSearchQuery(value);
      });
    },
    [actions],
  );

  /**
   * 统一的消息发送处理函数
   */
  const handleSend = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!activeConversationId) {
        console.warn(
          '[DefaultChatLayout] handleSend called without active conversation',
        );
        return undefined;
      }

      return sendMessage.mutateAsync({
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
        console.warn(
          '[DefaultChatLayout] handleTemplateSelect called without active conversation',
        );
        return;
      }

      setRenderingTemplateId(template.id);

      try {
        let contentToUse = template.content;
        let templateMetadata: TemplatePreviewResult | undefined;

        // 如果模板有 code，尝试获取预览内容
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
            // 预览失败时继续使用原始模板内容
          }
        }

        if (templateMode === 'direct') {
          // 直接发送模式
          await handleSend(contentToUse, { templateMetadata });
        } else {
          // 编辑模式：填充到输入框
          composerRef.current?.setValue(
            contentToUse,
            template.code,
            templateMetadata,
          );
          composerRef.current?.focus();
        }
      } catch (error) {
        console.error('[DefaultChatLayout] Failed to handle template:', error);
        // 可以考虑在这里添加用户可见的错误提示
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

  // ---------------------------------------------------------------------------
  // Memoized Components
  // ---------------------------------------------------------------------------

  const topbarNode = useMemo(() => {
    // 函数形式：外部拿到默认 Topbar 所需的参数与组件
    if (typeof renderTopbar === 'function') {
      return renderTopbar({
        title: titleNode,
        subTitle: subTitleNode,
        extra: <TopbarTools extra={extra} />,
        TopbarComponent: Topbar,
        conversation: activeConversation,
      });
    }

    // 兼容老用法：直接传入 ReactNode
    if (renderTopbar) {
      return renderTopbar;
    }

    // 默认实现
    return (
      <Topbar
        title={titleNode}
        subTitle={subTitleNode}
        extra={<TopbarTools extra={extra} />}
      />
    );
  }, [renderTopbar, extra, activeConversation, titleNode, subTitleNode]);

  const composerNode = useMemo(() => {
    if (!activeConversationId) return null;

    if (isChannelSupported) {
      return (
        <Composer
          ref={composerRef}
          conversationId={activeConversationId}
          channel={activeChannel}
          onSend={handleSend}
        />
      );
    }

    return <UnsupportedChannelWarning channel={activeChannel} />;
  }, [activeConversationId, isChannelSupported, activeChannel, handleSend]);

  const conversationListClassName = useMemo(
    () =>
      cn(
        'transition-opacity duration-150',
        isSearchPending && 'opacity-80',
        !isConversationsLoading && isConversationsFetching && 'opacity-60',
      ),
    [isSearchPending, isConversationsLoading, isConversationsFetching],
  );

  const messageListClassName = useMemo(
    () => cn(isConversationDetailLoading && 'animate-pulse'),
    [isConversationDetailLoading],
  );

  // ---------------------------------------------------------------------------
  // Side Effects
  // ---------------------------------------------------------------------------

  // 全量未读总数
  const { totalUnread } = useTotalUnread();

  // 库内订阅实时消息/状态
  useUnreadSync();

  // 消息状态实时同步
  useMessageStatusSync();

  // 未读消息变化回调
  useEffect(() => {
    onTotalUnreadChange?.(totalUnread);
  }, [totalUnread, onTotalUnreadChange]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ChatLayout
      className={cn('max-w-350 h-[80vh]', className)}
      style={style}
      topbar={topbarNode}
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader
              title={t(TRANSLATION_KEYS.TITLE)}
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
            />
          }
        >
          <ConversationList
            className={conversationListClassName}
            conversations={filteredConversations}
            onSelect={handleSelectConversation}
            renderItemMeta={renderConversationItemMeta}
            getConversationDisplayTitle={getConversationDisplayTitle}
          />
        </ConversationPanel>
      }
      composer={composerNode}
      profilePanel={
        <ProfilePanel
          profile={profile}
          profileActions={profileActions}
          activeConversationId={activeConversationId ?? undefined}
          activeChannel={activeChannel}
          renderingTemplateId={renderingTemplateId}
          onTemplateSelect={handleTemplateSelect}
        />
      }
    >
      <InfiniteMessageList
        className={messageListClassName}
        conversationId={activeConversationId as string}
        currentChannel={activeChannel}
      />
    </ChatLayout>
  );
}
