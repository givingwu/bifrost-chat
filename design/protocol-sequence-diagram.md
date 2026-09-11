# 消息发送完整流程时序图

## 概述

本文档描述了 Bifrost-Chat SDK 中消息发送的完整流程，包括不同场景（电催、客服）下的差异处理。

## 场景差异对比

### 电催场景（示例业务）

| 字段 | 值 | 说明 |
|------|-----|------|
| SESSION ID | `chatId` | 由 `session/info/query` 返回的会话标识 |
| from.app | `example_chat.waiter` | 催收坐席 |
| to.app | `im.waiter` | 用户 |
| entry | `example.chat.detail` | 电催详情入口 |
| 模板查询 | `/chat/v2/template/query` | 基于渠道类型查询 |
| 消息检查 | `/chat/v2/message/check` | 频次检查 |
| 消息发送 | `/chat/v2/message/send` | 模板/自定义消息 |

### 客服场景（示例客服 Customer Service）

| 字段 | 值 | 说明 |
|------|-----|------|
| SESSION ID | 用户 ID | 用户 ID = 客户身份证+包 |
| from.app | `support_chat.customer` | 客户端用户 |
| to.app | `support_chat.waiter` | 示例客服 客服客诉坐席 |
| entry | `example.system` | 系统入口 |
| 模板查询 | 待定义 | 客服场景模板查询接口 |
| 消息检查 | 待定义 | 客服场景消息检查接口 |
| 消息发送 | 待定义 | 客服场景消息发送接口 |

## 完整消息发送时序图

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户/坐席
    participant UI as UI组件层
    participant Hook as useSendMessage Hook
    participant Validator as MessageValidator
    participant TemplateSvc as TemplateService
    participant MessageSvc as MessageService
    participant CheckAPI as Check接口
    participant SendAPI as Send接口
    participant WS as WebSocket
    participant Server as 服务端

    Note over User,Server: === 场景1: 发送模板消息 ===

    User->>UI: 选择模板
    UI->>TemplateSvc: listTemplates({ chatId, channelType })
    TemplateSvc->>SendAPI: GET /chat/v2/template/query
    SendAPI-->>TemplateSvc: 模板列表
    TemplateSvc-->>UI: 模板列表
    UI-->>User: 显示模板选择器

    User->>UI: 选择模板并填写变量
    UI->>Hook: sendMessage({ type: 'template', templateId, variables })
    
    Hook->>Validator: validateMessage(message)
    Validator->>Validator: 检查消息类型<br/>检查渠道支持<br/>检查必填字段
    Validator-->>Hook: 验证通过

    Hook->>CheckAPI: POST /chat/v2/message/check<br/>{ id, chatId, channelType, type, template }
    CheckAPI->>Server: 频次检查
    Server-->>CheckAPI: { code: 0, data: true }
    CheckAPI-->>Hook: 允许发送

    Hook->>MessageSvc: send(conversationId, params)
    MessageSvc->>MessageSvc: 生成 tempId
    MessageSvc->>MessageSvc: 构建 StandardMessage
    MessageSvc->>WS: send(Packet)
    
    Note over WS,Server: 通过 WebSocket 发送
    WS->>Server: chat_message (Packet)
    Server->>Server: 消息持久化
    Server->>Server: 触达渠道（WhatsApp/SMS等）
    
    Server-->>WS: ACK (msg_receive_ack)
    WS-->>MessageSvc: 收到 ACK
    MessageSvc-->>Hook: { tempId, status: 'sent' }
    Hook-->>UI: 更新消息状态
    UI-->>User: 显示已发送

    Server->>WS: fox_message_ack (发送结果)
    WS->>MessageSvc: 消息状态更新
    MessageSvc->>Hook: status: 'delivered'/'read'
    Hook->>UI: 更新消息状态

    Note over User,Server: === 场景2: 发送自定义文本消息 ===

    User->>UI: 输入文本
    UI->>Hook: sendMessage({ type: 'text', content: { text } })
    
    Hook->>Validator: validateMessage(message)
    Validator->>Validator: 检查消息类型<br/>检查渠道支持<br/>检查文本长度
    Validator-->>Hook: 验证通过

    Hook->>CheckAPI: POST /chat/v2/message/check<br/>{ id, chatId, channelType, type: 'custom' }
    CheckAPI->>Server: 频次检查
    Server-->>CheckAPI: { code: 0, data: true }
    CheckAPI-->>Hook: 允许发送

    Hook->>MessageSvc: send(conversationId, params)
    MessageSvc->>MessageSvc: 生成 tempId
    MessageSvc->>MessageSvc: 构建 StandardMessage
    MessageSvc->>WS: send(Packet)
    
    WS->>Server: chat_message (Packet)
    Server->>Server: 消息持久化
    Server->>Server: 触达渠道
    
    Server-->>WS: ACK (msg_receive_ack)
    WS-->>MessageSvc: 收到 ACK
    MessageSvc-->>Hook: { tempId, status: 'sent' }
    Hook-->>UI: 更新消息状态

    Note over User,Server: === 场景3: 消息检查失败 ===

    User->>UI: 尝试发送消息
    UI->>Hook: sendMessage(params)
    
    Hook->>Validator: validateMessage(message)
    Validator-->>Hook: 验证通过

    Hook->>CheckAPI: POST /chat/v2/message/check
    CheckAPI->>Server: 频次检查
    Server-->>CheckAPI: { code: 1001, message: '发送频次超限' }
    CheckAPI-->>Hook: 检查失败
    
    Hook->>Hook: 处理错误
    Hook-->>UI: 显示错误提示
    UI-->>User: "发送频次超限，请稍后再试"

    Note over User,Server: === 场景4: 消息发送失败 ===

    User->>UI: 尝试发送消息
    UI->>Hook: sendMessage(params)
    
    Hook->>CheckAPI: POST /chat/v2/message/check
    CheckAPI-->>Hook: 允许发送

    Hook->>MessageSvc: send(conversationId, params)
    MessageSvc->>WS: send(Packet)
    
    WS->>Server: chat_message (Packet)
    Server->>Server: 发送失败（渠道不可达）
    
    Server-->>WS: ACK (msg_send_failed)
    WS-->>MessageSvc: 收到失败 ACK
    MessageSvc-->>Hook: { tempId, status: 'failed', error }
    Hook-->>UI: 更新消息状态
    UI-->>User: 显示失败状态，提供重试按钮
```

## Packet 协议转换流程

```mermaid
sequenceDiagram
    participant UI as UI组件
    participant Hook as useSendMessage
    participant Builder as MessageBuilder
    participant Converter as PacketConverter
    participant WS as WebSocket
    participant Server as 服务端

    UI->>Hook: sendMessage(params)
    Hook->>Builder: generateTempId()
    Builder-->>Hook: tempId
    
    Hook->>Hook: 构建 StandardMessage
    Note over Hook: {<br/>  id: tempId,<br/>  tempId: tempId,<br/>  direction: 'outgoing',<br/>  channelType: 'WhatsApp',<br/>  status: 'sending',<br/>  type: 'template',<br/>  content: { templateId, params },<br/>  sender: { app, pin },<br/>  receiver: { app, pin, channelType }<br/>}
    
    Hook->>Converter: toRawPacket(standardMessage, app, pin)
    Converter->>Converter: 映射消息类型<br/>映射渠道类型<br/>构建 Packet 结构
    Note over Converter: {<br/>  type: 'chat_message',<br/>  body: {<br/>    id: tempId,<br/>    from: { app, pin, channelType },<br/>    to: { app, pin, channelType },<br/>    ptype: 'CHAT_MESSAGE',<br/>    body: { type, content },<br/>    ver: '1.0',<br/>    timestamp: '...'<br/>  }<br/>}
    
    Converter-->>Hook: RawPacket
    Hook->>WS: send(RawPacket)
    WS->>Server: 发送 Packet
```

## ACK 确认流程

```mermaid
sequenceDiagram
    participant Server as 服务端
    participant WS as WebSocket
    participant MessageSvc as MessageService
    participant Hook as useSendMessage
    participant UI as UI组件

    Note over Server,UI: === 消息已收 ACK ===

    Server->>WS: ACK (msg_receive_ack)
    Note over WS: {<br/>  id: 'bced3b54-...',<br/>  type: 'ack',<br/>  body: { type: 'msg_receive_ack' },<br/>  timestamp: 1769063279192<br/>}
    
    WS->>MessageSvc: onMessage(ACK)
    MessageSvc->>MessageSvc: AckHandler.parseDownstream()
    MessageSvc->>MessageSvc: 更新消息状态为 delivered
    MessageSvc->>Hook: status: 'delivered'
    Hook->>UI: 更新消息状态
    UI->>UI: 显示双勾（已送达）

    Note over Server,UI: === 消息已读 ACK ===

    Server->>WS: ACK (msg_read_ack)
    Note over WS: {<br/>  id: 'bced3b54-...',<br/>  type: 'ack',<br/>  body: { type: 'msg_read_ack' },<br/>  timestamp: 1769063279192<br/>}
    
    WS->>MessageSvc: onMessage(ACK)
    MessageSvc->>MessageSvc: AckHandler.parseDownstream()
    MessageSvc->>MessageSvc: 更新消息状态为 read
    MessageSvc->>Hook: status: 'read'
    Hook->>UI: 更新消息状态
    UI->>UI: 显示蓝勾（已读）

    Note over Server,UI: === 消息发送失败 ACK ===

    Server->>WS: ACK (msg_send_failed)
    Note over WS: {<br/>  id: 'bced3b54-...',<br/>  type: 'ack',<br/>  body: { type: 'msg_send_failed' },<br/>  timestamp: 1769063279192<br/>}
    
    WS->>MessageSvc: onMessage(ACK)
    MessageSvc->>MessageSvc: AckHandler.parseDownstream()
    MessageSvc->>MessageSvc: 更新消息状态为 failed
    MessageSvc->>Hook: status: 'failed', error
    Hook->>UI: 更新消息状态
    UI->>UI: 显示失败图标，提供重试
```

## MessageStatus 流转时序图

```mermaid
sequenceDiagram
  autonumber
  participant UI as UI / useSendMessage
  participant MQ as MessageQueueService
  participant WS as WebSocketManager
  participant Server as Server
  participant Ack as AckPacketHandler
  participant Sync as MessageSyncService
  participant Cache as React Query Cache

  UI->>Cache: 写入 optimistic message(tempId, status=sending)
  UI->>MQ: register(tempId, requestId, conversationId)
  UI->>WS: send(chat_message)

  WS->>Server: 发送 chat_message
  Server-->>WS: ACK ptype=ack, body.type=chat_message
  WS->>Ack: handle(packet)
  Ack->>MQ: handleAck(chat_message ack)
  MQ-->>Ack: statusEvent(status=sent, tempId, messageId=requestId)
  Ack-->>WS: MessageStatus event(sent)
  WS->>Sync: updateMessageStatus(sent)
  Sync->>Cache: 按 messageId/tempId 更新 status=sent

  opt 服务端返回真实 messageId
    UI->>MQ: bindServerMessageId(tempId, serverMessageId)
  end

  rect rgb(240,248,255)
    note over Server,WS: 新增状态回调格式
    Server-->>WS: { type: "msg_read_ack", body: { id, chatId, status, errorInfo } }
    WS->>WS: normalizeIncomingPacket()
    WS->>Ack: handle(normalized ack packet)
    Ack->>MQ: handleAck(body.status callback)
    alt 命中 outgoing 消息
      MQ->>MQ: resolveDeliveryStatus(status)
      MQ-->>Ack: statusEvent(delivered/read/failed...)
    else 先到状态，后到 serverMessageId
      MQ->>MQ: storeOrphanStatusAck(messageId)
      MQ-->>Ack: handled=false
      note over UI,MQ: 后续 bindServerMessageId 时 replay
      UI->>MQ: bindServerMessageId(tempId, serverMessageId)
      MQ->>MQ: replayOrphanStatusAcks()
      MQ-->>UI: replayed statusEvent
      UI->>Sync: updateMessageStatus(replayedEvent)
      Sync->>Cache: 更新消息状态
    else 队列未命中，但 body.id/body.chatId 可兜底
      Ack->>Ack: 用 body.id + body.chatId + body.status 直接构造状态事件
    end
    Ack-->>WS: MessageStatus event(status, error?)
    WS->>Sync: updateMessageStatus(event)
    Sync->>Cache: 更新 status / error
  end

  alt status = UN_READ
    Cache-->>UI: 刷新为 delivered
  else status = READ
    Cache-->>UI: 刷新为 read
  else status = SEND_FAIL or DELIVER_FAIL
    Cache-->>UI: 刷新为 failed + errorInfo
  else status = REVOKE or DELETE
    Cache-->>UI: 刷新为 revoked / deleted
  end
```

## ACK <-> MessageStatus 双轨时序图

```mermaid
sequenceDiagram
  autonumber
  participant Server as 服务端
  participant WS as WebSocketManager
  participant Ack as AckPacketHandler
  participant MQ as MessageQueueService
  participant Sync as MessageSyncService
  participant Cache as React Query Cache
  participant UI as MessageList / StatusIndicator

  Server-->>WS: 推送 { type: "msg_read_ack", body: { id, chatId, status, errorInfo } }

  WS->>WS: normalizeIncomingPacket()
  Note right of WS: 归一化成现有 ACK Packet<br/>ptype=ack, body.type=msg_read_ack

  WS->>Ack: handle(packet)
  Ack->>Ack: parseDownstream()<br/>提取 id/chatId/status/errorInfo
  Ack->>MQ: handleAck(ackData)

  alt 队列命中已发送消息
    MQ->>MQ: resolveDeliveryStatus(body.status)
    alt status = UN_READ
      MQ-->>Ack: statusEvent(delivered)
    else status = READ
      MQ-->>Ack: statusEvent(read)
    else status = SEND_FAIL / DELIVER_FAIL
      MQ-->>Ack: statusEvent(failed, errorInfo)
    else status = REVOKE / DELETE
      MQ-->>Ack: statusEvent(revoked / deleted)
    else status = UN_SEND
      MQ-->>Ack: statusEvent(sending)
    end
  else 状态先到，serverMessageId 还没绑定
    MQ->>MQ: storeOrphanStatusAck(messageId)
    MQ-->>Ack: handled = false
    Note over MQ: 后续 bindServerMessageId() 时 replay
  else 队列未命中，但 body.id/chatId 完整
    Ack->>Ack: fallback 直接构造 MessageStatus event
  end

  Ack-->>WS: MessageStatus event
  WS->>Sync: updateMessageStatus(event)
  Sync->>Cache: updateMessageInCache(id/tempId/status/error)
  Cache-->>UI: 刷新消息状态
```

## 心跳保活流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant WS as WebSocket
    participant Server as 服务端

    loop 每30秒
        Client->>WS: client_heartbeat
        Note over WS: {<br/>  type: 'client_heartbeat',<br/>  body: {}<br/>}
        
        WS->>Server: 发送心跳
        Server->>Server: 更新最后活跃时间
        Server-->>WS: ACK (client_heartbeat)
        Note over WS: {<br/>  id: 'f0783175-...',<br/>  type: 'ack',<br/>  body: { type: 'client_heartbeat' }<br/>}
        
        WS-->>Client: 心跳响应
        Client->>Client: 重置心跳计时器
    end

    Note over Client,Server: === 心跳超时 ===

    Client->>Client: 心跳超时（90秒无响应）
    Client->>Client: 标记连接断开
    Client->>Client: 尝试重连
```

## 会话列表查询流程

```mermaid
sequenceDiagram
    participant UI as UI组件
    participant Hook as useConversations
    participant ConvSvc as ConversationService
    participant API as 会话列表接口
    participant Server as 服务端

    UI->>Hook: 初始化
    Hook->>ConvSvc: list({ app, pin, clientVersion })
    ConvSvc->>API: GET /chat/v2/session/list
    Note over API: {<br/>  app: 'example_chat.waiter',<br/>  pin: '坐席UID',<br/>  clientVersion: '2.0.0'<br/>}
    
    API->>Server: 查询会话列表
    Server-->>API: 会话数据
    Note over API: {<br/>  code: 0,<br/>  data: [{<br/>    newUnreadCount: true,<br/>    app: 'example_chat.waiter',<br/>    sid: '56ed75a3...',<br/>    pin: '435345',<br/>    name: 'username',<br/>    subjectId: '资产id',<br/>    time: 1768984512862,<br/>    lastMessage: { Packet }<br/>  }]<br/>}
    
    API-->>ConvSvc: 会话列表
    ConvSvc->>ConvSvc: 映射为 Conversation 对象
    ConvSvc-->>Hook: Conversation[]
    Hook-->>UI: 会话列表
    UI->>UI: 渲染会话列表

    Note over UI,Server: === 实时更新 ===

    Server->>Hook: WebSocket 推送新消息
    Hook->>Hook: 更新会话列表
    Hook->>UI: 会话列表更新
```

## 状态切换流程

```mermaid
sequenceDiagram
    participant User as 坐席
    participant UI as UI组件
    participant Hook as useAgentStatus
    participant WS as WebSocket
    participant Server as 服务端

    User->>UI: 切换状态（ready -> busy）
    UI->>Hook: setStatus('busy', ext)
    
    Hook->>Hook: 更新本地状态
    Hook->>WS: status_switch
    Note over WS: {<br/>  type: 'status_switch',<br/>  body: {<br/>    status: 'busy',<br/>    ext: '扩展字段'<br/>  }<br/>}
    
    WS->>Server: 发送状态切换
    Server->>Server: 更新坐席状态
    Server-->>WS: ACK
    WS-->>Hook: 状态更新确认
    Hook-->>UI: 状态已更新
    UI-->>User: 显示当前状态
```

## 整体流程

```mermaid
flowchart TD
  subgraph Send["发送阶段"]
    A["UI 调用 useSendMessage"] --> B["生成 tempId，写入 optimistic message(status=sending)"]
    B --> C["messageQueue.enqueue(tempId/requestId)"]
    C --> D["发送 chat_message"]
    D --> E["服务端返回 chat_message ACK"]
    E --> F["messageQueue.handleOutgoingAck"]
    F --> G["绑定 serverMessageId，消息状态=sent"]
  end

  subgraph Callback["服务端回调阶段"]
    H["WebSocket 收到推送"] --> I{"是否是新格式<br/>type=msg_read_ack/msg_receive_ack?"}
    I -- "是" --> I1["normalizeIncomingPacket<br/>归一化为 ACK Packet"]
    I -- "否" --> I2["直接使用原始 Packet"]
    I1 --> J["PacketValidator + PacketHandlerStrategy"]
    I2 --> J
    J --> K["AckPacketHandler.parseDownstream<br/>提取 id/body.id/chatId/status/errorInfo"]

    K --> L{"messageQueue.handleAck<br/>能否命中队列?"}

    L -- "命中 outgoing" --> M{"是否是状态回调<br/>body.status / channel status?"}
    M -- "是" --> M1["resolveDeliveryStatus<br/>UN_SEND/SEND_FAIL/DELIVER_FAIL/UN_READ/READ/REVOKE/DELETE"]
    M -- "否" --> M2{"ACK 类型"}
    M2 -- "chat_message / msg_send_failed" --> M3["更新 sent/failed<br/>必要时继续绑定 serverMessageId"]
    M2 -- "msg_receive_ack / msg_read_ack" --> M4["按 ackRequestId 回填原消息<br/>delivered/read"]

    M1 --> N["生成 MessageStatusUpdatedEvent<br/>messageId/tempId/status/error"]
    M3 --> N
    M4 --> N

    L -- "未命中，但有 body.status" --> O1["queue 先 storeOrphanStatusAck"]
    O1 --> O2["后续 bindServerMessageId 时 replayOrphanStatusAcks"]
    O2 --> N

    L -- "未命中，但 handler 可用 body.id/body.chatId 兜底" --> O3["直接构造状态事件"]
    O3 --> N

    L -- "未命中，且只是 receipt ack" --> P["跳过<br/>避免把 ACK 自身 id 当消息 id"]
  end

  subgraph Cache["缓存与 UI"]
    N --> Q["MessageSyncService.updateMessageStatus"]
    Q --> R["MessageCacheHelper.updateMessageInCache"]
    R --> S["React Query 缓存更新"]
    S --> T["MessageList / StatusIndicator 刷新"]
  end

  G --> H

```

## 关键接口定义

### 1. 消息检查接口

```typescript
interface MessageCheckParams {
  /** 消息唯一 ID */
  id: string;
  /** 会话 ID */
  chatId: string;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
  /** 消息类型 */
  type: 'template' | 'custom';
  /** 客户端类型 */
  clientType?: string;
  /** 模板 code（type=template 时必填） */
  template?: string;
}

interface MessageCheckResult {
  /** 是否允许发送 */
  allowed: boolean;
  /** 错误码（不允许时） */
  code?: number;
  /** 错误消息（不允许时） */
  message?: string;
}
```

### 2. 模板查询接口

```typescript
interface TemplateQueryParams {
  /** 会话 ID */
  chatId: string;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
}

interface Template {
  /** 模板 ID */
  id: number;
  /** 模板名称 */
  name: string;
  /** 模板 code */
  code: string;
  /** 模板内容 */
  content: string;
  /** 消息预览 */
  previewContent: string;
  /** 模板语言 */
  language: string;
}
```

### 3. 消息发送接口

```typescript
interface MessageSendParams {
  /** 消息唯一 ID */
  id: string;
  /** 会话 ID */
  chatId: string;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
  /** 消息类型 */
  type: 'template' | 'custom';
  /** 客户端类型 */
  clientType?: string;
  /** 模板 code（type=template 时必填） */
  template?: string;
  /** 自定义消息内容（type=custom 时） */
  content?: Record<string, unknown>;
}
```

## 场景化服务接口

### 电催场景（示例业务）

```typescript
interface ExampleTemplateService extends ITemplateService {
  /** 查询模板（电催场景） */
  list(params: { chatId: string; channelType: ChannelTypeEnum }): Promise<Template[]>;
  
  /** 发送模板消息（电催场景） */
  send(params: {
    chatId: string;
    channelType: ChannelTypeEnum;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<MessageSendResult>;
}

interface ExampleMessageService extends IMessageService {
  /** 消息检查（电催场景 - 频次检查） */
  checkMessage(params: MessageCheckParams): Promise<MessageCheckResult>;
  
  /** 发送消息（电催场景） */
  sendMessage(params: MessageSendParams): Promise<MessageSendResult>;
}
```

### 客服场景（示例客服 Customer Service）

```typescript
interface 示例客服TemplateService extends ITemplateService {
  /** 查询模板（客服场景） */
  list(params: { conversationId: string; category?: string }): Promise<Template[]>;
  
  /** 发送模板消息（客服场景） */
  send(params: {
    conversationId: string;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<MessageSendResult>;
}

interface 示例客服MessageService extends IMessageService {
  /** 消息检查（客服场景 - 敏感词检查等） */
  checkMessage(params: {
    conversationId: string;
    content: Record<string, unknown>;
  }): Promise<MessageCheckResult>;
  
  /** 发送消息（客服场景） */
  sendMessage(params: {
    conversationId: string;
    content: Record<string, unknown>;
  }): Promise<MessageSendResult>;
}
```

## 总结

通过以上时序图和接口定义，我们可以看到：

1. **不同场景的差异**主要体现在：
   - Session ID 的生成规则不同
   - 租户（app）标识不同
   - 模板查询接口不同
   - 消息检查逻辑不同（频次 vs 敏感词）
   - 消息发送接口不同

2. **消息发送完整流程**包括：
   - 模板选择和查询
   - 消息验证
   - 消息检查（check 接口）
   - 消息发送（send 接口）
   - ACK 确认
   - 状态更新

3. **协议转换**由 PacketConverter 负责，实现 StandardMessage 和 RawPacket 之间的双向转换。

4. **ACK 机制**确保消息的可靠送达和状态同步。
