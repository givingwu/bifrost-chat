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
import { MobileComposer } from '@/components/layout/MobileComposer';
import { MobileHeader } from '@/components/layout/MobileHeader';
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

export interface MobileLayoutRenderMessageListProps {
  conversationId: string | undefined;
  currentChannel: ChannelTypeEnum;
}

export interface MobileLayoutProps {
  className?: string;
  style?: CSSProperties;
  title?: ReactNode;
  subTitle?: ReactNode;
  avatarUrl?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  templates?: Template[];
  placeholder?: string;
  getConversationDisplayTitle?: (conversation: Conversation) => string;
  renderMessageList?: (props: MobileLayoutRenderMessageListProps) => ReactNode;
}

/**
 * MobileLayout：面向移动端嵌入场景的简化聊天布局。
 *
 * @description
 * 布局由 header、消息区和底部输入区组成。模板入口使用底部 ActionSheet，
 * 数据仍通过现有 React Query hooks 与 ServiceProvider 注入服务获取。
 * 模板选择逻辑通过 useTemplateSelect 与 PC 端保持一致。
 */
export function MobileLayout({
  className,
  style,
  title,
  subTitle,
  avatarUrl,
  showCloseButton = true,
  onClose,
  templates: customTemplates,
  placeholder,
  getConversationDisplayTitle,
  renderMessageList,
}: MobileLayoutProps) {
  const { t } = useTranslation();
  const getChannelLabel = useChannelLabel();
  const { activeChannel } = useStrategy();
  const activeConversationId = useActiveConversationId();
  const composerConfig = useComposerConfig();
  const { data: conversations = [], isLoading: isConversationsLoading } =
    useConversations();
  const { metadata: conversationMetadata } = useActiveConversationMetadata();
  const sendMessage = useSendMessage({ conversationMetadata });
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const inputRef = useRef<HTMLInputElement>(null);

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
        (conversation) => conversation.id === activeConversationId,
      ),
    [activeConversationId, conversations],
  );

  const templateQueryParams = useMemo(
    () =>
      customTemplates
        ? EMPTY_TEMPLATE_PARAMS
        : {
            conversationId: activeConversationId ?? '',
            currentChannel: activeChannel,
          },
    [customTemplates, activeConversationId, activeChannel],
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
  const resolvedAvatarUrl = avatarUrl ?? activeConversation?.user.avatarUrl;
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
    !!activeConversationId && !!value.trim() && !sendMessage.isPending;
  const isInputReadOnly = isTemplateMessage
    ? isTemplateLocked
    : composerConfig.inputMode === 'template-only';

  const closeTemplateSheet = useCallback(() => {
    setIsTemplateSheetOpen(false);
    setTemplateError(null);
  }, []);

  const clearTemplateState = useCallback(() => {
    setValue('');
    setPendingTemplateOptions(undefined);
  }, []);

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
    if (!activeConversationId) return;

    const content = value.trim();
    if (!content) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: activeConversationId,
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
    activeConversationId,
    clearTemplateState,
    pendingTemplateOptions,
    sendMessage,
    value,
  ]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const { renderingTemplateId, handleTemplateSelect } = useTemplateSelect({
    activeConversationId,
    activeChannel,
    previewTemplate,
    templateMode: composerConfig.templateMode ?? 'edit',
    onDirectSend: useCallback(
      async (content, options) => {
        if (!activeConversationId) return;

        await sendMessage.mutateAsync({
          conversationId: activeConversationId,
          content,
          options: options as Parameters<
            typeof sendMessage.mutateAsync
          >[0]['options'],
        });
        clearTemplateState();
      },
      [activeConversationId, clearTemplateState, sendMessage],
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
      conversationId: activeConversationId ?? undefined,
      currentChannel: activeChannel,
    })
  ) : activeConversationId ? (
    <InfiniteMessageList
      conversationId={activeConversationId}
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
      data-component="mobile-layout"
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
      <MobileHeader
        title={headerTitle}
        subTitle={headerSubTitle}
        avatarUrl={resolvedAvatarUrl}
        channel={activeChannel}
        loading={isConversationsLoading}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />

      <main className="min-h-0 flex-1 overflow-hidden bg-card/40">
        {messageListNode}
      </main>

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

      <MobileComposer
        inputRef={inputRef}
        value={value}
        onValueChange={setValue}
        onSend={handleSend}
        onKeyDown={handleInputKeyDown}
        placeholder={resolvedPlaceholder}
        maxLength={composerConfig.customMessageMaxLength}
        readOnly={isInputReadOnly}
        inputDisabled={!activeConversationId || sendMessage.isPending}
        canSend={canSend}
        isTemplateSheetOpen={isTemplateSheetOpen}
        isTemplateButtonDisabled={!activeConversationId}
        onToggleTemplateSheet={toggleTemplateSheet}
      />
    </section>
  );
}
