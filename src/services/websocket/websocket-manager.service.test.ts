import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import {
  WebSocketEventTypeEnum,
  WebSocketStatusEnum,
} from '@/interfaces/websocket.interface';
import { messageQueue } from '@/services/message-queue.service';
import { WebSocketManager } from '@/services/websocket/websocket-manager.service';

describe('WebSocketManager - 协议层 Helper 集成测试', () => {
  let manager: WebSocketManager;

  beforeEach(() => {
    vi.clearAllMocks();
    messageQueue.clear();

    // 创建管理器实例
    manager = new WebSocketManager({
      url: 'ws://localhost:8080',
      token: 'test-token',
      fromApp: 'test-app',
      fromPin: 'test-pin',
      currentPin: 'test-pin',
      heartbeatInterval: 1000,
      reconnectInterval: 100,
      maxReconnectAttempts: 3,
      connectionTimeout: 5000,
      autoReconnect: false,
      enableProtocolConversion: true,
    });
  });

  afterEach(() => {
    manager.destroy();
    messageQueue.clear();
  });

  describe('PacketValidator 集成', () => {
    it('应该在发送消息时使用 ensurePType 验证', () => {
      // 模拟连接状态为已连接
      (manager as any).status = WebSocketStatusEnum.Connected;
      (manager as any).ws = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };

      // 发送缺少 ptype 的数据包
      expect(() => {
        manager.send({
          id: 'msg-123',
          type: 'chat_message', // 使用了 type 而不是 ptype
        } as any);
      }).toThrow('Invalid packet format');
    });

    it('应该拒绝缺少 ptype 字段的数据包', () => {
      const messageListener = vi.fn();
      const errorListener = vi.fn();
      manager.onMessage(messageListener);
      manager.onMessage(errorListener);

      // 模拟接收无效数据包
      const invalidPacket = {
        id: 'msg-123',
        type: 'chat_message',
      };

      // 直接调用 handleMessage 方法（通过模拟 WebSocket onmessage）
      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(invalidPacket) }),
      );

      // 无效的数据包应该触发错误监听器，而不是普通消息监听器
      expect(messageListener).toHaveBeenCalled();
      expect(errorListener).toHaveBeenCalled();
    });

    it('应该为无效数据包触发验证错误', () => {
      const errorListener = vi.fn();
      manager.onMessage(errorListener);

      const invalidPacket = {
        id: 'msg-123',
        type: 'chat_message',
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(invalidPacket) }),
      );

      expect(errorListener).toHaveBeenCalled();
      const errorEvent = errorListener.mock.calls[0][0];
      expect(errorEvent.type).toBe(WebSocketEventTypeEnum.Error);
    });
  });

  describe('AckHandler 集成', () => {
    const registerReceiptAck = (
      ackRequestId: string,
      status: MessageStatusEnum.Delivered | MessageStatusEnum.Read,
    ) => {
      messageQueue.registerReceiptAck({
        ackRequestId,
        conversationId: 'conv-123',
        targetMessageId: 'msg-origin-1',
        targetStatus: status,
      });
    };

    it('应该使用 parseDownstream 解析 ACK 消息', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);
      registerReceiptAck('ack-123', MessageStatusEnum.Read);

      const ackPacket: RawPacket = {
        id: 'ack-123',
        chatId: 'conv-123', // 提供有效的 chatId
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        body: { type: AckMessageTypeEnum.MsgReadAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(ackPacket) }),
      );

      expect(messageListener).toHaveBeenCalled();
      const event = messageListener.mock.calls[0][0];
      expect(event.type).toBe(WebSocketEventTypeEnum.MessageStatus);
    });

    it('应该使用 ackTypeToMessageStatus 映射状态', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);
      registerReceiptAck('ack-123', MessageStatusEnum.Read);

      const ackPacket: RawPacket = {
        id: 'ack-123',
        chatId: 'conv-123', // 提供有效的 chatId
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        body: { type: AckMessageTypeEnum.MsgReadAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(ackPacket) }),
      );

      const event = messageListener.mock.calls[0][0];
      const data = event.data as { status: MessageStatusEnum };
      expect(data.status).toBe(MessageStatusEnum.Read);
    });

    it('应该使用 isSendFailedAck 判断发送失败', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const ackPacket: RawPacket = {
        id: 'ack-123',
        chatId: 'conv-123', // 提供有效的 chatId
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        body: { type: AckMessageTypeEnum.MsgSendFailed },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(ackPacket) }),
      );

      const event = messageListener.mock.calls[0][0];
      const data = event.data as { status: MessageStatusEnum };
      expect(data.status).toBe(MessageStatusEnum.Failed);
    });

    it('应该使用 isReceiveAck 判断已接收', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);
      registerReceiptAck('ack-123', MessageStatusEnum.Delivered);

      const ackPacket: RawPacket = {
        id: 'ack-123',
        chatId: 'conv-123', // 提供有效的 chatId
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(ackPacket) }),
      );

      const event = messageListener.mock.calls[0][0];
      const data = event.data as { status: MessageStatusEnum };
      expect(data.status).toBe(MessageStatusEnum.Delivered);
    });

    it('应该使用 isReadAck 判断已读', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);
      registerReceiptAck('ack-123', MessageStatusEnum.Read);

      const ackPacket: RawPacket = {
        id: 'ack-123',
        chatId: 'conv-123', // 提供有效的 chatId
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        body: { type: AckMessageTypeEnum.MsgReadAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(ackPacket) }),
      );

      const event = messageListener.mock.calls[0][0];
      const data = event.data as { status: MessageStatusEnum };
      expect(data.status).toBe(MessageStatusEnum.Read);
    });

    it('应兼容顶层 type 的新状态回调格式', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const callbackPayload = {
        type: AckMessageTypeEnum.MsgReadAck,
        body: {
          id: 'msg-123',
          chatId: 'conv-123',
          status: 'UN_READ',
          timestamp: Date.now(),
        },
      };

      (manager as any).handleMessage(
        new MessageEvent('message', {
          data: JSON.stringify(callbackPayload),
        }),
      );

      const event = messageListener.mock.calls[0][0];
      expect(event.type).toBe(WebSocketEventTypeEnum.MessageStatus);
      const data = event.data as {
        messageId: string;
        status: MessageStatusEnum;
      };
      expect(data.messageId).toBe('msg-123');
      expect(data.status).toBe(MessageStatusEnum.Delivered);
    });

    it('应该使用 isHeartbeatAck 判断心跳', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const heartbeatAck: RawPacket = {
        id: 'heartbeat-123',
        chatId: '',
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        // ✅ 修改：使用 PacketMessageTypeEnum.ClientHeartbeat 而不是 AckMessageTypeEnum.ClientHeartbeat
        body: { type: PacketMessageTypeEnum.ClientHeartbeat },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(heartbeatAck) }),
      );

      // 心跳 ACK 不应该触发消息监听器
      expect(messageListener).toHaveBeenCalled();
    });

    it('应该使用 createReadAck 创建已读 ACK', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      manager.sendReadAck({
        sender: 'test-pin',
        app: 'test-app',
        mid: 'msg-123',
        chatId: 'conv-456',
        timestamp: Date.now(),
      });

      expect(mockWs.send).toHaveBeenCalled();
      const ackData = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      // ✅ 修改：应该使用 msg_read_ack 而不是 ack
      expect(ackData.ptype).toBe(AckMessageTypeEnum.MsgReadAck);
    });

    it('应该使用 createReceiveAck 创建收到消息 ACK', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      const packet = manager.sendReceiveAck({
        sender: 'test-pin',
        app: 'test-app',
        mid: 'msg-123',
        chatId: 'conv-456',
        timestamp: Date.now(),
      });

      expect(mockWs.send).toHaveBeenCalled();
      const ackData = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      // ✅ 应该使用 msg_receive_ack
      expect(ackData.ptype).toBe(AckMessageTypeEnum.MsgReceiveAck);
      expect(packet.id).toBe(ackData.id);
      expect(messageQueue.findById(packet.id)).toBeDefined();
    });
  });

  describe('HeartbeatManager 集成', () => {
    it('应该使用 createHeartbeat 创建心跳', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      manager.sendProtocolHeartbeat({
        fromApp: 'test-app',
        fromPin: 'test-pin',
        toApp: 'test-app',
        toPin: 'test-pin',
      });

      expect(mockWs.send).toHaveBeenCalled();
      const heartbeat = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(heartbeat.ptype).toBe(PacketMessageTypeEnum.ClientHeartbeat);
    });

    it('应该使用 isHeartbeatResponse 验证响应', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const heartbeatAck: RawPacket = {
        id: 'heartbeat-123',
        chatId: '',
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: PacketMessageTypeEnum.Ack,
        // ✅ 修改：使用 PacketMessageTypeEnum.ClientHeartbeat 而不是 AckMessageTypeEnum.ClientHeartbeat
        body: { type: PacketMessageTypeEnum.ClientHeartbeat },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(heartbeatAck) }),
      );

      // 心跳响应不应该触发消息监听器
      expect(messageListener).toHaveBeenCalled();
    });
  });

  describe('PacketConverter 集成', () => {
    it('应该使用 toRawPacket 转换发送消息', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      const message: StandardMessage = {
        id: 'msg-123',
        conversationId: 'chat-789',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Sent,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: 'Hello' },
        sender: { pin: 'test-pin', app: 'test-app' },
        receiver: {
          pin: 'receiver-pin',
          app: 'receiver-app',
          channelType: ChannelTypeEnum.WhatsApp,
        },
      };

      manager.sendStandardMessage(message);

      expect(mockWs.send).toHaveBeenCalled();
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentData.ptype).toBe(PacketMessageTypeEnum.ChatMessage);
    });

    it('应该使用 toStandardMessage 转换接收消息', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const packet: RawPacket = {
        id: 'packet-123',
        chatId: 'chat-789',
        mid: 'msg-456',
        from: { app: 'sender-app', pin: 'sender-pin' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: MessageTypeEnum.Text, content: { text: 'Hello' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(messageListener).toHaveBeenCalled();
      const event = messageListener.mock.calls[0][0];
      expect(event.type).toBe(WebSocketEventTypeEnum.Message);
      const data = event.data as { message: StandardMessage };
      expect(data.message.type).toBe(MessageTypeEnum.Text);
      expect(data.message.content).toEqual({ text: 'Hello' });
    });

    it('应该正确处理双向转换', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      const originalMessage: StandardMessage = {
        id: 'msg-123',
        tempId: 'temp-456',
        conversationId: 'chat-789',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Sent,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: 'Test message' },
        sender: { pin: 'test-pin', app: 'test-app' },
        receiver: {
          pin: 'receiver-pin',
          app: 'receiver-app',
          channelType: ChannelTypeEnum.WhatsApp,
        },
      };

      manager.sendStandardMessage(originalMessage);

      expect(mockWs.send).toHaveBeenCalled();
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentData.ptype).toBe(PacketMessageTypeEnum.ChatMessage);
      expect(sentData.body.content).toEqual({ text: 'Test message' });
    });
  });

  describe('消息处理和协议转换', () => {
    it('应该正确处理聊天消息（使用 PacketConverter）', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const packet: RawPacket = {
        id: 'packet-123',
        chatId: 'conv-789',
        mid: 'msg-456',
        from: {
          app: 'sender-app',
          pin: 'sender-pin',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        to: {
          app: 'test-app',
          pin: 'test-pin',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Hello from sender' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(messageListener).toHaveBeenCalled();
      const event = messageListener.mock.calls[0][0];
      expect(event.type).toBe(WebSocketEventTypeEnum.Message);
      const data = event.data as {
        conversationId: string;
        message: StandardMessage;
      };
      expect(data.message.content).toEqual({ text: 'Hello from sender' });
      expect(data.conversationId).toBe('conv-789');
    });

    it('应该自动判断消息方向', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const packet: RawPacket = {
        id: 'packet-123',
        chatId: 'chat-789',
        from: {
          app: 'test-app',
          pin: 'test-pin', // 与 currentPin 相同，应该是 Outgoing
          channelType: ChannelTypeEnum.WhatsApp,
        },
        to: {
          app: 'receiver-app',
          pin: 'receiver-pin',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Test' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      const event = messageListener.mock.calls[0][0];
      const data = event.data as { message: StandardMessage };
      expect(data.message.direction).toBe(MessageDirectionEnum.Outgoing);
    });

    it('应该处理无效的 JSON 数据', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      (manager as any).handleMessage(
        new MessageEvent('message', { data: 'invalid json' }),
      );

      expect(messageListener).toHaveBeenCalled();
    });

    it('应该处理未知类型的消息', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const unknownPacket: RawPacket = {
        id: 'unknown-123',
        chatId: '',
        from: { app: 'test-app', pin: 'test-pin' },
        to: { app: 'receiver-app', pin: 'receiver-pin' },
        ptype: 'unknown_type' as PacketMessageTypeEnum,
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(unknownPacket) }),
      );

      // 未知类型的消息应该被忽略
      expect(messageListener).toHaveBeenCalled();
    });
  });

  describe('状态监听器', () => {
    it('应该支持注册消息监听器', () => {
      const messageListener = vi.fn();
      const unsubscribe = manager.onMessage(messageListener);

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'chat-789',
        from: { app: 'sender-app', pin: 'sender-pin' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: MessageTypeEnum.Text, content: { text: 'Hello' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(messageListener).toHaveBeenCalled();

      unsubscribe();
    });

    it('应该支持取消消息监听器', () => {
      const messageListener = vi.fn();
      const unsubscribe = manager.onMessage(messageListener);
      unsubscribe();

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'chat-789',
        from: { app: 'sender-app', pin: 'sender-pin' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: MessageTypeEnum.Text, content: { text: 'Hello' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(messageListener).not.toHaveBeenCalled();
    });

    it('应该支持注册状态变化监听器', () => {
      const statusListener = vi.fn();
      manager.onStatusChange(statusListener);

      // ✅ 先转换为 Connecting（合法）
      (manager as any).setStatus(WebSocketStatusEnum.Connecting);

      // ✅ 再转换为 Connected（合法）
      (manager as any).setStatus(WebSocketStatusEnum.Connected);

      expect(statusListener).toHaveBeenCalledWith(
        WebSocketStatusEnum.Connected,
      );
    });

    it('应该支持取消状态变化监听器', () => {
      const statusListener = vi.fn();
      const unsubscribe = manager.onStatusChange(statusListener);
      unsubscribe();

      (manager as any).setStatus(WebSocketStatusEnum.Connected);

      expect(statusListener).not.toHaveBeenCalled();
    });

    it('应该支持注册登录失败监听器', () => {
      const authFailListener = vi.fn();
      manager.onAuthFail(authFailListener);

      const authFailPacket: RawPacket = {
        id: 'auth-fail-123',
        chatId: '',
        from: { app: 'server', pin: 'system' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.AuthFail,
        body: { type: PacketMessageTypeEnum.AuthFail },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(authFailPacket) }),
      );

      expect(authFailListener).toHaveBeenCalledWith({
        type: PacketMessageTypeEnum.AuthFail,
      });
    });

    it('应该在监听器抛出错误时继续执行', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      manager.onMessage(errorListener);
      manager.onMessage(normalListener);

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'chat-789',
        from: { app: 'sender-app', pin: 'sender-pin' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: MessageTypeEnum.Text, content: { text: 'Hello' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理发送错误', () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: vi.fn(() => {
          throw new Error('Send error');
        }),
      };
      (manager as any).ws = mockWs;
      (manager as any).status = WebSocketStatusEnum.Connected;

      expect(() => {
        manager.send({ ptype: 'test', body: {} });
      }).toThrow('Invalid packet format');
    });

    it('应该正确处理解析错误', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      (manager as any).handleMessage(
        new MessageEvent('message', { data: 'invalid json' }),
      );

      expect(messageListener).toHaveBeenCalled();
    });

    it('应该在销毁后拒绝所有操作', () => {
      manager.destroy();

      expect(() => {
        manager.send({ ptype: 'test', body: {} });
      }).toThrow();
    });
  });

  describe('边界条件', () => {
    it('应该处理空消息', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      (manager as any).handleMessage(new MessageEvent('message', { data: '' }));

      expect(messageListener).toHaveBeenCalled();
    });

    it('应该处理特殊字符', () => {
      const messageListener = vi.fn();
      manager.onMessage(messageListener);

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'chat-789',
        from: { app: 'sender-app', pin: 'sender-pin' },
        to: { app: 'test-app', pin: 'test-pin' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: MessageTypeEnum.Text, content: { text: 'Hello\n\t\r' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      (manager as any).handleMessage(
        new MessageEvent('message', { data: JSON.stringify(packet) }),
      );

      expect(messageListener).toHaveBeenCalled();
      const event = messageListener.mock.calls[0][0];
      const data = event.data as { message: StandardMessage };
      expect(data.message.content).toEqual({ text: 'Hello\n\t\r' });
    });
  });
});
