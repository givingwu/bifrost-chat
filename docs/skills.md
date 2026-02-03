# Bifrost-Chat 能力与技能清单

> 面向快速生成代码与模块拆分的能力索引（SDK + 后端基础设施）。

## 1. SDK 前端能力（Bifrost-Chat）

### 1.1 UI 渲染与交互

- 顶部工具栏：动态渠道按钮渲染 + 互斥状态管理
- 消息流：虚拟列表 + 消息类型工厂渲染
- 输入框策略：按渠道切换输入能力（SMS/WhatsApp/Email）
- 右侧上下文：Profile/Template/History 插件式扩展
- UI 组件模式：Container/Presentational 分离
- UI 虚拟化：长列表强制使用 react-window / react-virtuoso

### 1.2 状态与事件

- 全局 Store（Zustand），Slice 拆分（UI/Strategy/Conversation/Context）
- ClientBus 事件总线，宿主系统通信
- 单向数据流驱动（Host → Store → UI）
- SDK API：init/destroy/openContext/closeContext/on/emit
- Slice 细化能力：
  - UI：open/minimize/loading/error
  - Strategy：allowedChannels/activeChannel/agentStatus
  - Conversation：send/receive/statusUpdate/loadHistory/resend
  - Context：profile/templates 注入与拉取

### 1.3 消息处理

- Optimistic UI（发送前立即渲染）
- 临时 ID 与真实 ID 映射
- 失败重试、消息状态更新（sending/sent/read/failed）
- 统一消息模型（StandardMessage）

### 1.4 渠道扩展

- ChannelAdapter 多态实现
- DataMapper 数据转换 + Zod 校验
- Adapter 能力接口拆分：ITextSender/IMediaSender/IInteractionReporter
- AdapterFactory 按 channelType 实例化

### 1.5 网络与协议

- INetwork 抽象（connect/send/on）
- Protocol Switcher（Socket/SSE/Polling）
- Connection Manager（心跳、重连）

## 2. 后端系统能力（Bifrost）

### 2.1 Heimdall（长连接）

- 长连接维护
- 心跳保活
- 用户认证
- 用户连接位置存储
- 客户端消息收发

### 2.2 Hugin（路由）

- 消息协议解析与路由
- 业务线程池隔离
- 组装消息协议 + 投递目标解析
- 多租户规则校验
- 限流与降级
- 消息分发到业务系统

### 2.3 Hermod（投递）

- 推送执行（查找用户连接实例）
- ACK 管理与重试
- 消息状态维护（已读/未读/删除）
- 异步存储
- 重试失败进入 failover 队列

## 3. 数据结构与协议

- 标准消息体：StandardMessage
- 消息内容类型：text/voice/video/image/file/template/call_log
- 数据流：Outbound / Inbound
- 协议：ACK、心跳、会话、消息
- ChannelType：sms/whatsapp/email/voip/waba

## 4. 设计模式与原则

- Factory：消息渲染
- Adapter：多渠道适配
- Strategy：协议切换 / 输入策略
- Facade：DataLayer 封装
- Repository：数据访问解耦
- Observer：Store → UI
- Singleton：全局 Store
- SOLID / Anti-Corruption Layer
- ISP/DIP（Adapter 能力拆分、NetLayer 抽象）

## 5. 技术栈

- React + Zustand
- Tailwind CSS
- Virtual Scroll：react-window / react-virtuoso
- Zod Schema
- dayjs
- @ant-design/icons / lucide-react
- React.createRoot / Shadow DOM

## 6. 快速生成代码建议（可映射模块）

- `src/components/toolbar`：ChannelToolsList + ChannelButtonFactory
- `src/components/messages`：ChatMessageList + MessageRendererFactory + BubbleMap
- `src/components/composer`：ComposerStrategy
- `src/components/profile`：Profile
- `src/store/`：UI/Strategy/Conversation/Profile Slices
- `src/datalayer/`：Repository + OfflineQueue + Retry
- `src/adapter/`：SMSAdapter / WhatsAppAdapter / EmailAdapter / VoIPAdapter
- `src/mapper/`：各渠道 Mapper + Zod Schema
- `src/netlayer/`：INetwork + ProtocolSwitcher + Transport Implementations