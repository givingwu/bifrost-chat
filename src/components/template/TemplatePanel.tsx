import { useCallback, useMemo, useState, useTransition } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { UnsupportedChannelWarning } from '@/components/layout/UnsupportedChannelWarning';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useTemplates } from '@/hooks/use-templates.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActiveConversationId } from '@/store';
import { cn } from '@/utils/class.util';
import { TemplateHeader } from './TemplateHeader';
import { TemplateList } from './TemplateList';

export interface TemplatePanelProps {
  /** 选择模板的回调 */
  onTemplateSelect?: (template: Template) => void;
  /** 选中的模板 ID */
  selectedId?: string;
  /** 是否显示分类标签 */
  showCategory?: boolean;
  /** 是否显示使用次数 */
  showUsageCount?: boolean;
  /** 自定义模板列表（如果提供，则不使用 useTemplates） */
  templates?: Template[];
  /** 会话 ID（用于获取特定会话的模板） */
  conversationId?: string;
  /** 当前渠道（用于获取特定渠道的模板） */
  currentChannel?: ChannelTypeEnum;
  /** 正在渲染的模板 ID（用于显示 loading 状态） */
  renderingTemplateId?: string | number;
  /** 当前渠道是否被会话支持 */
  isChannelSupported?: boolean;
}

/**
 * TemplatePanel 组件
 *
 * 完整的模板面板，包含搜索、分类过滤和模板列表
 *
 * @example
 * ```tsx
 * <TemplatePanel
 *   onTemplateSelect={(template) => console.log(template)}
 *   selectedId="template-1"
 *   showCategory
 *   showUsageCount
 * />
 * ```
 */
export const TemplatePanel = ({
  onTemplateSelect,
  selectedId,
  showCategory = true,
  showUsageCount = false,
  templates: customTemplates,
  conversationId,
  currentChannel,
  renderingTemplateId,
  isChannelSupported = true,
}: TemplatePanelProps) => {
  const { t } = useTranslation();
  const activeConversationId = useActiveConversationId();
  const effectiveConversationId = conversationId ?? activeConversationId;
  const hasSelectedConversation = !!effectiveConversationId;

  const { data: conversations = [], isLoading: isConversationsLoading } =
    useConversations({ enabled: !customTemplates });

  const isConversationListEmpty =
    !customTemplates && !isConversationsLoading && conversations.length === 0;

  // 仅在未提供自定义模板且渠道支持时才调用 useTemplates
  const shouldFetchFromServer =
    !customTemplates &&
    isChannelSupported &&
    hasSelectedConversation &&
    !isConversationsLoading &&
    !isConversationListEmpty;

  const {
    data: serverTemplates,
    isLoading,
    error,
    refetch,
  } = useTemplates(
    shouldFetchFromServer
      ? {
          conversationId: effectiveConversationId as string,
          currentChannel,
        }
      : ({ conversationId: '', currentChannel } as never),
  );

  const templates = customTemplates ?? serverTemplates ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [isPending, startTransition] = useTransition();

  // 缓存搜索关键词的小写版本，避免重复计算
  const normalizedSearchQuery = useMemo(
    () => searchQuery.toLowerCase().trim(),
    [searchQuery],
  );

  // 优化的搜索处理：使用 useTransition 保持 UI 响应性
  const handleSearchChange = useCallback((value: string) => {
    // 立即更新输入框的值
    setSearchQuery(value);

    // 使用 startTransition 将搜索过滤标记为低优先级更新
    // 这样可以保持输入框的响应性，即使过滤操作比较耗时
    startTransition(() => {
      // 过滤逻辑会在 useMemo 中自动执行
      // 这里不需要额外操作，因为 normalizedSearchQuery 会自动更新
    });
  }, []);

  // 提取所有分类
  const categories = useMemo(() => {
    const categorySet = new Set<string>();

    templates.forEach((template: Template) => {
      if (template.category) {
        categorySet.add(template.category);
      }
    });

    return Array.from(categorySet).sort();
  }, [templates]);

  // 优化的过滤逻辑：预先计算可搜索字段
  const filteredTemplates = useMemo(() => {
    if (!normalizedSearchQuery && !selectedCategory) {
      return templates;
    }

    return templates.filter((template: Template) => {
      // 分类过滤
      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;

      // 搜索过滤
      const matchesSearch =
        !normalizedSearchQuery ||
        template.name.toLowerCase().includes(normalizedSearchQuery) ||
        template.content.toLowerCase().includes(normalizedSearchQuery) ||
        template.category?.toLowerCase().includes(normalizedSearchQuery) ||
        template.tags?.some((tag) =>
          tag.toLowerCase().includes(normalizedSearchQuery),
        );

      return matchesCategory && matchesSearch;
    });
  }, [templates, normalizedSearchQuery, selectedCategory]);

  const handleCategorySelect = useCallback((category?: string) => {
    setSelectedCategory(category);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // 计算统计信息
  const stats = useMemo(
    () => ({
      total: templates.length,
      filtered: filteredTemplates.length,
    }),
    [templates.length, filteredTemplates.length],
  );

  return (
    <>
      {/* 头部 */}
      <TemplateHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <div className="flex min-h-0 flex-col flex-1 divide-y divide-border/50">
        {/* 模板列表 */}
        <section
          className={cn(
            'flex-1 overflow-y-auto px-4 py-3',
            isPending && 'opacity-60',
          )}
          aria-label={t('template.title')}
          aria-live="polite"
          aria-busy={isLoading || isPending}
        >
          {!customTemplates && isConversationsLoading ? (
            <LoadingState message={t('template.panel.loading')} />
          ) : isConversationListEmpty && !customTemplates ? (
            <EmptyState message={t('template.panel.selectConversationFirst')} />
          ) : !hasSelectedConversation && !customTemplates ? (
            <EmptyState message={t('template.panel.selectConversationFirst')} />
          ) : !isChannelSupported && currentChannel ? (
            <UnsupportedChannelWarning
              channel={currentChannel}
              variant="vertical"
            />
          ) : error ? (
            <ErrorState
              message={t('template.panel.loadFailed')}
              onRetry={handleRetry}
              retryText={t('template.panel.retry')}
            />
          ) : isLoading && filteredTemplates.length === 0 ? (
            <LoadingState message={t('common.loading')} />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              message={
                searchQuery || selectedCategory
                  ? t('template.panel.noMatchTemplates')
                  : t('template.panel.noTemplates')
              }
            />
          ) : (
            <TemplateList
              templates={filteredTemplates}
              onTemplateClick={onTemplateSelect}
              selectedId={selectedId}
              showCategory={showCategory}
              showUsageCount={showUsageCount}
              renderingTemplateId={renderingTemplateId}
            />
          )}
        </section>

        {/* 底部统计 */}
        {stats.total > 0 && (
          <output className="backdrop-blur-md px-4 py-2" aria-live="polite">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {t('template.panel.showingCount', {
                filtered: stats.filtered,
                total: stats.total,
              })}
            </p>
          </output>
        )}
      </div>
    </>
  );
};
