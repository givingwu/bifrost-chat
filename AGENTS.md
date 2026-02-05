# AGENTS.md

你是本项目的开发助手，专注于 **Bifrost-Chat JS SDK** 的库开发与维护，面向可维护性、性能与可访问性进行交付。

- 用中文回复，去谄媚
- 尽情结合使用各种 MCP 能力
- 尽量使用 `tsconfig.json` 中配置的路径别名 alias

## 核心架构规则 (v2.0.0)

### 1. 会话概念统一

**决策**: 统一使用 **Conversation**，严格禁止使用 **Session**

**理由**:
- ✅ 更符合即时通讯的业务语义
- ✅ 更直观和易于理解
- ✅ 与业界标准一致 (WhatsApp, Telegram, iMessage 都使用 Conversation)
- ✅ 更好的可读性

**命名规范**:
```typescript
// ✅ 正确 - 必须使用 Conversation
interface Conversation { }
interface IConversationService { }
interface ConversationData { }
interface ConversationProps { }
useConversations()
export const ConversationList = () => { }
class ConversationServiceImpl implements IConversationService { }

// ❌ 错误 - 严格禁止使用 Session
interface Session { }
interface ISessionService { }
interface SessionData { }
interface SessionProps { }
useSessions()
export const SessionList = () => { }
class SessionServiceImpl implements ISessionService { }
```

**迁移指南**:
```typescript
// ❌ 旧代码
import { Session, ISessionService, useSessions } from '@feoe/bifrost-chat';

// ✅ 新代码
import { Conversation, IConversationService, useConversations } from '@feoe/bifrost-chat';
```

### 2. Template 从 Profile 剥离

**职责划分**:

| 模块 | 职责 | 目录 |
|------|------|------|
| **Profile** | 展示客户/联系人信息 (姓名、头像、标签等) | `src/components/profile/` |
| **Template** | 管理和选择消息模版 (模版列表、预览、发送) | `src/components/templates/` |

**目录结构**:
```
src/
├── components/
│   ├── profile/           # Profile 组件 (独立)
│   │   ├── Profile.tsx
│   │   ├── ProfileInfo.tsx
│   │   └── ...
│   └── templates/         # Template 组件 (独立)
│       ├── TemplateList.tsx
│       ├── TemplatePicker.tsx
│       └── TemplatePreview.tsx
```

### 3. 使用泛型解耦参数类型

**问题**: 不同业务方的 API 参数不同

**解决方案**: 使用泛型,调用方自定义参数类型

```typescript
// ✅ 使用泛型
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

**核心设计**: SDK 提供接口,调用方提供实现

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

// 使用 SDK
<ServiceProvider
  conversationService={new MyConversationService()}
  messageService={new MyMessageService()}
  templateService={new MyTemplateService()}
>
  <ChatContainer />
</ServiceProvider>
```

### 5. React Query + 声明式编程

**状态分类**:

| 状态类型 | 管理方案 | 示例 |
|---------|---------|------|
| **服务端状态** | React Query | 会话列表、消息列表、模版列表 |
| **客户端状态** | Zustand | 输入框内容、面板状态、主题、语言 |

**优势**:
- 代码量减少 80%
- 自动缓存和重新获取
- 内置乐观更新
- 更好的开发者体验

### 6. 类型安全

- 使用 TypeScript 严格模式
- 使用 Zod 进行运行时类型校验
- 所有公共 API 都有明确的类型定义

### 7. 错误处理

```typescript
// 统一的错误类型
export class SDKError extends Error { }
export class NetworkError extends SDKError { }
export class ValidationError extends SDKError { }
export class AuthorizationError extends SDKError { }
```

### 8. 性能优化

- 虚拟滚动 (@tanstack/react-virtual)
- 分页加载 (@tanstack/react-query 无限滚动)
- 懒加载 (组件级别的代码分割)
- 自动缓存 (@tanstack/react-query)

### 9. 国际化

- 支持中英文
- 可扩展到其他语言

### 10. 可访问性

- ARIA 属性
- 键盘导航
- 屏幕阅读器支持

### 14. 安全性

- 数据脱敏
- XSS 防护 (DOMPurify)
- CSRF 防护
- 敏感信息加密

## 技术栈

- **语言与框架**：TypeScript、React（组件示例/Storybook）
- **Web 框架**：React
- **UI 框架**：tailwindcss
- **组件示例**: storybook
- **主题设计**：提供 3 种主题设计方案
- **构建体系**：Rslib
- **测试体系**：Vitest
- **代码质量**：Biome（lint/format）

## 职责范围

- 维护 SDK 核心能力与公开 API
- 保持 UI 与各个逻辑层稳定
- 保持构建与测试流程稳定
- 遵循现有工程约定与代码规范

### 渲染层

- 顶部工具栏 (ChannelToolsList) - 策略落地点
按钮不是写死的，根据 strategy.allowedChannels 渲染。
  - 逻辑：
    - 订阅 state.strategy.allowedChannels (例如 ['sms', 'whatsapp'])。
    - 订阅 state.strategy.agentStatus (例如 in_call)。
    - 互斥逻辑：如果 in_call 为 true，则 VoIP 按钮显示为“挂断”或禁用其他语音渠道。
  - 组件结构：
    ```tsx
    const ChannelToolbar = () => {
      const { channels, status } = useStore(selector);

      return (
        <div className="toolbar">
          {channels.map(channel => (
            // 工厂模式渲染不同按钮
            <ChannelButtonFactory
                key={channel}
                channel={channel}
                disabled={isDisabled(channel, status)} 
            />
          ))}
        </div>
      );
    }
    ```
  - 中间消息流 (ChatMessageList) - 核心交互
    最复杂的部分，需要处理多种消息类型和高性能滚动。
    - MessageFactory (渲染工厂)：建立一个消息类型映射表，使用策略模式寻找目标组件，使用工厂模式渲染。
      ```tsx
      const BubbleMap = {
        'text': TextBubble,
        'image': ImageBubble,
        'audio': AudioPlayerBubble,
        'video': VideoBubble,
        'file': FileBubble,
        'template': WhatsAppTemplateBubble,
        'location': LocationBubble,
        'rich_media': RichMediaBubble,
        'other': SystemMessage,
        // 快速扩展其他 Message 类型的渲染组件...
      };
      const MessageRendererFactory = ({ message }) => {
        const Component = BubbleMap[message.type] || UnsupportBubble;
        return <Component data={message} isSelf={message.direction === 'outgoing'} />;
      }
      ```
    - 状态处理：
      - Sending (乐观更新): 消息气泡显示半透明 + 转圈 Loading。
      - Failed: 显示红色感叹号 + “重试”按钮。
      - Read: 比如说像 WhatsApp 渠道特有的“双蓝勾”。某些 Channel 没有该状态或者是否需要该状态？
- 输入框 (Composer Strategy) - 基于策略模式渲染
需要知道当前选中的是哪个渠道，以解决“同一个组件在不同渠道下表现不同”的问题。
  - 动态切换：
    - SMS：禁止上传视频，禁止富文本，显示“剩余字符数 / 计费条数”。
    - WhatsApp：允许发送图片、文件，显示“模板选择”按钮。
    - Email：显示富文本编辑器 (Subject + Body)。
  - 状态展示:
    - WhatsApp 有双钩，展示已读
    - SMS 短信通常只有“已发送”
    - IM 有已读/未读
    - VoIP 有已接听/未接听/挂断/呼叫失败等
- 右侧上下文 (ContextPanel) - 辅助作业区，可选
  - Tab 页签设计：
    - Profile: 客户画像（从 CRM 拉取）。
    - Templates: 话术模板（点击直接填充到 Composer）。
    - Other: 比如 History 历史记录？？？。
    - 交互：点击模板列表中的一项 -> 触发 useStore.getState().setInputText(templateContent)。
- 技术栈 (Tech Stack)
  - Virtual Scroll: react-virtuoso 或 react-window (处理无限滚动的最佳实践)。
  - Date Processing: dayjs (轻量级处理时间戳显示)。
  - Styling: Tailwind CSS
  - DOM: React.createRoot / Shadow DOM
  - Icons: @ant-design/icons 和 lucide-react (轻量、统一的图标库)

### 逻辑层

- Service Interfaces + DI（核心入口）
  - SDK 只定义 `IConversationService`/`IMessageService`/`ITemplateService` 等接口与标准类型。
  - 接口参数使用泛型解耦，不绑定具体业务方的 API 参数结构。
  - 调用方在宿主侧实现服务，并通过 `ServiceProvider` 注入；UI 不直连后端。
- Hooks + React Query（服务端状态）
  - `useConversations`/`useMessages`/`useTemplates` 负责查询、缓存、失效与重取。
  - `useSendMessage`/`useCreateConversation`/`useMarkAsRead` 负责 mutation、乐观更新与回滚。
  - QueryKey 统一按业务实体设计（如 `['conversations', params]`、`['messages', conversationId]`）。
- Zustand（客户端状态）
  - 只管理 UI 本地状态：输入框、面板开关、激活会话、主题、语言等。
  - 会话列表、消息列表、模板列表等服务端状态不放入 Store，避免双写与漂移。
- Adapter + Mapper（渠道防腐层）
  - Adapter 负责渠道协议差异（HTTP/WebSocket/SSE 等）和能力封装。
  - Mapper 负责 DTO ↔ 标准实体转换，要求纯函数 + Zod 校验。
  - 后端字段变化仅允许在 Mapper/Adapter 层消化，不得泄漏到 Store 和组件。
- 实时与离线（增强能力）
  - 实时通知通过服务 `subscribe*` 接口回灌 React Query Cache。
  - 网络失败通过 mutation 级离线队列重试；组件层只消费声明式状态。
- 错误与可观测性
  - 统一使用 `SDKError`/`NetworkError`/`ValidationError`/`AuthorizationError`。
  - Hook 层处理重试策略与错误边界，组件层仅根据 loading/error/success 渲染。

## 常用命令

- `pnpm install` - 安装依赖
- `pnpm run build` - 生产构建
- `pnpm run dev` - 监听模式构建（watch）
- `pnpm run test` - 运行测试
- `pnpm run check` - 代码检查并按 Biome 规则修复
- `pnpm run format` - 代码格式化

## 测试 / 构建 / Storybook

- **测试**：使用 Vitest，新增功能需补充或更新对应测试
- **构建**：通过 Rslib 进行库构建；确保构建后产物可被正确消费
- **Storybook**：
  - `pnpm run storybook` 启动组件示例
  - 示例需要与组件 API 保持一致
  - 添加新组件需要生成新的 storybook

## 代码规范

- **TypeScript**：类型优先，避免 `any`；公共 API 需有明确类型
- **组件与样式**：保持结构清晰，CSS 命名可读
- **可维护性**：优先复用与模块化设计，避免重复逻辑
- **一致性**：遵循现有命名与文件组织方式
- **架构一致性**：始终依赖并遵循既有架构设计的一致性要求

## 代码风格与命名约定

- **命名规范**：严格遵循 [`docs/naming-conventions.md`](docs/naming-conventions.md) 中定义的命名规范
  - 组件使用 PascalCase，无前缀或后缀（如 `Profile`、`Button`）
  - 类型使用描述性后缀（如 `ProfileData`、`MessageProps`、`NetworkStatusEnum`）
  - Props 接口使用组件名 + `Props` 后缀（如 `ProfileProps`、`ButtonProps`）
  - 枚举使用 `Enum` 后缀（如 `MessageStatusEnum`、`ChannelTypeEnum`）
  - 避免组件名和类型名冲突
- Biome 统一格式：空格缩进、80 字符换行、TS/JS 使用单引号、JSX 使用双引号。
- React 组件建议采用函数式写法与 PascalCase 文件名（示例：`UserTable.tsx`），导出命名采用 camelCase。
- 默认使用 TypeScript，并通过 `tsconfig.json` 约束路径别名；公共环境变量集中在应用的 `src/config`。
- 大改动前运行 `biome check --write` 以规整代码，同时确认 `lint-staged` 钩子仍然有效，避免提交混入未格式化文件。
- 样式层使用 Tailwind CSS，并保持变量以 `@color-`、`@spacing-` 前缀归类。
- 参考 @https://www.notion.so/mountainwu/296d0703435c4d8686f6f84b44bb06a3 前端开发规范文档，代码需要符合文档中描述的规范。如果不符合，需要在 Code Review 指出。

## 测试指引

- 项目内预置 Vitest 类型声明，可依据应用需求接入 Vitest，默认使用 Vitest 测试。
- 测试文件命名为 `*.test.ts`/`*.test.tsx`，与业务代码同目录或置于 `src/__tests__`。
- 重点覆盖状态存储、Hooks、路由守卫等关键流程，确保核心流程具备可重复的断言。
- 新增测试时务必补充应用级 `test` 脚本（示例：`vitest run --coverage`），确保 `pnpm test` 能汇总结果。
- 建议维持核心模块 80% 以上函数覆盖率，并在 PR 描述中标明新增或缺失的测试场景。

## 提交与合并请求规范

- 遵循历史中的前缀模式（`feat:`、`fix:`、`chore:`、`hotfix:`），保持动词祈使句并在需要时补充作用域（如 `feat(netLayer): add socket.io to connect server`）。
- 提交 PR 时需关联任务单，简述业务影响，列出手动验证步骤，涉及 UI 的改动请附截图或录屏，并在描述中说明接口依赖或数据准备。
- 提交前确保本地构建、测试、检查全部通过，必要时附上 `pnpm run check && pnpm run test` 的关键输出，并说明 Reviewer 需要的关键环境变量或 mock 数据切换方式。

## 环境与配置提示

- 各应用在 `rslib.config.ts` 中读取 `PORT` 与 `ENV_MODE`，在启动前于 shell 或 `.env.local` 设置。

## MCP 能力与代理协作

- 仓库默认支持 MCP（Model Context Protocol）代理。
- 执行复杂任务前，请优先调用计划能力，将需求拆分为可验证的子步骤；在无法获取上下文时，通过 `list_mcp_resources` 或 `list_mcp_resource_templates` 查询可复用的数据源。
- 提交修改后使用验证链路（如 `sequentialthinking`）回溯关键决策，必要时将执行日志附于 PR 说明，方便审核者复现。
- 敏感操作（写入全局目录、访问受限网络）需在命令中显式声明权限理由，以满足审计要求。

## Skills 协作约定

- 先读 `skills/README.md`，按任务选择对应 skill。
- SDK 开发与维护默认使用 `skills/bifrost-chat-js-sdk/SKILL.md`。
- 主题与视觉设计任务默认使用 `skills/bifrost-chat-ui-design/SKILL.md`。
- skill 文档要区分「当前已实现」与「目标架构」，并与代码保持同步。

## 参考文档

- Rslib: https://rslib.rs/llms.txt
- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt
