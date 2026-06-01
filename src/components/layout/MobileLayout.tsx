import { FileText, Send, X } from 'lucide-react';
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
import {
  useActiveConversationId,
  useComposerConfig,
  useStrategy,
} from '@/store';
import { cn } from '@/utils/class.util';

const EMPTY_TEMPLATE_PARAMS = {
  conversationId: '',
  currentChannel: undefined,
} as const;

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
  /** 头部副标题；未传时显示“渠道 会话” */
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

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * 读取翻译文案；当语言包未配置该 key 时回退到默认文案。
 *
 * @param t 翻译函数
 * @param key 文案 key
 * @param fallback 回退文案
 * @param options 插值参数
 * @returns 可直接展示的文案
 */
function translateOrFallback(
  t: TranslationFn,
  key: string,
  fallback: string,
  options?: Record<string, unknown>,
): string {
  const value = t(key, options);
  const target = value === key ? fallback : value;

  if (!options) {
    return target;
  }

  return Object.entries(options).reduce((result, [token, optionValue]) => {
    const regex = new RegExp(`{{\\s*${token}\\s*}}`, 'g');
    return result.replace(regex, String(optionValue));
  }, target);
}

/**
 * 生成移动端模板按钮的单行展示文案。
 *
 * @param template 模板数据
 * @returns 模板名称和内容组成的文案
 */
function formatTemplateLabel(template: Template): string {
  return template.name
    ? `[${template.name}] ${template.content}`
    : template.content;
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
  const [templateMetadata, setTemplateMetadata] = useState<unknown>();
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

  const templateQueryParams = customTemplates
    ? EMPTY_TEMPLATE_PARAMS
    : {
        conversationId: activeConversationId ?? '',
        currentChannel: activeChannel,
      };
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
    (activeConversation
      ? (getConversationDisplayTitle?.(activeConversation) ??
        activeConversation.user.name)
      : t('conversation.title'));
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
  const maxLength = composerConfig.customMessageMaxLength;
  const isInputReadOnly =
    composerConfig.inputMode === 'template-only' &&
    composerConfig.allowTemplateEdit !== true;
  const templateSheetId = 'bifrost-mobile-template-sheet';

  useEffect(() => {
    if (!isTemplateSheetOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTemplateSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTemplateSheetOpen]);

  const handleSend = useCallback(async () => {
    if (!activeConversationId) return;

    const content = value.trim();
    if (!content) return;

    await sendMessage.mutateAsync({
      conversationId: activeConversationId,
      content,
      options:
        templateMetadata === undefined ? undefined : { templateMetadata },
    });

    setValue('');
    setTemplateMetadata(undefined);
    inputRef.current?.focus();
  }, [activeConversationId, sendMessage, templateMetadata, value]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      if (!activeConversationId) return;

      setTemplateError(null);
      setRenderingTemplateId(template.id);

      try {
        let contentToUse = template.content;
        let nextTemplateMetadata: unknown;

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

        setIsTemplateSheetOpen(false);
      } catch {
        setTemplateError(t('template.previewFailed'));
      } finally {
        setRenderingTemplateId(undefined);
      }
    },
    [
      activeChannel,
      activeConversationId,
      composerConfig.templateMode,
      previewTemplate,
      sendMessage,
      t,
    ],
  );

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
        'relative flex h-full w-full max-w-[430px] flex-col overflow-hidden',
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
      <header
        className={cn(
          'relative z-10 flex min-h-20 shrink-0 items-center justify-between gap-4',
          'bg-card/80 px-5 py-3 shadow-soft backdrop-blur-md',
          'dark:bg-gray-900/50',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {resolvedAvatarUrl ? (
            <img
              src={resolvedAvatarUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10" />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold leading-5 text-gray-600 dark:text-gray-400">
              {headerTitle}
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
              {headerSubTitle}
            </p>
          </div>
        </div>

        {showCloseButton && (
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-hidden bg-card/40">
        {messageListNode}
      </main>

      {isTemplateSheetOpen && (
        <section
          id={templateSheetId}
          role="dialog"
          aria-label={translateOrFallback(
            t,
            'mobile.template.title',
            '选择快捷话术模板',
          )}
          className={cn(
            'absolute inset-x-0 bottom-[72px] z-20 mx-3 max-h-[52%]',
            'overflow-hidden rounded-t-2xl border border-border bg-card',
            'shadow-2xl',
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {translateOrFallback(
                t,
                'mobile.template.title',
                '选择快捷话术模板',
              )}
            </h3>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              onClick={() => setIsTemplateSheetOpen(false)}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[calc(52vh-56px)] overflow-y-auto px-4 pb-4">
            {templateError && (
              <p className="mb-3 rounded-md bg-error/10 px-3 py-2 text-xs text-error">
                {templateError}
              </p>
            )}

            {isTemplatesLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('template.panel.loading')}
              </p>
            ) : templatesError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('template.panel.loadFailed')}
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-foreground"
                  onClick={() => void refetchTemplates()}
                >
                  {t('template.panel.retry')}
                </button>
              </div>
            ) : templates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('template.panel.noTemplates')}
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => {
                  const isRendering = renderingTemplateId === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center rounded-lg bg-muted/60 px-3 py-3',
                        'text-left text-sm text-foreground transition-colors',
                        'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40',
                        isRendering && 'cursor-wait opacity-70',
                      )}
                      onClick={() => void handleTemplateSelect(template)}
                      disabled={isRendering}
                      aria-busy={isRendering}
                    >
                      <span className="line-clamp-1 break-all">
                        {formatTemplateLabel(template)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="shrink-0 border-t border-border bg-white/50 px-3 py-3 backdrop-blur-md dark:bg-gray-900/50">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={() => {
              setTemplateError(null);
              setIsTemplateSheetOpen((current) => !current);
            }}
            aria-label={translateOrFallback(
              t,
              'mobile.template.open',
              '打开快捷话术模板',
            )}
            aria-expanded={isTemplateSheetOpen}
            aria-controls={templateSheetId}
            disabled={!activeConversationId}
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
          </button>

          <input
            ref={inputRef}
            value={value}
            placeholder={resolvedPlaceholder}
            maxLength={maxLength}
            readOnly={isInputReadOnly}
            disabled={!activeConversationId || sendMessage.isPending}
            className={cn(
              'min-w-0 flex-1 rounded-full border border-transparent',
              'bg-gray-200/50 dark:bg-white/10',
              'px-4 py-2 text-sm text-foreground outline-none',
              'placeholder:text-gray-500/50',
              'focus:bg-card focus:ring-2 focus:ring-primary/40',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isInputReadOnly && 'cursor-not-allowed',
            )}
            onChange={(event) => {
              setValue(event.target.value);
              setTemplateMetadata(undefined);
            }}
            onKeyDown={handleInputKeyDown}
            aria-label={t('composer.aria.input')}
          />

          <button
            type="submit"
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              'bg-[var(--mobile-accent-color)] text-[var(--mobile-accent-foreground-color)] shadow-soft',
              'transition-transform hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            )}
            disabled={!canSend}
            aria-label={translateOrFallback(
              t,
              'composer.aria.send',
              '发送消息',
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </footer>
    </section>
  );
}
