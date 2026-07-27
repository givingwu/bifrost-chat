import { ArrowLeft, X } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  clampComposerValue,
  resolveCustomMessageMaxLength,
  shouldIgnoreComposerMaxLength,
} from '@/components/composer/composer-length.util';
import { MobileComposer } from '@/components/layout/MobileComposer';
import { MobileTemplateActionSheet } from '@/components/layout/MobileTemplateActionSheet';
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';
import { useActiveConversationMetadata } from '@/hooks/use-active-conversation-metadata.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useMessageStatusSync } from '@/hooks/use-message-status-sync.hook';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import { useTemplatePreview } from '@/hooks/use-template-preview.hook';
import {
  type TemplateSendOptions,
  useTemplateSelect,
} from '@/hooks/use-template-select.hook';
import { useTemplates } from '@/hooks/use-templates.hook';
import { useUnreadSync } from '@/hooks/use-unread-sync.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import {
  useActiveConversationId,
  useComposerConfig,
  useStrategy,
} from '@/store';
import { cn } from '@/utils/class.util';
import { getDisplayTitle } from '@/utils/layout.util';
import {
  EMPTY_TEMPLATE_PARAMS,
  translateOrFallback,
} from '@/utils/mobile.util';

export interface MobileChatLayoutProps {
  className?: string;
  style?: CSSProperties;
  /** 会话 ID（外部控制时传入） */
  conversationId?: string;
  /** 标题（可选，不传则使用会话名称） */
  title?: ReactNode;
  /** 副标题（可选，不传则使用渠道名称） */
  subTitle?: ReactNode;
  /** 头像 URL（可选，不传则使用会话头像） */
  avatarUrl?: string;
  /** 返回按钮回调 */
  onBack?: () => void;
  /** 关闭按钮回调 */
  onClose?: () => void;
  /** 自定义模板列表 */
  templates?: Template[];
  /** 输入框占位符 */
  placeholder?: string;
  /** 自定义会话标题 formatter */
  getConversationDisplayTitle?: (conversation: Conversation) => string;
  /** 自定义消息列表渲染 */
  renderMessageList?: (props: {
    conversationId: string | undefined;
    currentChannel: ChannelTypeEnum;
  }) => ReactNode;
}

/**
 * MobileChatLayout：移动端单聊布局。
 *
 * @description
 * - 顶部：返回按钮 | 客户姓名 + 渠道 | 关闭按钮
 * - 中部：消息气泡区
 * - 底部：输入框 + 快捷话术按钮 + 发送按钮
 *
 * @example
 * ```tsx
 * <MobileChatLayout
 *   conversationId="123"
 *   onBack={() => setView('list')}
 *   onClose={() => setVisible(false)}
 * />
 * ```
 */
export function MobileChatLayout({
  className,
  style,
  conversationId: propConversationId,
  title,
  subTitle,
  avatarUrl,
  onBack,
  onClose,
  templates: customTemplates,
  placeholder,
  getConversationDisplayTitle,
  renderMessageList,
}: MobileChatLayoutProps) {
  const { t } = useTranslation();
  const getChannelLabel = useChannelLabel();
  const { activeChannel } = useStrategy();
  const activeConversationId = useActiveConversationId();
  const composerConfig = useComposerConfig();
  const { data: conversations = [], isLoading: _isConversationsLoading } =
    useConversations();
  const { metadata: conversationMetadata } = useActiveConversationMetadata();
  const sendMessage = useSendMessage({ conversationMetadata });
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 使用外部传入的 conversationId 或内部状态
  const effectiveConversationId = propConversationId ?? activeConversationId;

  const [value, setValue] = useState('');
  const [pendingTemplateOptions, setPendingTemplateOptions] =
    useState<TemplateSendOptions>();
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useUnreadSync();
  useMessageStatusSync();

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === effectiveConversationId,
      ),
    [effectiveConversationId, conversations],
  );

  const templateQueryParams = useMemo(
    () =>
      customTemplates
        ? EMPTY_TEMPLATE_PARAMS
        : {
            conversationId: effectiveConversationId ?? '',
            currentChannel: activeChannel,
          },
    [customTemplates, effectiveConversationId, activeChannel],
  );

  const {
    data: serverTemplates,
    isLoading: isTemplatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useTemplates(templateQueryParams);
  const templates = customTemplates ?? serverTemplates ?? [];

  const channelLabel = getChannelLabel(activeChannel);
  const headerTitle =
    title ??
    getDisplayTitle(
      activeConversation,
      getConversationDisplayTitle,
      t('conversation.title'),
    );
  const headerSubTitle =
    subTitle ??
    translateOrFallback(t, 'mobile.subtitle', '{{channel}} 会话', {
      channel: channelLabel,
    });
  const _resolvedAvatarUrl = avatarUrl ?? activeConversation?.user.avatarUrl;
  const resolvedPlaceholder =
    placeholder ??
    composerConfig.placeholder ??
    translateOrFallback(t, 'composer.placeholder.channel', '请输入消息内容');
  const isTemplateMessage =
    pendingTemplateOptions?.type === MessageTypeEnum.Template;
  const isTemplateLocked =
    isTemplateMessage &&
    composerConfig.templateMode === 'edit' &&
    composerConfig.allowTemplateEdit !== true;
  const canSend =
    !!effectiveConversationId && !!value.trim() && !sendMessage.isPending;
  const isInputReadOnly = isTemplateMessage
    ? isTemplateLocked
    : composerConfig.inputMode === 'template-only';
  const customMessageMaxLength = useMemo(
    () =>
      resolveCustomMessageMaxLength({
        channel: activeChannel,
        customMessageMaxLength: composerConfig.customMessageMaxLength,
      }),
    [activeChannel, composerConfig.customMessageMaxLength],
  );
  const resolveEffectiveMaxLength = useCallback(
    (nextIsTemplateMessage: boolean) => {
      const shouldBypass = shouldIgnoreComposerMaxLength({
        isTemplateMessage: nextIsTemplateMessage,
        ignoreMaxLengthForTemplateMessages:
          composerConfig.ignoreMaxLengthForTemplateMessages,
      });

      return shouldBypass ? undefined : customMessageMaxLength;
    },
    [composerConfig.ignoreMaxLengthForTemplateMessages, customMessageMaxLength],
  );
  const effectiveMaxLength = useMemo(
    () => resolveEffectiveMaxLength(isTemplateMessage),
    [isTemplateMessage, resolveEffectiveMaxLength],
  );

  const setComposerValue = useCallback((nextValue: string) => {
    setValue(nextValue);
  }, []);

  const closeTemplateSheet = useCallback(() => {
    setIsTemplateSheetOpen(false);
    setTemplateError(null);
  }, []);

  const clearTemplateState = useCallback(() => {
    setValue('');
    setPendingTemplateOptions(undefined);
  }, []);

  const handleClearComposer = useCallback(() => {
    clearTemplateState();
    setTemplateError(null);
    inputRef.current?.focus();
  }, [clearTemplateState]);

  useEffect(() => {
    if (!isTemplateSheetOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTemplateSheet();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTemplateSheetOpen, closeTemplateSheet]);

  const handleSend = useCallback(async () => {
    if (!effectiveConversationId) return;

    const content = clampComposerValue(value.trim(), effectiveMaxLength);
    if (!content) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: effectiveConversationId,
        content,
        options: pendingTemplateOptions as Parameters<
          typeof sendMessage.mutateAsync
        >[0]['options'],
      });

      clearTemplateState();
      inputRef.current?.focus();
    } catch {
      // React Query / useSendMessage handles error state
    }
  }, [
    effectiveConversationId,
    clearTemplateState,
    effectiveMaxLength,
    pendingTemplateOptions,
    sendMessage,
    value,
  ]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const { renderingTemplateId, handleTemplateSelect } = useTemplateSelect({
    activeConversationId: effectiveConversationId,
    activeChannel,
    previewTemplate,
    templateMode: composerConfig.templateMode ?? 'edit',
    onDirectSend: useCallback(
      async (content, options) => {
        if (!effectiveConversationId) return;

        const nextContent = clampComposerValue(
          content,
          resolveEffectiveMaxLength(true),
        );

        await sendMessage.mutateAsync({
          conversationId: effectiveConversationId,
          content: nextContent,
          options: options as Parameters<
            typeof sendMessage.mutateAsync
          >[0]['options'],
        });
        clearTemplateState();
      },
      [
        effectiveConversationId,
        clearTemplateState,
        resolveEffectiveMaxLength,
        sendMessage,
      ],
    ),
    onEditFill: useCallback(
      (content, _code, metadata) => {
        setValue(content);
        setPendingTemplateOptions({
          type: MessageTypeEnum.Template,
          templateCode: _code,
          templateMetadata: metadata,
        });
        inputRef.current?.focus();
        closeTemplateSheet();
      },
      [closeTemplateSheet],
    ),
    onPreviewError: useCallback(() => {
      setTemplateError(t('template.previewFailed'));
    }, [t]),
  });

  const toggleTemplateSheet = useCallback(() => {
    setTemplateError(null);
    setIsTemplateSheetOpen((current) => !current);
  }, []);

  const messageListNode = renderMessageList ? (
    renderMessageList({
      conversationId: effectiveConversationId ?? undefined,
      currentChannel: activeChannel,
    })
  ) : effectiveConversationId ? (
    <InfiniteMessageList
      conversationId={effectiveConversationId}
      currentChannel={activeChannel}
      className="bg-transparent"
    />
  ) : (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {t('conversation.empty')}
    </div>
  );

  return (
    <section
      data-component="mobile-chat-layout"
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden',
        'bg-background text-foreground shadow-2xl',
        className,
      )}
      style={
        {
          '--mobile-accent-color': 'var(--primary)',
          '--mobile-accent-foreground-color': 'var(--primary-foreground)',
          ...style,
        } as CSSProperties
      }
    >
      {/* 顶栏：返回 | 标题 | 关闭 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-background">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground truncate">
              {headerTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {headerSubTitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      {/* 消息区 */}
      <main className="min-h-0 flex-1 overflow-hidden bg-card/40">
        {messageListNode}
      </main>

      {/* 模板 ActionSheet */}
      {isTemplateSheetOpen && (
        <MobileTemplateActionSheet
          templates={templates}
          isLoading={isTemplatesLoading}
          queryError={templatesError}
          templateError={templateError}
          renderingTemplateId={renderingTemplateId}
          onSelect={handleTemplateSelect}
          onClose={closeTemplateSheet}
          onRetry={() => void refetchTemplates()}
        />
      )}

      {/* 输入区 */}
      <MobileComposer
        inputRef={inputRef}
        value={value}
        onValueChange={setComposerValue}
        onClear={handleClearComposer}
        onSend={handleSend}
        onKeyDown={handleInputKeyDown}
        placeholder={resolvedPlaceholder}
        maxLength={effectiveMaxLength}
        showCharCount={composerConfig.showCharCount !== false}
        readOnly={isInputReadOnly}
        inputDisabled={!effectiveConversationId || sendMessage.isPending}
        canSend={canSend}
        isTemplateSheetOpen={isTemplateSheetOpen}
        isTemplateButtonDisabled={!effectiveConversationId}
        onToggleTemplateSheet={toggleTemplateSheet}
      />
    </section>
  );
}
