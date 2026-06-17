import type { QueryClient } from '@tanstack/react-query';
import {
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { logger } from '@/utils/logger.util';

function normalizeComparableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const nextValue = normalizeComparableValue(
          (value as Record<string, unknown>)[key],
        );

        if (nextValue !== undefined) {
          result[key] = nextValue;
        }

        return result;
      }, {});
  }

  return value;
}

function mergeDefinedMessage(
  existingMessage: StandardMessage,
  incomingMessage: StandardMessage,
): StandardMessage {
  const mergedMessage: Record<string, unknown> = {
    ...existingMessage,
  };

  for (const [key, value] of Object.entries(incomingMessage)) {
    if (value !== undefined) {
      mergedMessage[key] = value;
    }
  }

  return mergedMessage as unknown as StandardMessage;
}

const MESSAGE_STATUS_PRIORITY: Record<MessageStatusEnum, number> = {
  [MessageStatusEnum.Created]: 0,
  [MessageStatusEnum.Queued]: 0,
  [MessageStatusEnum.Sending]: 1,
  [MessageStatusEnum.Sent]: 2,
  [MessageStatusEnum.Delivered]: 3,
  [MessageStatusEnum.Read]: 4,
  [MessageStatusEnum.Clicked]: 5,
  [MessageStatusEnum.Failed]: 1,
  [MessageStatusEnum.Revoked]: 6,
  [MessageStatusEnum.Deleted]: 6,
};

function shouldApplyStatusUpdate(
  currentStatus: StandardMessage['status'] | undefined,
  nextStatus: StandardMessage['status'] | undefined,
): boolean {
  if (!nextStatus) {
    return false;
  }

  if (!currentStatus) {
    return true;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === MessageStatusEnum.Failed) {
    return ![
      MessageStatusEnum.Delivered,
      MessageStatusEnum.Read,
      MessageStatusEnum.Clicked,
      MessageStatusEnum.Revoked,
      MessageStatusEnum.Deleted,
    ].includes(currentStatus);
  }

  if (currentStatus === MessageStatusEnum.Failed) {
    return ![
      MessageStatusEnum.Created,
      MessageStatusEnum.Queued,
      MessageStatusEnum.Sending,
    ].includes(nextStatus);
  }

  return (
    MESSAGE_STATUS_PRIORITY[nextStatus] >=
    MESSAGE_STATUS_PRIORITY[currentStatus]
  );
}

function mergeMessageUpdates(
  currentMessage: StandardMessage,
  updates: Partial<StandardMessage>,
): StandardMessage {
  const mergedMessage = {
    ...currentMessage,
    ...updates,
  };

  if (
    'status' in updates &&
    !shouldApplyStatusUpdate(currentMessage.status, updates.status)
  ) {
    mergedMessage.status = currentMessage.status;
  }

  if (updates.metadata) {
    mergedMessage.metadata = {
      ...currentMessage.metadata,
      ...updates.metadata,
    };
  }

  return mergedMessage;
}

interface MessageIdentityMatch {
  reason: 'id' | 'tempId' | 'id_tempId';
  isSameContent: boolean;
}

function matchMessageIdentity(
  existingMessage: StandardMessage,
  incomingMessage: StandardMessage,
): MessageIdentityMatch | null {
  if (incomingMessage.id && existingMessage.id === incomingMessage.id) {
    return {
      reason: 'id',
      isSameContent:
        JSON.stringify(normalizeComparableValue(existingMessage.content)) ===
        JSON.stringify(normalizeComparableValue(incomingMessage.content)),
    };
  }

  if (
    incomingMessage.tempId &&
    existingMessage.tempId === incomingMessage.tempId
  ) {
    return {
      reason: 'tempId',
      isSameContent: true,
    };
  }

  if (
    (incomingMessage.id && existingMessage.tempId === incomingMessage.id) ||
    (incomingMessage.tempId && existingMessage.id === incomingMessage.tempId)
  ) {
    return {
      reason: 'id_tempId',
      isSameContent: true,
    };
  }

  return null;
}

function getComparableTimestamp(message: StandardMessage): number {
  return typeof message.timestamp === 'number'
    ? message.timestamp
    : Number.POSITIVE_INFINITY;
}

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
   * 判断两条消息内容是否一致。
   * 主要用于兼容后端重复返回同一 MID 的历史消息。
   */
  static isSameMessageContent(
    left: StandardMessage,
    right: StandardMessage,
  ): boolean {
    return (
      JSON.stringify(normalizeComparableValue(left.content)) ===
      JSON.stringify(normalizeComparableValue(right.content))
    );
  }

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
    logger.info('[MessageCacheHelper.messageExists] 开始检查消息是否存在', {
      newMessageId: message.id,
      newTempId: message.tempId,
      totalMessages: messages.length,
    });

    const matchedMessage = messages.find((msg) =>
      matchMessageIdentity(msg, message),
    );
    const duplicateMatch = matchedMessage
      ? matchMessageIdentity(matchedMessage, message)
      : null;
    const exists = !!duplicateMatch;

    if (matchedMessage && duplicateMatch) {
      if (duplicateMatch.reason === 'id' && !duplicateMatch.isSameContent) {
        logger.warn(
          '[MessageCacheHelper.messageExists] 发现相同 id 但内容不一致，按幂等消息处理',
          {
            id: message.id,
            existingMessage: matchedMessage,
            incomingMessage: message,
          },
        );
      }

      if (duplicateMatch.reason === 'id') {
        logger.warn('[MessageCacheHelper.messageExists] 发现相同的 id', {
          id: message.id,
          isSameContent: duplicateMatch.isSameContent,
          existingMessage: matchedMessage,
        });
      }

      if (duplicateMatch.reason === 'tempId') {
        logger.warn('[MessageCacheHelper.messageExists] 发现相同的 tempId', {
          tempId: message.tempId,
          existingMessage: matchedMessage,
        });
      }

      if (duplicateMatch.reason === 'id_tempId') {
        logger.warn(
          '[MessageCacheHelper.messageExists] 发现 id 与 tempId 交叉重复',
          {
            messageId: message.id,
            tempId: message.tempId,
            existingMessage: matchedMessage,
          },
        );
      }
    }

    logger.info('[MessageCacheHelper.messageExists] 检查结果:', exists);
    return exists;
  }

  /**
   * 对消息数组进行幂等去重，保留原始顺序。
   * 相同 id/MID 的消息视为同一条消息；若内容不一致，记录告警并保留后到的已定义字段。
   */
  static dedupeMessages(messages: StandardMessage[]): StandardMessage[] {
    const deduplicatedMessages: StandardMessage[] = [];

    for (const message of messages) {
      const duplicateIndex = deduplicatedMessages.findIndex(
        (existingMessage) => !!matchMessageIdentity(existingMessage, message),
      );

      if (duplicateIndex < 0) {
        deduplicatedMessages.push(message);
        continue;
      }

      deduplicatedMessages[duplicateIndex] = mergeDefinedMessage(
        deduplicatedMessages[duplicateIndex],
        message,
      );
    }

    return deduplicatedMessages;
  }

  /**
   * 按消息时间升序排序，时间相同时保留原始相对顺序。
   * MessageList 会依赖“旧消息在前，新消息在后”的输入顺序。
   */
  static sortMessagesByTimestamp(
    messages: StandardMessage[],
  ): StandardMessage[] {
    return messages
      .map((message, index) => ({ message, index }))
      .sort((left, right) => {
        const timestampDiff =
          getComparableTimestamp(left.message) -
          getComparableTimestamp(right.message);

        if (timestampDiff !== 0) {
          return timestampDiff;
        }

        return left.index - right.index;
      })
      .map(({ message }) => message);
  }

  /**
   * 先做幂等去重，再按 timestamp 升序排序。
   */
  static dedupeAndSortMessages(messages: StandardMessage[]): StandardMessage[] {
    return MessageCacheHelper.sortMessagesByTimestamp(
      MessageCacheHelper.dedupeMessages(messages),
    );
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
   * @param options.channel 当前渠道，需与 useMessages 的 query key 一致
   *
   * @description
   * - 自动去重（基于 id 和 tempId）
   * - 添加到最新页的末尾
   * - 如果没有页面，创建新页面
   * - channel 必须与 useMessages 传入的 currentChannel 一致，否则乐观更新无法被 UI 读取
   */
  static addMessageToCache(
    queryClient: QueryClient,
    conversationId: string,
    message: StandardMessage,
    options?: { channel?: string },
  ): void {
    const queryKey = queryKeys.messages.list(conversationId, options?.channel);

    logger.info('[MessageCacheHelper.addMessageToCache] 开始添加消息', {
      conversationId,
      messageId: message.id,
      tempId: message.tempId,
      timestamp: message.timestamp,
    });

    queryClient.setQueryData<InfiniteQueryData>(queryKey, (old) => {
      if (!old) {
        logger.info(
          '[MessageCacheHelper.addMessageToCache] 没有旧数据，创建新页面',
        );
        // 如果没有旧数据，创建新页面
        return {
          pages: [{ items: [message] }],
          pageParams: [undefined],
        };
      }

      logger.info(
        '[MessageCacheHelper.addMessageToCache] 当前页面数:',
        old.pages.length,
      );
      logger.info(
        '[MessageCacheHelper.addMessageToCache] 各页面消息数:',
        old.pages.map((p) => p.items.length),
      );

      // 检查消息是否已存在
      const allMessages = old.pages.flatMap((page) => page.items);
      logger.info(
        '[MessageCacheHelper.addMessageToCache] 总消息数:',
        allMessages.length,
      );

      if (MessageCacheHelper.messageExists(allMessages, message)) {
        logger.warn(
          '[MessageCacheHelper.addMessageToCache] 消息已存在，跳过添加',
          {
            messageId: message.id,
            tempId: message.tempId,
          },
        );
        // 消息已存在，返回旧数据（不触发更新）
        return old;
      }

      // pages[0] 始终是最新页；fetchNextPage 追加的是更旧的历史页
      // 新消息进入缓存后，页内仍需按 timestamp 升序保持稳定顺序。
      logger.info('[MessageCacheHelper.addMessageToCache] 添加到最新页并重排');
      const newPages = old.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              items: MessageCacheHelper.sortMessagesByTimestamp([
                ...page.items,
                message,
              ]),
            }
          : page,
      );

      logger.info(
        '[MessageCacheHelper.addMessageToCache] 添加后的页面消息数:',
        newPages.map((p) => p.items.length),
      );

      return { ...old, pages: newPages };
    });

    logger.info('[MessageCacheHelper.addMessageToCache] 缓存更新完成');
  }

  /**
   * 更新无限查询缓存中的消息状态
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param updates 要更新的字段
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   * @param options.channel 当前渠道，需与 useMessages 的 query key 一致
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
    options?: { channel?: string },
  ): void {
    const queryKey = queryKeys.messages.list(conversationId, options?.channel);

    queryClient.setQueryData<InfiniteQueryData>(queryKey, (old) => {
      if (!old) return old;

      const shouldResortMessages = 'timestamp' in updates;
      const newPages = old.pages.map((page) => ({
        ...page,
        items: shouldResortMessages
          ? MessageCacheHelper.sortMessagesByTimestamp(
              page.items.map((msg) => {
                const isMatch =
                  (messageId && msg.id === messageId) ||
                  (tempId && msg.tempId === tempId) ||
                  (messageId && msg.tempId === messageId) ||
                  (tempId && msg.id === tempId);

                return isMatch ? mergeMessageUpdates(msg, updates) : msg;
              }),
            )
          : page.items.map((msg) => {
              const isMatch =
                (messageId && msg.id === messageId) ||
                (tempId && msg.tempId === tempId) ||
                (messageId && msg.tempId === messageId) ||
                (tempId && msg.id === tempId);

              return isMatch ? mergeMessageUpdates(msg, updates) : msg;
            }),
      }));

      return { ...old, pages: newPages };
    });
  }

  /**
   * 更新消息状态
   *
   * @param queryClient QueryClient 实例
   * @param conversationId 会话 ID
   * @param status 新状态
   * @param messageId 消息 ID
   * @param tempId 临时消息 ID
   * @param options.channel 当前渠道，需与 useMessages 的 query key 一致
   */
  static updateMessageStatus(
    queryClient: QueryClient,
    conversationId: string,
    status: StandardMessage['status'],
    messageId?: string,
    tempId?: string,
    options?: { channel?: string },
  ): void {
    MessageCacheHelper.updateMessageInCache(
      queryClient,
      conversationId,
      { status },
      messageId,
      tempId,
      options,
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
          items: MessageCacheHelper.sortMessagesByTimestamp(
            page.items.map((msg) =>
              msg.tempId === tempId ? realMessage : msg,
            ),
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
   * - 批量添加到最新页
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
            pages: [
              {
                items: MessageCacheHelper.dedupeAndSortMessages(messages),
              },
            ],
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

        // pages[0] 始终是最新页；fetchNextPage 追加的是更旧的历史页
        const newPages = old.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                items: MessageCacheHelper.sortMessagesByTimestamp([
                  ...page.items,
                  ...newMessages,
                ]),
              }
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
    options?: { channel?: string },
  ): StandardMessage[] {
    const data = queryClient.getQueryData<InfiniteQueryData>(
      queryKeys.messages.list(conversationId, options?.channel),
    );

    if (!data) return [];

    return MessageCacheHelper.dedupeAndSortMessages(
      data.pages.flatMap((page) => page.items),
    );
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
    _params?: unknown,
  ): void {
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages.list(conversationId),
      // queryFn 需要从外部注入
    });
  }
}
