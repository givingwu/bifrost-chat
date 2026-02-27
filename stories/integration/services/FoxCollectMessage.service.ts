import { type RawPacket, WebSocketEventTypeEnum } from '@/index';
import type { SendAttachmentResult } from '@/interfaces/attachment.interface';
import type { SendAudioResult } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  type ClientTypeEnum,
  MessageDirectionEnum,
  type MessageSendResult,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type {
  IMessageService,
  MessageReceivedEvent,
  MessageStatusUpdatedEvent,
} from '@/services/message.service';
import { PacketConverter } from '@/services/protocol';
import { WebSocketManager } from '@/services/websocket/websocket-manager.service';
import { toRecord } from '../utils/converter.util';
import type { FoxCollectConfig } from './FoxCollectConversation.service';

interface FoxCollectMessageListParams {
  page?: number;
  pageSize?: number;
}

interface FoxCollectSendParams {
  id?: string;
  type?: 'template' | 'custom';
  messageType?: MessageTypeEnum;
  channelType?: ChannelTypeEnum;
  clientType?: string;
  receiverPin?: string;
  receiverClientType?: string;
  content?: Record<string, unknown>;
  template?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

interface FoxCollectReadParams {
  messageId: string;
  sessionId?: string;
  chatId?: string;
  receiverPin?: string;
}

/**
 * FoxCollect 消息服务
 */
export class FoxCollectMessageService
  implements
    IMessageService<
      FoxCollectMessageListParams,
      FoxCollectSendParams,
      FoxCollectReadParams,
      never,
      never
    >
{
  private readonly messageListeners: Array<
    (event: MessageReceivedEvent) => void
  > = [];
  private readonly statusListeners: Array<
    (event: MessageStatusUpdatedEvent) => void
  > = [];

  private readonly wsManager: WebSocketManager;
  private readonly unsubscribeMessage: (() => void) | null;

  constructor(private readonly config: FoxCollectConfig) {
    this.wsManager = new WebSocketManager({
      url: config.wsEndpoint,
      token: config.token,
      autoReconnect: true,
      heartbeatInterval: 30_000,
      enableProtocolConversion: true,
      currentPin: config.agentPin,
      fromApp: config.app,
      fromPin: config.agentPin,
    });

    this.unsubscribeMessage = this.wsManager.onMessage((event) => {
      this.handleMessage(event);
    });

    void this.wsManager.connect().catch(() => {
      // Story 场景允许离线运行，失败时由 send 返回 failed
    });
  }

  async list(
    conversationId: string,
    _params: FoxCollectMessageListParams,
  ): Promise<StandardMessage[]> {
    const response = await fetch(
      `${this.config.endpoint}/conversations/${conversationId}/messages`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    const result = toRecord(await response.json());
    const data = Array.isArray(result.data) ? result.data : [];

    return data.map((item) => this.convertPacketToStandardMessage(item));
  }

  async send(
    conversationId: string,
    params: FoxCollectSendParams,
  ): Promise<MessageSendResult> {
    const tempId = params.id ?? `temp_${Date.now()}`;

    const check = await this.checkMessage({
      id: tempId,
      chatId: conversationId,
      channelType: params.channelType ?? ChannelTypeEnum.WhatsApp,
      type: params.type ?? 'custom',
      clientType: params.clientType,
      template: params.template,
    });

    if (!check.allowed) {
      return {
        tempId,
        status: MessageStatusEnum.Failed,
        error: check.message ?? '消息检查失败',
      };
    }

    const standardMessage = this.buildStandardMessage(params, tempId);

    if (this.wsManager.isConnected()) {
      this.wsManager.sendStandardMessage(standardMessage, {
        chatId: conversationId,
        entry: 'fox.collect.detail',
      });
      return {
        tempId,
        status: MessageStatusEnum.Sending,
      };
    }

    return {
      tempId,
      status: MessageStatusEnum.Failed,
      error: 'WebSocket 未连接',
    };
  }

  async markAsRead(params: FoxCollectReadParams): Promise<void> {
    if (this.wsManager.isConnected()) {
      this.wsManager.sendReadAck({
        sender: this.config.agentPin,
        app: this.config.app,
        messageId: params.messageId,
        chatId: params.sessionId ?? params.chatId ?? '',
        datetime: Date.now(),
        toApp: 'im.waiter',
        toPin: params.receiverPin ?? '',
      });
    }
  }

  subscribeToMessages(
    callback: (event: MessageReceivedEvent) => void,
  ): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index >= 0) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  subscribeToMessageStatus(
    callback: (event: MessageStatusUpdatedEvent) => void,
  ): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index >= 0) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  async sendAttachment(): Promise<SendAttachmentResult> {
    return {
      tempId: `temp_${Date.now()}`,
      status: 'failed',
      error: 'FoxCollectMessageService.sendAttachment is not implemented',
    };
  }

  async sendAudio(): Promise<SendAudioResult> {
    return {
      type: MessageTypeEnum.Audio,
      tempId: `temp_${Date.now()}`,
      status: 'failed',
      error: 'FoxCollectMessageService.sendAudio is not implemented',
    };
  }

  disconnect(): void {
    this.unsubscribeMessage?.();
    this.wsManager.destroy();
  }

  private handleMessage(event: {
    type: WebSocketEventTypeEnum;
    data: unknown;
  }): void {
    if (event.type === WebSocketEventTypeEnum.Message) {
      const data = toRecord(event.data);
      const message = data.message as StandardMessage | undefined;
      const conversationId = String(data.conversationId ?? '');

      if (!message || !conversationId) {
        return;
      }

      const messageEvent: MessageReceivedEvent = {
        conversationId,
        message,
      };

      for (const listener of this.messageListeners) {
        listener(messageEvent);
      }
      return;
    }

    if (event.type === WebSocketEventTypeEnum.MessageStatus) {
      const data = toRecord(event.data);
      const statusEvent: MessageStatusUpdatedEvent = {
        conversationId: String(data.conversationId ?? ''),
        messageId: String(data.messageId ?? ''),
        status: data.status as MessageStatusEnum,
        timestamp:
          typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      };

      if (!statusEvent.conversationId || !statusEvent.messageId) {
        return;
      }

      for (const listener of this.statusListeners) {
        listener(statusEvent);
      }
    }
  }

  private convertPacketToStandardMessage(packet: RawPacket): StandardMessage {
    return PacketConverter.toStandardMessage(
      packet,
      undefined,
      this.config.agentPin,
    );
  }

  private async checkMessage(
    payload: Record<string, unknown>,
  ): Promise<{ allowed: boolean; message?: string }> {
    const response = await fetch(
      `${this.config.endpoint}/chat/v2/message/check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return { allowed: false, message: '消息检查失败' };
    }

    const result = toRecord(await response.json());

    return {
      allowed: result.code === 0 && result.data === true,
      message: typeof result.message === 'string' ? result.message : undefined,
    };
  }

  private buildStandardMessage(
    params: FoxCollectSendParams,
    messageId: string,
  ): StandardMessage {
    const channelType = params.channelType ?? ChannelTypeEnum.WhatsApp;
    const payloadType = params.type ?? 'custom';

    return {
      id: messageId,
      tempId: messageId,
      direction: MessageDirectionEnum.Outgoing,
      channelType,
      status: MessageStatusEnum.Sending,
      timestamp: Date.now(),
      type:
        payloadType === 'template'
          ? MessageTypeEnum.Template
          : (params.messageType ?? MessageTypeEnum.Text),
      content:
        payloadType === 'template'
          ? {
              templateId: params.templateId ?? params.template ?? '',
              params: params.variables ?? {},
              text: '',
            }
          : ((params.content ?? {
              text: '',
            }) as unknown as StandardMessage['content']),
      sender: {
        app: this.config.app,
        pin: this.config.agentPin,
        clientType: (params.clientType ?? 'pc') as ClientTypeEnum,
        channelType,
      },
      receiver: {
        app: 'im.waiter',
        pin: params.receiverPin ?? '',
        clientType: (params.receiverClientType ?? '') as ClientTypeEnum,
        channelType,
      },
    };
  }
}
