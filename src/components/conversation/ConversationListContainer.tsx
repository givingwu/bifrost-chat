import { useConversations } from '@/hooks/use-conversations.hook';
import { ConversationList } from './ConversationList';

export interface ConversationListContainerProps {
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * ConversationListContainer：会话列表容器组件
 *
 * @description
 * 使用 React Query Hook 获取会话列表数据，并传递给展示组件。
 * 这是新架构的推荐使用方式。
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ServiceProvider {...services}>
 *       <ConversationListContainer onSelect={(id) => console.log(id)} />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function ConversationListContainer({
  onSelect,
  className,
}: ConversationListContainerProps) {
  const { data: conversations, isLoading, error } = useConversations();

  // 错误状态（可以添加更详细的错误处理）
  if (error) {
    console.error('Failed to load conversations:', error);
    return (
      <div className="px-4 py-12 text-center text-red-500">
        加载失败，请重试
      </div>
    );
  }

  return (
    <ConversationList
      conversations={conversations}
      onSelect={onSelect}
      isLoading={isLoading}
      className={className}
    />
  );
}
