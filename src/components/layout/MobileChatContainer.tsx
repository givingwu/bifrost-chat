import { memo, type ReactNode, useCallback, useState } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { cn } from '@/utils/class.util';
import { MobileChatLayout } from './MobileChatLayout';
import { MobileListLayout } from './MobileListLayout';

export type MobileChatView = 'list' | 'chat';

export interface MobileChatContainerProps {
  /** 初始视图（默认 list） */
  initialView?: MobileChatView;
  /** 初始会话 ID */
  initialConversationId?: string;
  /** 列表视图渲染函数 */
  renderListView?: (props: MobileChatListViewProps) => ReactNode;
  /** 聊天视图渲染函数 */
  renderChatView?: (props: MobileChatViewProps) => ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 关闭回调（传递给子组件） */
  onClose?: () => void;
  /** 是否显示关闭按钮（聊天视图） */
  showCloseButton?: boolean;
}

export interface MobileChatListViewProps {
  onSelectConversation: (conversation: Conversation) => void;
  view: 'list';
  onClose?: () => void;
}

export interface MobileChatViewProps {
  conversationId: string | undefined;
  onBack: () => void;
  view: 'chat';
  onClose?: () => void;
}

/**
 * MobileChatContainer：移动端聊天容器，管理 list ↔ chat 导航。
 *
 * @description
 * - 内部管理导航状态，无需宿主处理
 * - 提供 render props 模式，支持自定义列表和聊天视图
 * - 默认使用 MobileListLayout 和 MobileChatLayout
 *
 * @example
 * ```tsx
 * <MobileChatContainer onClose={() => setVisible(false)} />
 * ```
 *
 * @example 自定义渲染
 * ```tsx
 * <MobileChatContainer
 *   renderListView={(props) => <MyCustomList {...props} />}
 *   renderChatView={(props) => <MyCustomChat {...props} />}
 * />
 * ```
 */
export const MobileChatContainer = memo(
  ({
    initialView = 'list',
    initialConversationId,
    renderListView,
    renderChatView,
    className,
    onClose,
    showCloseButton = true,
  }: MobileChatContainerProps) => {
    const [view, setView] = useState<'list' | 'chat'>(initialView);
    const [selectedConversationId, setSelectedConversationId] = useState<
      string | undefined
    >(initialConversationId);

    const handleSelectConversation = useCallback(
      (conversation: Conversation) => {
        setSelectedConversationId(conversation.id);
        setView('chat');
      },
      [],
    );

    const handleBack = useCallback(() => {
      setView('list');
    }, []);

    const listViewProps: MobileChatListViewProps = {
      onSelectConversation: handleSelectConversation,
      view: 'list',
      onClose,
    };

    const chatViewProps: MobileChatViewProps = {
      conversationId: selectedConversationId,
      onBack: handleBack,
      view: 'chat',
      onClose,
    };

    return (
      <div
        data-component="mobile-chat-container"
        className={cn(
          'h-full w-full overflow-hidden bg-muted text-foreground',
          className,
        )}
      >
        {view === 'list'
          ? (renderListView?.(listViewProps) ?? (
              <MobileListLayout
                onSelectConversation={(id) =>
                  handleSelectConversation({ id } as Conversation)
                }
                onClose={onClose}
              />
            ))
          : (renderChatView?.(chatViewProps) ?? (
              <MobileChatLayout
                conversationId={selectedConversationId}
                onBack={handleBack}
                onClose={showCloseButton ? onClose : undefined}
              />
            ))}
      </div>
    );
  },
);

MobileChatContainer.displayName = 'MobileChatContainer';
