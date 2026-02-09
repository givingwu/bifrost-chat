import type { StandardMessage } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import type { OfflineMessage } from '@/interfaces/offline-message.interface';

/**
 * 消息合并器
 *
 * @description
 * 负责合并服务端消息和本地失败消息
 * 确保刷新页面后失败的消息仍然显示
 *
 * @example
 * ```typescript
 * const mergedMessages = MessageMerger.merge(serverMessages, offlineMessages);
 * const isFailed = MessageMerger.isLocalFailedMessage(message);
 * ```
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <It was we expected>
export class MessageMerger {
  /**
   * 合并服务端消息和本地失败消息
   *
   * @param serverMessages 服务端消息列表
   * @param offlineMessages 本地失败消息列表
   * @returns 合并后的消息列表
   *
   * @description
   * 合并规则：
   * 1. 服务端消息优先
   * 2. 失败消息追加到列表
   * 3. 通过 tempId 去重
   * 4. 按时间排序
   */
  static merge(
    serverMessages: StandardMessage[],
    offlineMessages: OfflineMessage[],
  ): StandardMessage[] {
    // 1. 将失败消息转换为 StandardMessage
    const failedMessages = offlineMessages.map((offlineMsg) =>
      MessageMerger.offlineToStandard(offlineMsg),
    );

    // 2. 创建消息映射（用于去重）
    const messageMap = new Map<string, StandardMessage>();

    // 3. 先添加服务端消息
    for (const msg of serverMessages) {
      const key = msg.tempId || msg.id;
      messageMap.set(key, { ...msg, _source: 'server' });
    }

    // 4. 再添加失败消息（会覆盖同 tempId 的服务端消息）
    for (const msg of failedMessages) {
      const key = msg.tempId || msg.id;
      messageMap.set(key, { ...msg, _source: 'local' });
    }

    // 5. 转换为数组并排序
    const mergedMessages = Array.from(messageMap.values());

    return mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 将离线消息转换为标准消息
   *
   * @param offlineMsg 离线消息
   * @returns 标准消息
   *
   * @description
   * 转换规则：
   * - 使用离线消息的 ID 作为消息 ID
   * - 保存离线消息 ID 到 _offlineMessageId
   * - 状态设置为 Failed
   * - 标记来源为 local
   */
  static offlineToStandard(offlineMsg: OfflineMessage): StandardMessage {
    return {
      ...offlineMsg.message,
      id: offlineMsg.id,
      tempId: offlineMsg.id,
      status: MessageStatusEnum.Failed,
      _source: 'local',
      _offlineMessageId: offlineMsg.id, // 保存离线消息 ID，用于重试/删除
      error: offlineMsg.error,
    } as StandardMessage;
  }

  /**
   * 判断消息是否为本地失败消息
   *
   * @param message 消息对象
   * @returns 是否为本地失败消息
   *
   * @description
   * 判断条件：
   * - _source 为 'local'
   * - status 为 Failed
   */
  static isLocalFailedMessage(message: StandardMessage): boolean {
    return (
      message._source === 'local' && message.status === MessageStatusEnum.Failed
    );
  }

  /**
   * 过滤出本地失败消息
   *
   * @param messages 消息列表
   * @returns 本地失败消息列表
   */
  static filterLocalFailedMessages(
    messages: StandardMessage[],
  ): StandardMessage[] {
    return messages.filter(MessageMerger.isLocalFailedMessage);
  }

  /**
   * 过滤出服务端消息
   *
   * @param messages 消息列表
   * @returns 服务端消息列表
   */
  static filterServerMessages(messages: StandardMessage[]): StandardMessage[] {
    return messages.filter((msg) => msg._source === 'server' || !msg._source);
  }
}
