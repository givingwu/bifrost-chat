import { MessageCircle, Search, X } from 'lucide-react';
import {
  type CSSProperties,
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { ChannelFilter, ConversationList } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { useChannelUnread } from '@/hooks';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActions, useStrategy } from '@/store';
import { cn } from '@/utils/class.util';

export interface MobileListLayoutProps {
  /** 关闭回调 */
  onClose?: () => void;
  /** 选择会话回调 */
  onSelectConversation?: (conversationId: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 自定义渲染会话列表项的元数据区域（如资产编号） */
  renderItemMeta?: (conversation: Conversation) => React.ReactNode;
  /** 是否显示全局资产搜索（默认 true） */
  showAssetSearch?: boolean;
  /** 资产搜索占位符 */
  assetSearchPlaceholder?: string;
  /** 自定义标题 */
  title?: ReactNode;
  /** 坐席状态 */
  agentStatus?: AgentStatusEnum;
}

/**
 * MobileListLayout：移动端会话列表布局。
 *
 * @description
 * - 顶部标题和关闭按钮
 * - 全局资产搜索框（搜索后过滤所有渠道的会话）
 * - 渠道切换 Tab（带未读角标）
 * - 会话列表（带资产编号、未读状态）
 *
 * @example
 * ```tsx
 * <MobileListLayout
 *   onClose={() => setVisible(false)}
 *   onSelectConversation={(id) => console.log(id)}
 *   renderItemMeta={(conv) => (
 *     <span className="text-xs text-gray-500">
 *       {conv.metadata?.assetItemNumber}
 *     </span>
 *   )}
 * />
 * ```
 */
export const MobileListLayout = memo(
  ({
    onClose,
    onSelectConversation,
    className,
    style,
    renderItemMeta,
    showAssetSearch = true,
    assetSearchPlaceholder,
    title,
    agentStatus,
  }: MobileListLayoutProps) => {
    const { t } = useTranslation();
    const { allowedChannels, activeChannel } = useStrategy();
    const { setActiveChannel } = useActions();
    const unreadByChannel = useChannelUnread(allowedChannels);
    const { data: allConversations = [], isLoading: isConversationsLoading } =
      useConversations();

    // 全局资产搜索状态
    const [assetSearchQuery, setAssetSearchQuery] = useState('');

    // 处理会话选择
    const handleSelectConversation = useCallback(
      (conversationId: string) => {
        onSelectConversation?.(conversationId);
      },
      [onSelectConversation],
    );

    // 处理渠道切换
    const handleChannelChange = useCallback(
      (channel: ChannelTypeEnum) => {
        setActiveChannel(channel);
      },
      [setActiveChannel],
    );

    // 处理资产搜索
    const handleAssetSearchChange = useCallback((value: string) => {
      setAssetSearchQuery(value.trim());
    }, []);

    // 过滤会话：全局搜索优先，不受渠道切换影响
    const filteredConversations = useMemo(() => {
      if (!assetSearchQuery) return null;

      return allConversations.filter((conv) => {
        const assetId = (conv.metadata?.assetItemNumber ?? '') as string;
        const name = (conv.user.name ?? '') as string;
        const query = assetSearchQuery.toLowerCase();

        return (
          assetId.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query)
        );
      });
    }, [assetSearchQuery, allConversations]);

    // 是否有搜索结果
    const hasSearchResults =
      filteredConversations !== null && filteredConversations.length > 0;

    // 无数据状态：搜索无结果
    const emptySearchState = (
      <EmptyState
        message={t('conversation.searchEmpty') || '未找到该资产相关的会话记录'}
        icon={<Search className="h-12 w-12 text-gray-400" />}
      />
    );

    // 默认空状态
    const defaultEmptyState = (
      <EmptyState
        message={t('conversation.empty') || '暂无消息记录'}
        icon={<MessageCircle className="h-12 w-12 text-gray-400" />}
      />
    );

    return (
      <section
        data-component="mobile-list-layout"
        className={cn(
          'flex h-full w-full flex-col overflow-hidden bg-background',
          className,
        )}
        style={style}
      >
        {/* 顶栏：标题 + 关闭按钮 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-semibold text-foreground">
            {(title ?? t('conversation.messageCenter')) || '消息中心'}
          </h1>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* 全局资产搜索框 */}
        {showAssetSearch && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <SearchInput
              value={assetSearchQuery}
              onChange={handleAssetSearchChange}
              placeholder={
                assetSearchPlaceholder ??
                (t('conversation.searchAssetPlaceholder') || '搜索资产编号...')
              }
              clearable
              icon={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>
        )}

        {/* 渠道切换 Tab（吸顶） */}
        <div className="sticky top-0 py-1 border-b border-gray-200 dark:border-gray-800">
          <ChannelFilter
            channels={allowedChannels}
            activeChannel={activeChannel}
            onChannelClick={handleChannelChange}
            unreadByChannel={unreadByChannel}
            mobile
            status={agentStatus}
          />
        </div>

        {/* 会话列表 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {filteredConversations !== null ? (
            // 搜索结果模式
            hasSearchResults ? (
              <ConversationList
                conversations={filteredConversations}
                onSelect={handleSelectConversation}
                renderItemMeta={renderItemMeta}
                autoFetch={false}
                enableVirtualization={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                {emptySearchState}
              </div>
            )
          ) : (
            // 默认模式：显示当前渠道会话
            <ConversationList
              onSelect={handleSelectConversation}
              renderItemMeta={renderItemMeta}
              isLoading={isConversationsLoading}
            />
          )}
        </div>
      </section>
    );
  },
);

MobileListLayout.displayName = 'MobileListLayout';
