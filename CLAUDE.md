# CLAUDE.md

你是本项目的开发助手，专注于 **Bifrost-Chat JS SDK** 的库开发与维护，面向可维护性、性能与可访问性交付。此文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

- 用中文回复，保持专业简洁
- 尽情结合使用各种 MCP 能力
- 尽量使用 `tsconfig.json` 中配置的路径别名 alias

## 项目概览

这是 **Bifrost-Chat JS SDK** (@feoe/bifrost-chat) - 基于 React 和 Tailwind CSS 构建的全渠道聊天组件库。该 SDK 提供完整的聊天 UI，通过 React Query 管理服务端状态，通过 Zustand 管理客户端状态，遵循依赖注入模式。

**关键约束**：公开 API 统一使用 **"Conversation"** 术语 - "Session" 已弃用，不得出现在公开 API、导出或文档中。

## 常用命令

```bash
# 开发
pnpm install          # 安装依赖
pnpm run dev         # 监听模式开发构建
pnpm run build       # 完整生产构建（包含 CSS）
pnpm run build:css   # 仅 CSS 构建（通过 rslib）

# 测试与质量检查
pnpm run test        # 运行 Vitest 测试
pnpm run check       # Biome 代码检查和格式检查
pnpm run format      # Biome 自动格式化

# Storybook
pnpm run storybook          # 启动 Storybook 开发服务器
pnpm run build:storybook    # 构建静态 Storybook

# 发布
pnpm run test && pnpm run build && pnpm publish
```

**强制工作流**：所有代码修改在提交前必须通过 `pnpm run test` 和 `pnpm run build`。此规则强制执行。

## 架构概览

### 分层结构

1. **契约层** (`src/interfaces/*.interface.ts`) - 带泛型参数的服务接口
2. **Provider 层** (`src/providers/`) - Config、Query、Service、I18n providers
3. **Hooks 层** (`src/hooks/`) - 用于数据获取和变更的 React Query hooks
4. **UI 组件层** (`src/components/`) - 默认布局和可组合组件
5. **Store 层** (`src/store/`) - Zustand 客户端状态切片

### 状态管理边界

| 状态类型 | 管理方式 | 示例 |
|---|---|---|
| 服务端状态 | React Query | 会话列表、消息列表、模板列表 |
| 客户端状态 | Zustand | 策略、主题、语言、输入区配置、当前会话 |

**关键**：切勿在 Zustand 中存储服务端实体（会话、消息、模板）。请使用 React Query 和正确的缓存键。

### Provider 层级结构

```tsx
<ConfigProvider>
  <QueryProvider>
    <ServiceProvider>
      <ChatContainer>
        <DefaultChatLayout />
      </ChatContainer>
    </ServiceProvider>
  </QueryProvider>
</ConfigProvider>
```

### 服务依赖注入

SDK 定义接口但实现由宿主应用提供：

- `IConversationService` - `src/interfaces/conversation.interface.ts`
- `IMessageService` - `src/interfaces/message.interface.ts`
- `ITemplateService` - `src/interfaces/template.interface.ts`
- `INetworkService` (可选) - `src/interfaces/network.interface.ts`

宿主实现这些服务并通过 `ServiceProvider` 注入。SDK 绝不直接调用后端 API。

### Query Keys

使用 `src/providers/query-keys.ts` 中的 `queryKeys`：
- `queryKeys.conversations.*`
- `queryKeys.messages.*`
- `queryKeys.templates.*`

切勿使用 `sessions` 作为键前缀。

## 重要架构决策

### Conversation vs Session
- **公开 API**：统一使用 "Conversation" 术语
- **内部**：仅在必要时为向后兼容保留 "Session"
- **Query Keys**：`conversations`（绝不用 `sessions`）
- **接口**：`IConversationService`、`useConversations` 等

### 状态管理
- 服务端状态 → React Query 配合 infinite queries 分页
- 客户端交互状态 → Zustand 切片
- 未读数量 → 单一事实来源：`Conversation.unreadCount`

### 网络集成
- 通过 ServiceProvider 可选注入 `INetworkService`
- 宿主提供网络快照和订阅回调
- SDK 同步到 Zustand `network` 切片和 React Query `onlineManager`
- SDK 中不直接使用 `navigator.onLine`

## 目录结构

```
src/
├── components/       # UI 组件
│   ├── composer/    # 输入区组件
│   ├── conversation/# 会话列表组件
│   ├── messages/    # 消息渲染
│   ├── template/    # 模板面板
│   ├── toolbar/     # 顶部工具栏与渠道过滤器
│   └── layout/      # 布局组件
├── hooks/           # 自定义 React hooks
├── interfaces/      # TypeScript 接口
├── providers/       # React Context providers
├── store/           # Zustand store
│   └── slices/      # Store 切片（strategy、network 等）
├── services/        # 服务包装器
├── styles/          # 全局样式
└── utils/           # 工具函数
```

## 代码风格与格式化

- **Biome** 用于代码检查和格式化（非 ESLint/Prettier）
- **缩进**：空格（2 个空格）
- **行长**：80 字符
- **引号**：TS/JS 使用单引号，JSX 使用双引号
- **TypeScript**：严格模式已启用

路径别名（在 `tsconfig.json` 中配置）：
- `@/*` → `./src/*`

优先使用内部路径别名而非相对导入。

## 命名规范

- 组件：PascalCase（`Topbar`、`AudioMessage`、`TemplatePanel`）
- Hooks：`use*` 前缀（`useConversations`、`useSendMessage`）
- 类型：`*Data`、`*Props`、`*Enum`、`*Config`、`*Options`
- ID：`conversationId`（绝不用 `sessionId`）
- Query keys：`conversations`、`messages`、`templates`（绝不用 `sessions`）

完整规则请参阅 `design/naming-conventions.md`。

## 测试

- **框架**：Vitest
- **环境**：jsdom（在 `vitest.config.ts` 中配置）
- **设置**：`vitest.setup.ts`
- **命名**：`*.test.ts` 或 `*.test.tsx`

使用 `pnpm run test` 运行测试。提交前所有测试必须通过。

## 构建与导出

- **构建工具**：Rslib（非直接使用 Webpack/Vite）
- **入口文件**：`src/index.ts`（公开 API）
- **组件导出**：`src/components/index.ts`
- **输出目录**：`dist/` 目录

仅 `src/index.ts` 和 `src/components/index.ts` 中的导出为公开 API。内部能力如 `useWebSocket` 和 `createWebSocketMessageHandler` **不**属于公开 API。

## 关键设计文档

- **架构基线**：`design/final-architecture.md`（单一事实源 SSOT）
- **文档导航**：`design/README.md`（所有设计文档索引）
- **命名规范**：`design/naming-conventions.md`
- **技能说明**：`skills/README.md`（skills 使用指南）

### 设计文档分类

根据 `design/README.md` 的分层结构：

**SSOT（单一事实源）**：
- `design/final-architecture.md` - 权威架构决策和实现事实

**当前实现（As-Is）**：
- `design/architecture-overview.md` - 代码行为和数据流
- `design/architecture-diagrams.md` - 构架图
- `design/component-architecture.md` - 组件架构
- `design/reactive-architecture-design.md` - 声明式架构

**目标架构（To-Be）**：
- `design/sdk-interface-abstraction-design.md` - 接口抽象设计
- `design/ui-flexibility-design.md` - UI 灵活性设计
- `design/migration-guide.md` - 架构迁移指南

**使用指南**：
- `design/offline-message-queue-usage.md` - 离线消息队列使用
- `design/mark-as-read-usage.md` - 已读标记使用
- `design/unread-usage.md` - 未读计数使用

参考 `design/final-architecture.md` 获取权威架构决策。

## 错误处理

使用 `src/interfaces/error.interface.ts` 中的错误类型：
- `SDKError`
- `HTTPError`
- `ValidationError`
- `AuthorizationError`
- `ConfigurationError`
- `NotImplementedError`
- `MapperError`

## 语言支持

- 当前：英语（`en-US`）和中文（`zh-CN`）
- 语言包文件：`src/locales/`

## 特定任务的 Skills

- **SDK 开发**：使用 `skills/bifrost-chat-js-sdk/SKILL.md`
- **UI 设计**：使用 `skills/bifrost-chat-ui-design/SKILL.md`

## 重要注意事项

1. **切勿**在公开 API 中使用 `Session` 术语
2. **切勿**在 Zustand 中存储服务端状态
3. **切勿**从 SDK 直接调用后端 API
4. **始终**使用 `@/*` 路径别名进行内部导入
5. **始终**在提交前运行 `pnpm run test` 和 `pnpm run build`
6. **始终**查阅 `design/final-architecture.md` 获取权威架构决策

## 快速参考

### 任务类型判断
- **接口层/服务层** → 使用 `bifrost-chat-js-sdk` skill
- **React Query hooks** → 使用 `bifrost-chat-js-sdk` skill
- **状态管理逻辑** → 使用 `bifrost-chat-js-sdk` skill
- **样式/主题调整** → 使用 `bifrost-chat-ui-design` skill
- **Storybook 示例** → 使用 `bifrost-chat-ui-design` skill
- **可访问性检查** → 使用 `bifrost-chat-ui-design` skill

### 常见问题查询
- **架构决策冲突** → 查阅 `design/final-architecture.md`
- **命名规范** → 查阅 `design/naming-conventions.md`
- **文档索引** → 查阅 `design/README.md`
- **技能使用** → 查阅 `skills/README.md`
