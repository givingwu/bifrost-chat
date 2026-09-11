import { useCallback } from 'react';
import { useActions } from '@/store';

/**
 * 设置激活会话的场景类型
 */
export enum ActivateConversationScenario {
  /** 从系统打开（URL 参数、系统集成等） - 不置顶 */
  System = 'system',
  /** 从联系人发起聊天 - 置顶 */
  Contact = 'contact',
  /** 点击会话切换 - 不置顶 */
  Click = 'click',
  /** 新会话创建 - 置顶 */
  NewConversation = 'new_conversation',
}

/**
 * useSetActiveConversation：设置激活会话的 Hook。
 *
 * @description
 * 提供场景化的会话激活策略，支持是否置顶到列表顶部。
 *
 * @example
 * ```tsx
 * const { setActiveConversation, activateConversation, unpinConversation } = useSetActiveConversation();
 *
 * // 从联系人发起聊天（置顶）
 * activateConversation('conv-123', ActivateConversationScenario.Contact);
 *
 * // 点击会话切换（不置顶）
 * activateConversation('conv-456', ActivateConversationScenario.Click);
 *
 * // 从系统打开（不置顶）
 * activateConversation('conv-789', ActivateConversationScenario.System);
 *
 * // 新会话创建（置顶）
 * activateConversation('conv-abc', ActivateConversationScenario.NewConversation);
 *
 * // 手动取消置顶
 * unpinConversation('conv-123');
 * ```
 */
export function useSetActiveConversation() {
  const actions = useActions();

  /**
   * 激活会话（场景化）
   * @param conversationId - 会话 ID
   * @param scenario - 激活场景
   */
  const activateConversation = useCallback(
    (conversationId: string, scenario: ActivateConversationScenario) => {
      const pinToTop = [
        ActivateConversationScenario.Contact,
        ActivateConversationScenario.NewConversation,
      ].includes(scenario);

      actions.setActiveConversationId(conversationId, { pinToTop });
    },
    [actions],
  );

  /**
   * 设置激活会话（底层 API）
   * @param conversationId - 会话 ID
   * @param options - 选项
   */
  const setActiveConversation = useCallback(
    (conversationId: string, options?: { pinToTop?: boolean }) => {
      actions.setActiveConversationId(conversationId, options);
    },
    [actions],
  );

  return {
    setActiveConversation,
    activateConversation,
    unpinConversation: actions.unpinConversation,
    clearPinnedConversations: actions.clearPinnedConversations,
  };
}
