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
import { useTemplates } from '@/hooks/use-templates.hook';
import { useUnreadSync } from '@/hooks/use-unread-sync.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import type { TemplatePreviewResult } from '@/services/core/template.service';
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
} from '@/utils/mobile.utils';

/**
 * 移动端消息列表自定义渲染参数。
 */
export interface MobileLayoutRenderMessageListProps {
  /** 当前激活会话 ID */
  conversationId: string | undefined;
  /** 当前激活渠道 */
  currentChannel: ChannelTypeEnum;
}

/**
 * MobileLayout 组件参数。
 */
export interface MobileLayoutProps {
  /** 外层容器类名 */
  className?: string;
  /** 外层容器内联样式 */
  style?: CSSProperties;
  /** 头部标题；未传时使用当前激活会话用户名 */
  title?: ReactNode;
  /** 头部副标题；未传时显示"渠道 会话" */
  subTitle?: ReactNode;
  /** 头部头像 URL；未传时使用当前激活会话头像 */
  avatarUrl?: string;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击关闭按钮回调 */
  onClose?: () => void;
  /** 自定义模板列表；提供后不会请求 TemplateService */
  templates?: Template[];
  /** 输入框占位文案 */
  placeholder?: string;
  /** 自定义当前会话标题格式 */
  getConversationDisplayTitle?: (conversation: Conversation) => string;
  /** 自定义消息列表渲染 */
  renderMessageList?: (props: MobileLayoutRenderMessageListProps) => ReactNode;
}

/**
 * MobileLayout：面向移动端嵌入场景的简化聊天布局。
 *
 * @description
 * 布局由 header、消息区和底部输入区组成。模板入口使用底部 ActionSheet，
 * 数据仍通过现有 React Query hooks 与 ServiceProvider 注入服务获取。
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
  const { data: conversations = [] } = useConversations();
  const { metadata: conversationMetadata } = useActiveConversationMetadata();
  const sendMessage = useSendMessage({ conversationMetadata });
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState('');
  const [templateMetadata, setTemplateMetadata] =
    useState<TemplatePreviewResult>();
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [renderingTemplateId, setRenderingTemplateId] = useState<
    string | undefined
  >();
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
  const canSend =
    !!activeConversationId && !!value.trim() && !sendMessage.isPending;
  const isInputReadOnly =
    composerConfig.inputMode === 'template-only' &&
    composerConfig.allowTemplateEdit !== true;

  const closeTemplateSheet = useCallback(() => {
    setIsTemplateSheetOpen(false);
    setTemplateError(null);
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
        options:
          templateMetadata === undefined ? undefined : { templateMetadata },
      });

      setValue('');
      setTemplateMetadata(undefined);
      inputRef.current?.focus();
    } catch {
      // React Query / useSendMessage handles error state
    }
  }, [activeConversationId, sendMessage, templateMetadata, value]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const handleValueChange = useCallback((newValue: string) => {
    setValue(newValue);
    setTemplateMetadata(undefined);
  }, []);

  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      if (!activeConversationId) return;

      setTemplateError(null);
      setRenderingTemplateId(template.id);

      try {
        let contentToUse = template.content;
        let nextTemplateMetadata: TemplatePreviewResult | undefined;

        if (template.code) {
          const preview = await previewTemplate({
            conversationId: activeConversationId,
            currentChannel: activeChannel,
            templateCode: template.code,
          });

          nextTemplateMetadata = preview;
          contentToUse = preview.previewContent ?? template.content;
        }

        if (composerConfig.templateMode === 'direct') {
          await sendMessage.mutateAsync({
            conversationId: activeConversationId,
            content: contentToUse,
            options:
              nextTemplateMetadata === undefined
                ? undefined
                : { templateMetadata: nextTemplateMetadata },
          });
          setValue('');
          setTemplateMetadata(undefined);
        } else {
          setValue(contentToUse);
          setTemplateMetadata(nextTemplateMetadata);
          inputRef.current?.focus();
        }

        closeTemplateSheet();
      } catch {
        setTemplateError(t('template.previewFailed'));
      } finally {
        setRenderingTemplateId(undefined);
      }
    },
    [
      activeChannel,
      activeConversationId,
      closeTemplateSheet,
      composerConfig.templateMode,
      previewTemplate,
      sendMessage,
      t,
    ],
  );

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
        onValueChange={handleValueChange}
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
