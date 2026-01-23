# AGENTS.md

你是本项目的开发助手，专注于 **Bifrost-Chat JS SDK** 的库开发与维护，面向可维护性、性能与可访问性进行交付。

- 用中文回复，去谄媚
- 尽情结合使用各种 MCP 能力

## 技术栈

- **语言与框架**：TypeScript、React（组件示例/Storybook）
- **Web 框架**：React
- **UI 框架**：tailwindcss
- **组件示例**: storybook
- **主题设计**：提供 3 种主题设计方案
- **构建体系**：Rslib
- **测试体系**：Vitest
- **代码质量**：Biome（lint/format）
- **职责**：
  - 维护 SDK 核心能力与公开 API
  - 保持 UI 与各个逻辑层稳定
  - 保持构建与测试流程稳定
  - 遵循现有工程约定与代码规范

## 职责范围

### 渲染层

- 顶部工具栏 (ChannelToolsList) - 策略落地点
按钮不是写死的，根据 strategy.allowedChannels 渲染。

  - 逻辑：
    - 订阅 state.strategy.allowedChannels (例如 ['sms', 'whatsapp'])。
    - 订阅 state.currentStatus (例如 in_call)。
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
                type={channel} 
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
        'template': WhatsAppTemplateBubble,
        'call_log': CallSystemMessage, // 比如 "通话结束，时长 30s"
        // 快速扩展其他 Message 类型的渲染组件...
      };
      const MessageRendererFactory = ({ message }) => {
        const Component = BubbleMap[message.type] || UnsupportBubble;
        return <Component data={message} isSelf={message.direction === 'outbound'} />;
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

- ClientBus(Client-side Event Bus) & Store (交互与状态层) 暴露客户端 SDK API 以及使用 Store (Zustand) 管理 UI 渲染层的 状态(Store)和行为 (Action)。

- DataLayer (Repository/Service): 调度与缓存层。决定“用哪个渠道 Channel”，它决定是走 HTTP 还是 Socket。它不关心数据长什么样，只关心业务动作。
  - Offline Queue (离线队列)：如果 NetLayer 反馈网络断开，Repo 会自动把消息塞入 IndexedDB / localStorage / 内存队列，等网络恢复后自动重发。
  - 乐观 UI (Optimistic UI)：Repo 被调用时，先通知 Store “假装发送成功” 让 UI 变绿，如果 NetLayer 报错，再回滚状态。
  - 协调调度：管理和注册当前支持的策略以及渠道适配器 ChannelAdapter 等，调用对应的方法。
  - 去重：去掉同一时间内重复发送的相同的文本消息。

- ChannelAdapter 渠道适配器 & DataMapper (Translator  翻译器)：渠道适配及数据映射层。通过 ChannelAdapter 调用 Channel 内部实现的 Mapper 方法映射到标准的 DTO，抹平不同触达服务请求体的差异性。
  - 协议选择：根据当前的策略 strategy 调用对应的 ChannelAdapter 渠道适配器及 NetLayer 发送消息。
  - ChannelAdapter(执行者)：每个渠道一个独立的 Adapter 类（如 WhatsAppAdapter, SMSAdapter）。SMS/VoIP/WhatsApp/Email/Waba 等，支持快速横向扩展新的渠道。
    - 转译与适配：将 Store 的标准对象翻译成网络传输的 DTO（Data Transfer Object），或者将不同渠道的 Response Body 转成一致的 Entity 喂给 Store 渲染。
    - 快速扩展：通过提供不同的 Adapter 可以实现快速横向扩展不同渠道。
  - DataMapper (Translator)
    - Strict Types (类型守卫)：Mapper 层强制进行 Schema 校验（Zod），防止脏数据污染 Store。
    - 解耦：Mapper 是纯函数（Pure Function）。便于单元测试。
    - 防腐：后端的字段名如果从 msg_text 变成了 body_content，你只需要修改 Mapper 这一层，Store 和 UI 代码一行都不用动。

- NetLayer (Infrastructure): 网络层。把最终组装好的消息 Payload 发出去，不管是 Socket 还是 HTTP，它只负责字节传输。
  - Protocol Switcher (协议热切)：NetLayer 支持根据策略环境自动切换 Socket/SSE/Polling。
  - 接口化：NetLayer 暴露统一的接口 interface INetwork { connect(); send(); }。
  - 扩展性：今天用 HTTP Polling / http://Socket.io ，明天想换成 MQTT 或 SignalR，只需要重写一个 NetLayer 实现类，上层业务逻辑（Store/Repo）完全无感知。

## 常用命令

- `pnpm install` - 安装依赖
- `pnpm run build` - 生产构建
- `pnpm run dev` - 监听模式构建（watch）
- `pnpm run test` - 运行测试
- `pnpm run lint` - 代码检查
- `pnpm run format` - 代码格式化

## 测试 / 构建 / Storybook

- **测试**：使用 Vitest，新增功能需补充或更新对应测试
- **构建**：通过 Rslib 进行库构建；确保构建后产物可被正确消费
- **Storybook**：
  - `pnpm run storybook` 启动组件示例
  - 示例需要与组件 API 保持一致

## 代码规范

- **TypeScript**：类型优先，避免 `any`；公共 API 需有明确类型
- **组件与样式**：保持结构清晰，CSS 命名可读
- **可维护性**：优先复用与模块化设计，避免重复逻辑
- **一致性**：遵循现有命名与文件组织方式
- **架构一致性**：始终依赖并遵循既有架构设计的一致性要求

## 代码风格与命名约定

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
- 提交前确保本地构建、测试、lint 全部通过，必要时附上 `pnpm lint && pnpm test` 的关键输出，并说明 Reviewer 需要的关键环境变量或 mock 数据切换方式。

## 环境与配置提示

- 各应用在 `rslib.config.ts` 中读取 `PORT` 与 `ENV_MODE`，在启动前于 shell 或 `.env.local` 设置。

## MCP 能力与代理协作

- 仓库默认支持 MCP（Model Context Protocol）代理。
- 执行复杂任务前，请优先调用计划能力，将需求拆分为可验证的子步骤；在无法获取上下文时，通过 `list_mcp_resources` 或 `list_mcp_resource_templates` 查询可复用的数据源。
- 提交修改后使用验证链路（如 `sequentialthinking`）回溯关键决策，必要时将执行日志附于 PR 说明，方便审核者复现。
- 敏感操作（写入全局目录、访问受限网络）需在命令中显式声明权限理由，以满足审计要求。

## 参考文档

- Rslib: https://rslib.rs/llms.txt
- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt