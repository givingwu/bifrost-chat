# Bifrost-Chat JS SDK 架构文档

> 本文档是 Bifrost-Chat JS SDK 架构的导航中心,提供快速访问所有架构相关文档。

## 📚 文档概览

### 最终架构设计 (推荐首先阅读)

**文件**: [`final-architecture.md`](./final-architecture.md)

**最新版本**: 2.0.0 (2026-02-05)

**内容**:
- ✅ 会话概念统一 (使用 Conversation)
- ✅ Template 从 Profile 剥离
- ✅ 使用泛型解耦参数类型
- ✅ 接口抽象与依赖注入
- ✅ React Query + 声明式编程
- ✅ 完整的命名规范
- ✅ 类型安全、性能优化、国际化、可访问性等

**适用场景**:
- 🎯 新成员快速了解整体架构
- 🎯 理解核心设计原则
- 🎯 查看完整的接口定义
- 🎯 学习命名规范和最佳实践

### 架构概览 (传统分层架构)

**文件**: [`architecture-overview.md`](./architecture-overview.md)

**内容**:
- 五层架构详细说明
- 协议映射 (Packet → StandardMessage)
- 关键流程 (Outbound、Inbound、状态同步、网络重连)
- 设计模式应用
- 扩展指南

**适用场景**:
- 理解传统分层架构
- 学习协议映射机制
- 查看设计模式应用
- 了解扩展方式

### 架构流程图

**文件**: [`architecture-diagrams.md`](./architecture-diagrams.md)

**内容**:
- 系统架构图
- 数据流图 (发送、接收、状态同步、网络重连)
- 关键流程图 (完整流程)
- 状态机图 (消息、网络、坐席、渠道)
- 组件关系图
- 协议映射图

**适用场景**:
- 可视化理解系统设计
- 数据流追踪
- 状态转换分析
- 组件依赖分析

### UI 灵活性设计

**文件**: [`ui-flexibility-design.md`](./ui-flexibility-design.md)

**内容**:
- 三层 API 设计 (Headless、Compound、All-in-One)
- ChatContainer 重构
- ChatContext 设计
- DefaultChatLayout 实现
- 使用示例

**适用场景**:
- 理解 UI 渲染层的灵活性设计
- 学习如何自定义 UI 组件
- 迁移到新的 API 设计

### React 声明式架构

**文件**: [`reactive-architecture-design.md`](./reactive-architecture-design.md)

**内容**:
- React Query vs Zustand 的职责划分
- 声明式优于命令式
- React Query Hooks 实现
- WebSocket 集成
- 组件实现示例
- 优势对比

**适用场景**:
- 理解 React Query 的使用
- 学习声明式编程
- 优化代码结构

### 接口抽象设计

**文件**: [`sdk-interface-abstraction-design.md`](./sdk-interface-abstraction-design.md)

**内容**:
- SDK 提供什么 vs 调用方提供什么
- 接口定义 (ISessionService, IMessageService, ITemplateService)
- Service Context Provider
- React Query Hooks
- 调用方实现示例
- SDK 默认实现

**适用场景**:
- 理解接口抽象设计
- 学习如何实现自定义服务
- 理解依赖注入模式

### 最终架构设计 (改进版)

**文件**: [`sdk-final-architecture-design.md`](./sdk-final-architecture-design.md)

**内容**:
- 概念统一与重构 (Conversation vs Session, Template 剥离)
- 使用泛型解耦参数类型
- 其他未考虑的问题 (错误处理、类型安全、性能优化等)
- 完整的解决方案

**适用场景**:
- 理解最新的架构改进
- 学习泛型的使用
- 了解完整的解决方案

### 组件架构

**文件**: [`component-architecture.md`](./component-architecture.md)

**内容**:
- 组件层级
- 组件职责与 Props
- 与逻辑层映射
- 关键数据流
- 组件扩展规范

**适用场景**:
- 理解组件架构
- 学习组件职责划分
- 查看组件与逻辑层的映射关系

### 命名规范

**文件**: [`naming-conventions.md`](./naming-conventions.md)

**内容**:
- 会话概念统一 (Conversation vs Session)
- 类型使用描述性后缀
- 组件命名规则
- Props 接口命名
- 枚举命名
- 导出规范
- 最佳实践

**适用场景**:
- 学习命名规范
- 避免命名冲突
- 保持代码一致性

## 🎯 核心设计原则

### 1. 会话概念统一

**统一使用 Conversation,禁止使用 Session**

```typescript
// ✅ 正确
interface Conversation { }
interface IConversationService { }
useConversations()
export const ConversationList = () => { }

// ❌ 错误 - 禁止使用
interface Session { }
interface ISessionService { }
useSessions()
export const SessionList = () => { }
```

**理由**:
- 更符合即时通讯的业务语义
- 与业界标准一致 (WhatsApp, Telegram, iMessage)
- 更好的可读性

### 2. Template 从 Profile 剥离

**职责划分**:

| 模块 | 职责 | 目录 |
|------|------|------|
| **Profile** | 展示客户/联系人信息 | `src/components/profile/` |
| **Template** | 管理和选择消息模版 | `src/components/templates/` |

### 3. 使用泛型解耦参数类型

```typescript
// ✅ 使用泛型,调用方自定义参数类型
interface IConversationService<
  TListParams = any,
  TCreateParams = any,
  TQueryParams = any,
> {
  list(params?: TListParams): Promise<Conversation[]>;
  create(params: TCreateParams): Promise<Conversation>;
  query(params: TQueryParams): Promise<Conversation | null>;
}
```

### 4. 接口抽象与依赖注入

**SDK 提供接口,调用方提供实现**

```typescript
// SDK 定义接口
export interface IConversationService<...> {
  list(params?: TListParams): Promise<Conversation[]>;
}

// 调用方实现接口
class MyConversationService implements IConversationService<...> {
  async list(params) {
    // 自定义实现
  }
}
```

### 5. React Query + 声明式编程

**状态分类**:

| 状态类型 | 管理方案 | 示例 |
|---------|---------|------|
| **服务端状态** | React Query | 会话列表、消息列表、模版列表 |
| **客户端状态** | Zustand | 输入框内容、面板状态、主题、语言 |

## 🚀 快速导航

### 按角色导航

#### 新成员入职
1. 阅读 [`final-architecture.md`](./final-architecture.md) (最新架构)
2. 查看 [`naming-conventions.md`](./naming-conventions.md) (命名规范)
3. 阅读 [`../AGENTS.md`](../AGENTS.md) (开发规范)
4. 阅读 [`../skills/bifrost-chat-js-sdk/SKILL.md`](../skills/bifrost-chat-js-sdk/SKILL.md) (技能说明)

#### 架构师
1. 阅读 [`final-architecture.md`](./final-architecture.md) (完整架构)
2. 查看 [`architecture-diagrams.md`](./architecture-diagrams.md) (流程图)
3. 参考 [`sdk-interface-abstraction-design.md`](./sdk-interface-abstraction-design.md) (接口设计)
4. 查看扩展指南

#### 前端开发
1. 阅读 [`final-architecture.md`](./final-architecture.md) 第 2 节 (架构层次)
2. 查看 [`component-architecture.md`](./component-architecture.md) (组件架构)
3. 阅读 [`ui-flexibility-design.md`](./ui-flexibility-design.md) (UI 灵活性)
4. 阅读 [`naming-conventions.md`](./naming-conventions.md) (命名规范)

#### 后端开发
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 3 节 (协议映射)
2. 查看 [`architecture-diagrams.md`](./architecture-diagrams.md) (协议映射图)
3. 阅读 [`../specs/`](../specs/) 目录下的协议文档
4. 参考 Packet → StandardMessage 映射表

#### 测试工程师
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 4 节 (关键流程)
2. 查看 [`architecture-diagrams.md`](./architecture-diagrams.md) (关键流程图)
3. 查看状态机图
4. 参考 [`../AGENTS.md`](../AGENTS.md) 测试指引章节

### 按任务导航

#### 新增渠道
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 7.1 节 (新增渠道)
2. 参考 [`ChannelType`](../src/interfaces/channel.interface.ts) 枚举
3. 查看 [`ChannelAdapter`](../src/interfaces/channel.interface.ts) 接口定义
4. 参考 [`ChannelButtonFactory`](../src/components/toolbar/ChannelButtonFactory.tsx) 实现

#### 新增消息类型
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 7.2 节 (新增消息类型)
2. 参考 [`MessageType`](../src/interfaces/message.interface.ts) 枚举
3. 查看 [`MessageRendererFactory`](../src/components/messages/MessageRendererFactory.tsx) 实现
4. 参考 [`MessageContent`](../src/interfaces/message.interface.ts) 联合类型

#### 新增主题
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 7.3 节 (新增主题)
2. 查看 [`theme.css`](../src/styles/theme.css) 样式定义
3. 参考 [`ThemeSlice`](../src/store/slices/theme.slice.ts) 状态管理

#### 新增协议
1. 阅读 [`architecture-overview.md`](./architecture-overview.md) 第 7.4 节 (新增协议)
2. 参考 [`INetwork`](../src/interfaces/network.interface.ts) 接口定义
3. 查看 [`Protocol Switcher`](../src/interfaces/network.interface.ts) 实现

#### 自定义服务实现
1. 阅读 [`sdk-interface-abstraction-design.md`](./sdk-interface-abstraction-design.md) (接口抽象)
2. 阅读 [`final-architecture.md`](./final-architecture.md) (使用示例)
3. 实现对应的 Service 接口
4. 通过 ServiceProvider 注入

## 📋 关键文件索引

### 架构文档
- [`final-architecture.md`](./final-architecture.md) - 最终架构设计 (推荐)
- [`architecture-overview.md`](./architecture-overview.md) - 传统分层架构
- [`architecture-diagrams.md`](./architecture-diagrams.md) - 架构流程图
- [`component-architecture.md`](./component-architecture.md) - 组件架构
- [`ui-flexibility-design.md`](./ui-flexibility-design.md) - UI 灵活性设计
- [`reactive-architecture-design.md`](./reactive-architecture-design.md) - React 声明式架构
- [`sdk-interface-abstraction-design.md`](./sdk-interface-abstraction-design.md) - 接口抽象设计
- [`sdk-final-architecture-design.md`](./sdk-final-architecture-design.md) - 改进版架构设计
- [`naming-conventions.md`](./naming-conventions.md) - 命名规范

### 技能文档
- [`../AGENTS.md`](../AGENTS.md) - 开发助手指南
- [`../skills/bifrost-chat-js-sdk/SKILL.md`](../skills/bifrost-chat-js-sdk/SKILL.md) - SDK 技能说明
- [`../skills/bifrost-chat-js-sdk/references/architecture.md`](../skills/bifrost-chat-js-sdk/references/architecture.md) - 架构总览
- [`../skills/bifrost-chat-js-sdk/references/logic.md`](../skills/bifrost-chat-js-sdk/references/logic.md) - 逻辑层规范
- [`../skills/bifrost-chat-js-sdk/references/rendering.md`](../skills/bifrost-chat-js-sdk/references/rendering.md) - 渲染层规范
- [`../skills/bifrost-chat-js-sdk/references/conventions.md`](../skills/bifrost-chat-js-sdk/references/conventions.md) - 代码规范
- [`../skills/bifrost-chat-js-sdk/references/toolchain.md`](../skills/bifrost-chat-js-sdk/references/toolchain.md) - 工具链与命令

### 协议文档
- [`../specs/消息协议.md`](../specs/消息协议.md) - Packet 包协议
- [`../specs/聊天消息协议.md`](../specs/聊天消息协议.md) - 聊天消息协议
- [`../specs/ACK协议.md`](../specs/ACK协议.md) - ACK 协议
- [`../specs/心跳协议.md`](../specs/心跳协议.md) - 心跳协议
- [`../specs/会话列表.md`](../specs/会话列表.md) - 会话列表协议

### 核心接口
- [`../src/interfaces/sdk.interface.ts`](../src/interfaces/sdk.interface.ts) - SDK 接口定义
- [`../src/interfaces/channel.interface.ts`](../src/interfaces/channel.interface.ts) - 渠道接口定义
- [`../src/interfaces/message.interface.ts`](../src/interfaces/message.interface.ts) - 消息接口定义
- [`../src/interfaces/network.interface.ts`](../src/interfaces/network.interface.ts) - 网络接口定义
- [`../src/interfaces/agent.interface.ts`](../src/interfaces/agent.interface.ts) - 坐席接口定义
- [`../src/interfaces/conversation.interface.ts`](../src/interfaces/conversation.interface.ts) - 会话接口定义

### 核心组件
- [`../src/store/index.ts`](../src/store/index.ts) - Store 入口
- [`../src/components/messages/MessageRendererFactory.tsx`](../src/components/messages/MessageRendererFactory.tsx) - 消息渲染工厂
- [`../src/components/toolbar/ChannelButtonFactory.tsx`](../src/components/toolbar/ChannelButtonFactory.tsx) - 渠道按钮工厂

## 🎨 架构亮点

### 1. 接口抽象与依赖注入

- SDK 提供接口,调用方提供实现
- 完全解耦,支持不同的后端 API
- 开箱即用 (SDK 提供默认实现)

### 2. 会话概念统一

- 统一使用 Conversation
- 更符合业务语义
- 与业界标准一致

### 3. Template 独立

- 从 Profile 中剥离
- 职责清晰,独立管理

### 4. 泛型解耦

- 支持不同业务方的 API 参数
- 灵活扩展,无需修改 SDK

### 5. React Query + 声明式

- 代码量减少 80%
- 自动缓存和重新获取
- 更好的开发者体验

### 6. 类型安全

- TypeScript + Zod
- 编译时 + 运行时类型校验

### 7. 高性能

- 虚拟滚动
- 分页加载
- 自动缓存

### 8. 国际化

- 支持多语言
- 易于扩展

### 9. 可访问性

- ARIA 属性
- 键盘导航
- 屏幕阅读器支持

### 10. 可扩展性

- 插件系统
- 事件系统
- 主题定制

## 🔍 常见问题

### Q1: 为什么统一使用 Conversation 而不是 Session?

**A**: Conversation 更符合即时通讯的业务语义,与业界标准一致 (WhatsApp, Telegram, iMessage 都使用 Conversation),更直观和易于理解。

### Q2: 如何新增一个渠道?

**A**: 参考 [`final-architecture.md`](./final-architecture.md) 中的扩展指南,步骤如下:
1. 在 [`ChannelType`](../src/interfaces/channel.interface.ts) 枚举中添加新渠道类型
2. 创建对应的 Adapter 类
3. 创建对应的 Mapper 函数 (使用 Zod 校验)
4. 在 [`ChannelButtonFactory`](../src/components/toolbar/ChannelButtonFactory.tsx) 中注册图标
5. 在 [`MessageRendererFactory`](../src/components/messages/MessageRendererFactory.tsx) 中注册渲染组件 (如需要)

### Q3: 如何自定义服务实现?

**A**: 参考 [`sdk-interface-abstraction-design.md`](./sdk-interface-abstraction-design.md):
1. 实现 SDK 定义的接口 (如 IConversationService)
2. 通过 ServiceProvider 注入自定义实现
3. SDK 的组件会自动使用自定义实现

### Q4: 如何理解消息状态转换?

**A**: 参考 [`architecture-diagrams.md`](./architecture-diagrams.md) 第 4.1 节 (消息状态机),状态转换如下:
- Created → Sending → Sent → Delivered → Read
- 任何状态都可能 → Failed (发送失败)
- Failed → Sending (重试发送)

### Q5: 网络断开时消息如何处理?

**A**: 网络断开时,消息会自动进入 Offline Queue,网络恢复后自动重发。参考 [`architecture-diagrams.md`](./architecture-diagrams.md) 第 2.4 节 (网络重连数据流)。

## 📝 贡献指南

### 文档贡献
1. 确保文档与代码实现一致
2. 添加清晰的示例和图表
3. 保持文档结构清晰
4. 及时更新文档内容

### 架构贡献
1. 遵循现有架构设计原则
2. 确保分层清晰,职责明确
3. 使用设计模式提升可维护性
4. 添加充分的类型定义

### 代码贡献
1. 遵循 [`../AGENTS.md`](../AGENTS.md) 代码规范
2. 使用 TypeScript 类型定义
3. 添加单元测试
4. 更新相关文档

## 📞 联系方式

如有问题或建议,请联系 @FEOE/Bifrost-Chat Team。

---

**文档版本**: 2.0.0
**最后更新**: 2026-02-05
**维护者**: @FEOE/Bifrost-Chat Team
