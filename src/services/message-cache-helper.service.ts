import type { QueryClient } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';

/**
 * 无限查询页面结构
 */
export interface InfiniteQueryPage {
  items: StandardMessage[];
  nextCursor?: unknown;
}

/**
 * 无限查询数据结构
 */
export interface InfiniteQueryData {
  pages: InfiniteQueryPage[];
  pageParams: unknown[];
}

/**
 * MessageCacheHelper：消息缓存辅助工具
 *
 * @description
 * 提供统一的无限查询缓存更新函数，处理消息去重、状态更新和新消息添加。
 * 解决 WebSocket 推送与乐观更新之间的冲突问题。
 *
 * @example
 * ```typescript
 * // 添加新消息到缓存
 * MessageCacheHelper.addMessageToCache(queryClient, conversationId, newMessage);
 *
 * // 更新消息状态
 * MessageCacheHelper.updateMessageStatus(queryClient, conversationId, messageId, newStatus);
 *
 * // 检查消息是否已存在
 * const exists = MessageCacheHelper.messageExists(messages, newMessage);
 * ```
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <Static Class>
export class MessageCacheHelper {
  /**
   * 检查消息是否已存在于列表中
   *
   * @param messages 消息列表
   * @param message 要检查的消息
   * @returns 是否已存在
   *
   * @description
   * 通过 id 或 tempId 判断消息是否已存在
   */
  static messageExists(
    messages: StandardMessage[],
    message: StandardMessage,
  ): boolean {
    console.log('[MessageCacheHelper.messageExists] 开始检查消息是否存在', {
      newMessageId: message.id,
      newTempId: message.tempId,
      totalMessages: messages.length,
    });

    const exists = messages.some((msg) => {
      // 检查 id 是否相同（都需要有 id）
      if (message.id && msg.id === message.id) {
        console.warn('[MessageCacheHelper.messageExists] 发现相同的 id', {
          id: message.id,
          existingMessage: msg,
        });
        return true;
      }
      // 检查 tempId 是否相同（都需要有 tempId）
      if (message.tempId && msg.tempId === message.tempId) {
        console.warn('[MessageCacheHelper.messageExists] 发现相同的 tempId', {
          tempId: message.tempId,
          existingMessage: msg,
        });
        return true;
      }
      // 检查 id 是否与 tempId 相同（处理临时消息被更新的情况）
      if (message.id && msg.tempId === message.id) {
        console.warn(
          '[MessageCacheHelper.messageExists] 发现 id 与 tempId 相同',
          {
            id: message.id,
            existingTempId: msg.tempId,
          },
        );
        return true;
      }
      // 检查 tempId 是否与 id 相同（处理临时消息被更新的情况）
      if (message.tempId && msg.id === message.tempId) {
        console.warn(
          '[MessageCacheHelper.messageExists] 发现 tempId 与 id 相同',
          {
            tempId: message.tempId,
            existingId: msg.id,
          },
        );
        return true;
      }
      return false;
    });

    console.log('[MessageCacheHelper.messageExists] 检查结果:', exists);
    return exists;
  }

  /**
   * 在无限查询数据中查找消息
   *
   * @param data 无限查询数据
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   * @returns 找到的消息及其位置
   */
  static findMessageInInfiniteData(
    data: InfiniteQueryData | undefined,
    messageId?: string,
    tempId?: string,
  ): { message: StandardMessage; pageIndex: number; itemIndex: number } | null {
    if (!data) return null;

    for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
      const page = data.pages[pageIndex];

      for (let itemIndex = 0; itemIndex < page.items.length; itemIndex++) {
        const msg = page.items[itemIndex];

        if (
          (messageId && msg.id === messageId) ||
          (tempId && msg.tempId === tempId)
        ) {
          return { message: msg, pageIndex, itemIndex };
        }
      }
    }

    return null;
  }

  /**
   * 添加新消息到无限查询缓存
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param message 要添加的消息
   *
   * @description
   * - 自动去重（基于 id 和 tempId）
   * - 添加到最后一页的末尾
   * - 如果没有页面，创建新页面
   */
  static addMessageToCache(
    queryClient: QueryClient,
    conversationId: string,
    message: StandardMessage,
  ): void {
    console.log('[MessageCacheHelper.addMessageToCache] 开始添加消息', {
      conversationId,
      messageId: message.id,
      tempId: message.tempId,
      timestamp: message.timestamp,
    });

    queryClient.setQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
      (old) => {
        if (!old) {
          console.log(
            '[MessageCacheHelper.addMessageToCache] 没有旧数据，创建新页面',
          );
          // 如果没有旧数据，创建新页面
          return {
            pages: [{ items: [message] }],
            pageParams: [undefined],
          };
        }

        console.log(
          '[MessageCacheHelper.addMessageToCache] 当前页面数:',
          old.pages.length,
        );
        console.log(
          '[MessageCacheHelper.addMessageToCache] 各页面消息数:',
          old.pages.map((p) => p.items.length),
        );

        // 检查消息是否已存在
        const allMessages = old.pages.flatMap((page) => page.items);
        console.log(
          '[MessageCacheHelper.addMessageToCache] 总消息数:',
          allMessages.length,
        );

        if (MessageCacheHelper.messageExists(allMessages, message)) {
          console.warn(
            '[MessageCacheHelper.addMessageToCache] 消息已存在，跳过添加',
            {
              messageId: message.id,
              tempId: message.tempId,
            },
          );
          // 消息已存在，返回旧数据（不触发更新）
          return old;
        }

        // ✅ 修复：添加到第一页的开头（索引0），而不是最后一页的末尾
        // 原因：第一页（page 0）存储最新消息，索引0是最新的
        // 新消息应该插入到索引0，确保在反转后显示在最下面
        // 插入后：[newMessage,30,29,...,1] → 反转后：[60,...,31,30,...,1, newMessage] ✓
        console.log(
          '[MessageCacheHelper.addMessageToCache] 添加到第一页（page 0）的开头',
        );
        console.log(
          '[MessageCacheHelper.addMessageToCache] 第一页（page 0）的前3条消息:',
          old.pages[0].items.slice(0, 3).map((m) => ({
            id: m.id,
            tempId: m.tempId,
            timestamp: m.timestamp,
          })),
        );
        console.log('[MessageCacheHelper.addMessageToCache] 新消息:', {
          id: message.id,
          tempId: message.tempId,
          timestamp: message.timestamp,
        });
        const newPages = old.pages.map((page, index) =>
          index === 0 ? { ...page, items: [message, ...page.items] } : page,
        );

        console.log(
          '[MessageCacheHelper.addMessageToCache] 添加后的页面消息数:',
          newPages.map((p) => p.items.length),
        );
        console.log(
          '[MessageCacheHelper.addMessageToCache] 添加后第一页的前3条消息:',
          newPages[0].items.slice(0, 3).map((m) => ({
            id: m.id,
            tempId: m.tempId,
            timestamp: m.timestamp,
          })),
        );

        return { ...old, pages: newPages };
      },
    );

    console.log('[MessageCacheHelper.addMessageToCache] 缓存更新完成');
  }

  /**
   * 更新无限查询缓存中的消息状态
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   * @param updates 要更新的字段
   *
   * @description
   * - 通过 messageId 或 tempId 查找消息
   * - 更新消息的指定字段
   */
  static updateMessageInCache(
    queryClient: QueryClient,
    conversationId: string,
    updates: Partial<StandardMessage>,
    messageId?: string,
    tempId?: string,
  ): void {
    queryClient.setQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
      (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((msg) => {
            // 匹配 messageId 或 tempId
            const isMatch =
              (messageId && msg.id === messageId) ||
              (tempId && msg.tempId === tempId) ||
              (messageId && msg.tempId === messageId) || // 处理 tempId 被更新为 messageId 的情况
              (tempId && msg.id === tempId);

            return isMatch ? { ...msg, ...updates } : msg;
          }),
        }));

        return { ...old, pages: newPages };
      },
    );
  }

  /**
   * 更新消息状态
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   * @param status 新状态
   */
  static updateMessageStatus(
    queryClient: QueryClient,
    conversationId: string,
    status: StandardMessage['status'],
    messageId?: string,
    tempId?: string,
  ): void {
    MessageCacheHelper.updateMessageInCache(
      queryClient,
      conversationId,
      { status },
      messageId,
      tempId,
    );
  }

  /**
   * 替换临时消息为真实消息
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param tempId 临时消息 ID
   * @param realMessage 真实消息
   *
   * @description
   * - 用于处理消息发送成功后的回调
   * - 将临时消息替换为服务器返回的真实消息
   * - 保留临时消息的位置，避免消息跳动
   */
  static replaceTempMessageWithRealMessage(
    queryClient: QueryClient,
    conversationId: string,
    tempId: string,
    realMessage: StandardMessage,
  ): void {
    queryClient.setQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
      (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((msg) =>
            msg.tempId === tempId ? realMessage : msg,
          ),
        }));

        return { ...old, pages: newPages };
      },
    );
  }

  /**
   * 批量添加消息到缓存
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param messages 要添加的消息列表
   *
   * @description
   * - 自动去重
   * - 批量添加到最后一页
   */
  static addMessagesToCache(
    queryClient: QueryClient,
    conversationId: string,
    messages: StandardMessage[],
  ): void {
    queryClient.setQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
      (old) => {
        if (!old) {
          return {
            pages: [{ items: messages }],
            pageParams: [undefined],
          };
        }

        // 过滤出未存在的消息
        const allMessages = old.pages.flatMap((page) => page.items);
        const newMessages = messages.filter(
          (msg) => !MessageCacheHelper.messageExists(allMessages, msg),
        );

        if (newMessages.length === 0) {
          return old;
        }

        // 添加到最后一页
        const newPages = old.pages.map((page, index) =>
          index === 0
            ? { ...page, items: [...newMessages, ...page.items] }
            : page,
        );

        return { ...old, pages: newPages };
      },
    );
  }

  /**
   * 从缓存中删除消息
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   */
  static removeMessageFromCache(
    queryClient: QueryClient,
    conversationId: string,
    messageId?: string,
    tempId?: string,
  ): void {
    queryClient.setQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
      (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          items: page.items.filter(
            (msg) =>
              !(
                (messageId && msg.id === messageId) ||
                (tempId && msg.tempId === tempId)
              ),
          ),
        }));

        return { ...old, pages: newPages };
      },
    );
  }

  /**
   * 获取会话的所有消息（扁平化）
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @returns 所有消息的扁平化列表
   */
  static getAllMessagesFromCache(
    queryClient: QueryClient,
    conversationId: string,
  ): StandardMessage[] {
    const data = queryClient.getQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId),
    );

    if (!data) return [];

    return data.pages.flatMap((page) => page.items);
  }

  /**
   * 使消息缓存失效
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   */
  static invalidateMessages(
    queryClient: QueryClient,
    conversationId: string,
  ): void {
    queryClient.invalidateQueries({
      queryKey: queryKeys.messages.list(conversationId),
    });
  }

  /**
   * 预取消息列表
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param params 查询参数
   */
  static prefetchMessages(
    queryClient: QueryClient,
    conversationId: string,
    params?: unknown,
  ): void {
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages.list(conversationId),
      // queryFn 需要从外部注入
    });
  }
}
