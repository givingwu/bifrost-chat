import { useMemo } from 'react';
import { useActiveConversationId } from '@/store';
import { useConversationMetadata } from './use-conversation-metadata.hook';

/**
 * 读取当前激活会话的 metadata。
 *
 * @description
 * 该 Hook 不再修改全局 `strategy.allowedChannels`，
 * 只负责基于当前激活会话的详情缓存派生 metadata。
 *
 * @returns 当前激活会话的 metadata 查询结果
 */
export function useActiveConversationMetadata() {
  const activeConversationId = useActiveConversationId();
  const query = useConversationMetadata(activeConversationId);

  const metadata = useMemo(() => query.data ?? null, [query.data]);

  return {
    ...query,
    metadata,
  };
}
