# 代码规范

## TypeScript

- 类型优先，避免 `any`。
- 公共 API 必须定义明确类型。
- 常用类型必须明确声明枚举 `enum`。

## React

- 函数组件 + PascalCase 文件名（如 `UserTable.tsx`）。
- JSX 使用双引号。

## 命名规范

**严格遵循** [`docs/naming-conventions.md`](../../../docs/naming-conventions.md) 中定义的命名规范。

### 领域术语

- 会话统一使用 `Conversation`，禁止在新增命名中使用 `Session`。
- 模板统一使用“模板（Template）”，避免“模版”等混写。

### 组件命名

- 组件使用 PascalCase，无前缀或后缀
- 示例：`Profile`、`Button`、`MessageBubble`

### 类型命名

- 所有类型（interface、type、enum）使用描述性后缀
- 常用后缀：
  - `Data` - 数据结构（如 `ProfileData`、`MessageData`）
  - `Props` - 组件属性（如 `ProfileProps`、`ButtonProps`）
  - `State` - 状态（如 `ThemeState`、`NetworkState`）
  - `Enum` - 枚举类型（如 `NetworkStatusEnum`、`MessageTypeEnum`）
  - `Type` - 类型别名（如 `ChannelType`、`ThemeType`）
  - `Config` - 配置（如 `SDKConfig`、`ShortcutConfig`）
  - `Options` - 选项（如 `SendMessageOptions`）

### Props 接口命名

- Props 接口使用组件名 + `Props` 后缀
- 示例：`ProfileProps`、`MessageBubbleProps`

### 枚举命名

- 枚举类型使用 `Enum` 后缀
- 枚举值使用 PascalCase
- 示例：
  ```typescript
  export enum MessageStatusEnum {
    Created = 'created',
    Sending = 'sending',
    Sent = 'sent',
  }
  ```

### 避免命名冲突

- 组件名和类型名不能相同
- 如果存在冲突，类型必须使用后缀区分
- 示例：
  ```typescript
  // ✅ 正确
  export const Profile = () => { ... };
  export interface ProfileData { ... }

  // ❌ 错误
  export const Profile = () => { ... };
  export interface Profile { ... }
  ```

## 格式化

- Biome 统一格式：空格缩进、80 字符换行、TS/JS 单引号。
- 大改动前建议 `biome check --write`。

## Tailwind

- 变量命名前缀：`@color-`、`@spacing-`。
- 结构清晰，类名可读。

## 质量与一致性

- 避免重复逻辑，优先复用与模块化。
- 遵循现有命名与文件组织方式。
- 在添加新的组件或类型时，参考 [`docs/naming-conventions.md`](../../../docs/naming-conventions.md) 中的检查清单。
