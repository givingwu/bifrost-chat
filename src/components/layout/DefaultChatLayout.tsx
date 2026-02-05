import type { ReactNode } from 'react';
import { DefaultChatLayoutContainer } from './DefaultChatLayoutContainer';

export interface DefaultChatLayoutProps {
  /** 消息区域内容（可选） */
  children?: ReactNode;
  /** 会话 ID */
  conversationId?: string;
}

/**
 * DefaultChatLayout：默认布局（All-in-One 模式）。
 *
 * @deprecated 请使用 DefaultChatLayoutContainer 代替
 *
 * @example
 * ```tsx
 * // 新用法（推荐）
 * <DefaultChatLayoutContainer conversationId="conv-123">
 *   <ChatMessageListContainer conversationId="conv-123" />
 * </DefaultChatLayoutContainer>
 *
 * // 旧用法（已废弃）
 * <DefaultChatLayout>
 *   <CustomMessageList />
 * </DefaultChatLayout>
 * ```
 */
export const DefaultChatLayout = ({ children }: DefaultChatLayoutProps) => {
  return <DefaultChatLayoutContainer>{children}</DefaultChatLayoutContainer>;
};
