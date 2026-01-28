import type { SDKEvent } from '@/interfaces/sdk.interface';

type Listener<T> = (payload: T) => void;

/**
 * ClientBus：Host 与 SDK 之间的事件总线（Observer）。
 * - 事件类型由 SDKEvent 约束。
 * - 不持有业务状态，只负责事件转发。
 */
export class ClientBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  /**
   * 订阅 SDK 事件。
   */
  on<T>(event: SDKEvent, callback: Listener<T>) {
    const existing = this.listeners.get(event) ?? new Set();
    existing.add(callback as Listener<unknown>);
    this.listeners.set(event, existing);
  }

  /**
   * 取消订阅 SDK 事件。
   */
  off<T>(event: SDKEvent, callback: Listener<T>) {
    const existing = this.listeners.get(event);
    if (!existing) {
      return;
    }

    existing.delete(callback as Listener<unknown>);
    if (existing.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 派发事件给所有订阅者。
   */
  emit<T>(event: SDKEvent, payload: T) {
    const existing = this.listeners.get(event);

    if (!existing) {
      return;
    }

    for (const callback of existing) {
      callback(payload as unknown);
    }
  }
}
