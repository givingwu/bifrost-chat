/**
 * Packet 相关工具函数
 *
 * @description
 * 提供 Packet 数据结构通用的提取和转换能力
 *
 * @module utils/packet
 */

/**
 * 从 packet 中提取消息 ID
 *
 * @description
 * 按优先级依次尝试：packet.id -> body.id -> body.mid (string) -> body.mid (number)
 *
 * @param packetId - packet 层级的 id
 * @param bodyId - body 层级的 id
 * @param bodyMid - body 层级的 mid（可能是 string 或 number）
 * @returns 提取到的消息 ID，若无法提取则返回 null
 *
 * @example
 * ```typescript
 * // 从 packet.id 提取
 * extractMessageId('msg-123', undefined, undefined) // 'msg-123'
 *
 * // 从 body.id 提取
 * extractMessageId(undefined, 'body-456', undefined) // 'body-456'
 *
 * // 从 body.mid (string) 提取
 * extractMessageId(undefined, undefined, 'mid-789') // 'mid-789'
 *
 * // 从 body.mid (number) 提取
 * extractMessageId(undefined, undefined, 12345) // '12345'
 *
 * // 无法提取
 * extractMessageId(undefined, undefined, undefined) // null
 * ```
 */
export function extractMessageId(
  packetId: unknown,
  bodyId: unknown,
  bodyMid: unknown,
): string | null {
  // 优先使用 packet.id
  if (typeof packetId === 'string' && packetId) {
    return packetId;
  }
  // 其次使用 body.id
  if (typeof bodyId === 'string' && bodyId) {
    return bodyId;
  }
  // 尝试 body.mid 作为字符串
  if (typeof bodyMid === 'string' && bodyMid) {
    return bodyMid;
  }
  // 最后尝试 body.mid 作为数字
  if (typeof bodyMid === 'number' && Number.isFinite(bodyMid)) {
    return String(bodyMid);
  }
  return null;
}

/**
 * 从 packet 中提取时间戳
 *
 * @description
 * 按优先级依次尝试：packet.timestamp -> body.timestamp
 *
 * @param packetTimestamp - packet 层级的 timestamp
 * @param bodyTimestamp - body 层级的 timestamp
 * @returns 提取到的时间戳，若无法提取则返回 undefined
 *
 * @example
 * ```typescript
 * extractTimestamp(1234567890, undefined) // 1234567890
 * extractTimestamp(undefined, 9876543210) // 9876543210
 * extractTimestamp(undefined, undefined) // undefined
 * ```
 */
export function extractTimestamp(
  packetTimestamp: unknown,
  bodyTimestamp: unknown,
): number | undefined {
  if (typeof packetTimestamp === 'number') {
    return packetTimestamp;
  }
  if (typeof bodyTimestamp === 'number') {
    return bodyTimestamp;
  }
  return undefined;
}

/**
 * 构建条件性对象字段
 *
 * @description
 * 当值为非空字符串时，将其添加到返回对象中
 *
 * @param key - 对象键名
 * @param value - 值（unknown 类型）
 * @returns 包含该键值对的对象，或空对象
 *
 * @example
 * ```typescript
 * optionalField('id', 'msg-123') // { id: 'msg-123' }
 * optionalField('id', '') // {}
 * optionalField('id', undefined) // {}
 * ```
 */
export function optionalField<T extends string>(
  key: T,
  value: unknown,
): Record<T, string> | Record<string, never> {
  if (typeof value === 'string' && value) {
    return { [key]: value } as Record<T, string>;
  }
  return {};
}

/**
 * 批量构建条件性对象字段
 *
 * @description
 * 从键值对映射中提取所有非空字符串值，构建为新对象
 *
 * @param fields - 键值对映射
 * @returns 仅包含非空字符串值的对象
 *
 * @example
 * ```typescript
 * buildOptionalFields({
 *   id: 'msg-123',
 *   chatId: '',
 *   sender: undefined,
 *   status: 'sent'
 * })
 * // { id: 'msg-123', status: 'sent' }
 * ```
 */
export function buildOptionalFields<T extends Record<string, unknown>>(
  fields: T,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value) {
      result[key] = value;
    }
  }
  return result;
}
