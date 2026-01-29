# Bifrost-Chat

<img src="./logo.jpeg" alt="Bifrost-Chat" width="100" />

Omni-channel Chat JS SDK based on Bifrost Components

## Components

- [Bifrost](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/384892985/Bifrost)
  - [Bifrost-Heimdall](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392692157/Bifrost-Heimdall)
  - [Bifrost-Hugin](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392299260/Bifrost-Hugin)
  - [Bifrost-Hermod](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392561381/Bifrost-Hermod)
- Bifrost-Chat

## Architecture
- [全渠道对话 JS SDK 设计 (Omni-channel Chat JS SDK Design)](https://kylith.atlassian.net/wiki/spaces/FrontEnd/blog/344856321/JS+SDK+Omni-channel+Chat+JS+SDK+Design)
- [Bifrost-Chat JS SDK 详细设计](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/395313841/Bifrost-Chat+JSSDK)

### Design

- [Apple Design Style](https://www.figma.com/make/zK4Inbqsjj7GgzD83FVUGI/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-Apple-Design?t=7XJm5o2dqk82QvGD-20&fullscreen=1)
- [Ant-Design Style](https://www.figma.com/make/JLzdL2qNFbazUvXq06m4EZ/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-Ant-Design?p=f&t=21pdeAFGyKHPuHrI-0&fullscreen=1)
- [ShadCN style](https://www.figma.com/make/pVoNt73mBawf4ePMOUfa9G/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-ShadCN-style?p=f&t=fT4tGEa2zaty5ELt-0&fullscreen=1)

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Build the library:

```bash
pnpm run build
```

Build the library in watch mode:

```bash
pnpm run dev
```

## Styles

组件样式需要由宿主项目显式引入（Storybook 使用 Tailwind 自动编译）：

```ts
import '@bifrost-chat/styles/index.css';
```

> 如果只需要主题变量，可引入 `@bifrost-chat/styles/theme.css`。

## Storybook

组件示例与聊天组合视图：

```bash
pnpm run storybook
```

> Storybook 默认关闭 TS 校验，避免 Vitest 的 tests 断言类型影响构建。

- `Chat/Components`：单个组件预览（Topbar/MessageList/Composer/ContextPanel/ConversationList）。
- `Chat`：完整聊天组合（ChatLayout + ChatContainer）。
