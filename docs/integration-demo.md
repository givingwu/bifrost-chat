# Bifrost-Chat SDK 接入示例

本文档提供完整的电催场景接入示例，展示如何使用 Bifrost-Chat SDK。

## 完整示例代码

```typescript
/**
 * Bifrost-Chat SDK 接入示例 - 电催场景
 * 
 * 本示例展示如何接入 Bifrost-Chat SDK，包括：
 * 1. 创建自定义服务实现
 * 2. 配置 WebSocket 管理器
 * 3. 使用 SDK 提供的 UI 组件
 * 4. 完整的消息发送流程
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  // UI 组件
  Composer,
  MessageList,
  TemplatePanel,
  ConversationList,
  DefaultChatLayout,
  
  // 协议层
  PacketConverter,
  AckHandler,
  HeartbeatManager,
  WebSocketManager,
  
  // 类型定义
  ITemplateService,
  IMessageService,
  IConversationService,
  Template,
  MessageSendResult,
  StandardMessage,
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  ChannelTypeEnum,
} from '@bifrost-chat/sdk';

// ============================================
// 第一步：定义场景特定的类型和配置
// ============================================

/**
 * 电催场景配置
 */
interface FoxCollectConfig {
  endpoint: string;
  wsEndpoint: string;
  token: string;
  agentPin: string;
}

/**
 * 电催场景模板服务实现
 */
class FoxCollectTemplateService 
  implements ITemplateService<any, any> {
  
  private config: FoxCollectConfig;
  
  constructor(config: FoxCollectConfig) {
    this.config = config;
  }
  
  /**
   * 查询模板列表
   * 接口: POST /chat/v2/template/query
   */
  async list(params: any): Promise<Template[]> {
    const response = await fetch(`${this.config.endpoint}/chat/v2/template/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
      },
      body: JSON.stringify(params),
    });
    
    const result = await response.json();
    return result.data.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      content: item.content,
      code: item.code,
    }));
  }
  
  /**
   * 发送模板消息
   * 接口: POST /chat/v2/message/send
   */
  async send(params: any): Promise<MessageSendResult> {
    const tempId = `temp_${Date.now()}`;
    
    const response = await fetch(`${this.config.endpoint}/chat/v2/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        id: tempId,
        ...params,
      }),
    });
    
    if (!response.ok) {
      return {
        tempId,
        status: MessageStatusEnum.Failed,
        error: await response.text(),
      };
    }
    
    const result = await response.json();
    return {
      tempId,
      messageId: result.data?.mid,
      status: MessageStatusEnum.Sent,
    };
  }
  
  /**
   * 预览模板
   */
  async preview(templateId: string, variables: Record<string, string>): Promise<string> {
    return `模板 ${templateId} 的预览`;
  }
}

/**
 * 电催场景消息服务实现
 */
class FoxCollectMessageService implements IMessageService<any, any, any, any, any> {
  
  private config: FoxCollectConfig;
  private wsManager: WebSocketManager;
  private messageListeners: Array<(event: any) => void> = [];
  private statusListeners: Array<(event: any) => void> = [];
  
  constructor(config: FoxCollectConfig, wsManager: WebSocketManager) {
    this.config = config;
    this.wsManager = wsManager;
    
    // 设置 WebSocket 消息监听
    this.setupWebSocketListeners();
  }
  
  /**
   * 设置 WebSocket 监听
   */
  private setupWebSocketListeners(): void {
    this.wsManager.onMessage((data) => {
      // 处理心跳响应
      if (HeartbeatManager.isHeartbeatResponse(data)) {
        return;
      }
      
      // 处理 ACK 消息
      const ackData = AckHandler.parseDownstream(data);
      if (ackData) {
        const status = AckHandler.ackTypeToMessageStatus(ackData.body.type);
        
        for (const listener of this.statusListeners) {
          listener({
            messageId: ackData.id,
            status,
            timestamp: ackData.timestamp ?? Date.now(),
          });
        }
        return;
      }
      
      // 处理聊天消息
      if ((data as any).type === 'chat_message') {
        // 使用 SDK 提供的协议转换器
        const standardMessage = PacketConverter.toStandardMessage(
          data as any,
          MessageDirectionEnum.Incoming,
          this.config.agentPin,
        );
        
        for (const listener of this.messageListeners) {
          listener({
            conversationId: standardMessage.receiver?.id ?? '',
            message: standardMessage,
          });
        }
      }
    });
  }
  
  /**
   * 发送消息
   */
  async send(conversationId: string, params: any): Promise<MessageSendResult> {
    const tempId = params.id || `temp_${Date.now()}`;
    
    // 构建标准消息
    const standardMessage: StandardMessage = {
      id: tempId,
      tempId,
      direction: MessageDirectionEnum.Outgoing,
      channelType: params.channelType,
      status: MessageStatusEnum.Sending,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: params.content || { text: '' },
      sender: {
        id: this.config.agentPin,
        app: 'fox_collect.waiter',
      },
      receiver: {
        id: params.receiverPin,
        app: 'im.waiter',
        channelType: params.channelType,
      },
    };
    
    // 使用 SDK 提供的协议转换器
    const rawPacket = PacketConverter.toRawPacket(
      standardMessage,
      'fox_collect.waiter',
      this.config.agentPin,
    );
    
    // 通过 WebSocket 发送
    this.wsManager.send(rawPacket);
    
    return {
      tempId,
      status: MessageStatusEnum.Sending,
    };
  }
  
  /**
   * 查询消息列表
   */
  async list(conversationId: string, params?: any): Promise<StandardMessage[]> {
    const response = await fetch(`${this.config.endpoint}/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
      },
    });
    
    const result = await response.json();
    return result.data.map((packet: any) => 
      PacketConverter.toStandardMessage(packet, MessageDirectionEnum.Incoming, this.config.agentPin)
    );
  }
  
  /**
   * 标记已读
   */
  async markAsRead(params: any): Promise<void> {
    // 使用 SDK 提供的 ACK 处理器创建已读 ACK
    const ackMessage = AckHandler.createReadAck(params);
    this.wsManager.send(ackMessage);
  }
  
  /**
   * 订阅实时消息
   */
  subscribeToMessages(callback: (event: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 订阅消息状态更新
   */
  subscribeToMessageStatus(callback: (event: any) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 发送附件
   */
  async sendAttachment(params: any): Promise<any> {
    return { tempId: `temp_${Date.now()}`, status: 'sent' };
  }
  
  /**
   * 发送音频
   */
  async sendAudio(params: any): Promise<any> {
    return { tempId: `temp_${Date.now()}`, status: 'sent' };
  }
}

/**
 * 电催场景会话服务实现
 */
class FoxCollectConversationService implements IConversationService<any, any, any> {
  
  private config: FoxCollectConfig;
  
  constructor(config: FoxCollectConfig) {
    this.config = config;
  }
  
  async list(params?: any): Promise<any[]> {
    const response = await fetch(`${this.config.endpoint}/chat/v2/session/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        app: 'fox_collect.waiter',
        pin: this.config.agentPin,
      }),
    });
    
    const result = await response.json();
    return result.data;
  }
  
  async create(params: any): Promise<any> {
    return {};
  }
  
  async update(conversationId: string, params: any): Promise<any> {
    return {};
  }
  
  async delete(conversationId: string): Promise<void> {
    // 实现删除逻辑
  }
}

// ============================================
// 第二步：创建应用组件
// ============================================

/**
 * 电催场景聊天应用
 */
function FoxCollectChatApp() {
  // 创建服务实例
  const services = useMemo(() => {
    const config: FoxCollectConfig = {
      endpoint: 'https://api.fox-collect.com',
      wsEndpoint: 'wss://api.fox-collect.com/ws',
      token: 'your-token-here',
      agentPin: 'agent-123',
    };
    
    const wsManager = new WebSocketManager(config.wsEndpoint);
    const templateService = new FoxCollectTemplateService(config);
    const messageService = new FoxCollectMessageService(config, wsManager);
    const conversationService = new FoxCollectConversationService(config);
    
    return {
      templateService,
      messageService,
      conversationService,
      wsManager,
    };
  }, []);
  
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  // 监听 WebSocket 连接状态
  useEffect(() => {
    const unsubscribe = services.wsManager.onStatusChange((status) => {
      setIsConnected(status === 'connected');
    });
    
    // 连接 WebSocket
    services.wsManager.connect();
    
    return () => {
      unsubscribe();
      services.wsManager.disconnect();
    };
  }, [services.wsManager]);
  
  // 启动心跳
  useEffect(() => {
    if (!isConnected) return;
    
    const heartbeatInterval = setInterval(() => {
      const heartbeat = HeartbeatManager.createHeartbeat();
      services.wsManager.send(heartbeat);
    }, 30000); // 每 30 秒发送一次心跳
    
    return () => clearInterval(heartbeatInterval);
  }, [isConnected, services.wsManager]);
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部状态栏 */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: isConnected ? '#4caf50' : '#f44336', 
        color: 'white',
        textAlign: 'center',
      }}>
        {isConnected ? '已连接' : '未连接'}
      </div>
      
      {/* 聊天布局 */}
      <DefaultChatLayout
        conversationList={
          <ConversationList
            conversationService={services.conversationService}
            activeConversationId={activeConversationId}
            onConversationSelect={(conversation) => {
              setActiveConversationId(conversation.id);
            }}
          />
        }
        messageList={
          <MessageList
            messageService={services.messageService}
            conversationId={activeConversationId}
          />
        }
        composer={
          <Composer
            templateService={services.templateService}
            messageService={services.messageService}
            conversationId={activeConversationId}
          />
        }
        contextPanel={
          <TemplatePanel
            templateService={services.templateService}
            conversationId={activeConversationId}
          />
        }
      />
    </div>
  );
}

export default FoxCollectChatApp;
```

## 使用步骤

### 1. 安装 SDK

```bash
npm install @bifrost-chat/sdk
```

### 2. 创建自定义服务实现

实现以下接口：
- `ITemplateService` - 模板服务
- `IMessageService` - 消息服务
- `IConversationService` - 会话服务

### 3. 创建服务实例

```typescript
const config = {
  endpoint: 'https://api.fox-collect.com',
  wsEndpoint: 'wss://api.fox-collect.com/ws',
  token: 'your-token-here',
  agentPin: 'agent-123',
};

const wsManager = new WebSocketManager(config.wsEndpoint);
const templateService = new FoxCollectTemplateService(config);
const messageService = new FoxCollectMessageService(config, wsManager);
const conversationService = new FoxCollectConversationService(config);
```

### 4. 使用 SDK 组件

- `ConversationList` - 会话列表
- `MessageList` - 消息列表
- `Composer` - 消息输入组件
- `TemplatePanel` - 模板面板
- `DefaultChatLayout` - 默认布局

### 5. 连接 WebSocket

```typescript
// 连接 WebSocket
wsManager.connect();

// 监听连接状态
wsManager.onStatusChange((status) => {
  console.log('WebSocket 状态:', status);
});

// 启动心跳
setInterval(() => {
  const heartbeat = HeartbeatManager.createHeartbeat();
  wsManager.send(heartbeat);
}, 30000);
```

### 6. 处理消息

```typescript
// 使用 PacketConverter 转换协议
const standardMessage = PacketConverter.toStandardMessage(
  rawPacket,
  MessageDirectionEnum.Incoming,
  agentPin,
);

// 使用 AckHandler 处理 ACK
const ackData = AckHandler.parseDownstream(data);
if (ackData) {
  const status = AckHandler.ackTypeToMessageStatus(ackData.body.type);
  // 处理状态更新
}

// 使用 HeartbeatManager 管理心跳
const heartbeat = HeartbeatManager.createHeartbeat();
wsManager.send(heartbeat);
```

## 关键点说明

### SDK 提供的通用功能

1. **协议转换**：`PacketConverter`
   - `toRawPacket()` - 将 StandardMessage 转换为 RawPacket
   - `toStandardMessage()` - 将 RawPacket 转换为 StandardMessage

2. **ACK 处理**：`AckHandler`
   - `createReadAck()` - 创建已读 ACK 消息
   - `parseDownstream()` - 解析下行 ACK 消息
   - `ackTypeToMessageStatus()` - 映射 ACK 类型到消息状态

3. **心跳管理**：`HeartbeatManager`
   - `createHeartbeat()` - 创建心跳消息
   - `isHeartbeatResponse()` - 验证心跳响应

4. **WebSocket 管理**：`WebSocketManager`
   - `connect()` - 连接
   - `send()` - 发送消息
   - `onMessage()` - 订阅消息
   - `onStatusChange()` - 订阅连接状态变化

### 业务方自行实现的部分

1. **服务实现**：实现 `ITemplateService`、`IMessageService`、`IConversationService` 接口
2. **业务逻辑**：消息检查（频次/敏感词）、模板查询、消息发送等
3. **HTTP 请求**：使用原生 `fetch` API
4. **服务管理**：根据项目架构选择合适的管理方式

## 注意事项

1. 所有 HTTP 请求使用原生 `fetch` API，不引入额外的 HTTP 客户端
2. 业务逻辑（如频次检查）由业务方自行实现
3. SDK 只提供通用的协议转换和 UI 组件
4. 服务实例的管理方式由业务方自行决定（Context/Props/全局状态等）
5. WebSocket 连接需要手动管理连接状态和心跳保活

## 总结

通过这个完整的接入示例，您可以了解如何：

1. 创建自定义服务实现
2. 使用 SDK 提供的协议转换能力
3. 使用 SDK 提供的 UI 组件
4. 管理 WebSocket 连接和心跳
5. 处理实时消息和 ACK

这个示例可以作为您接入 SDK 的参考模板，根据您的具体场景进行相应的调整。
