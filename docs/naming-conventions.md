# 命名规范 (Naming Conventions)

## 概述

本文档定义了 Bifrost-Chat 组件库的命名规范，以避免组件名和类型名之间的冲突。

## 命名冲突问题

在 TypeScript 和 React 中，组件和类型使用相同的名称会导致命名冲突。例如：

```typescript
// ❌ 错误：命名冲突
export const Profile = () => { ... };
export interface Profile { ... }

// 使用时会出错
import { Profile } from '@feoe/bifrost-chat';
// Profile 是组件还是类型？
```

## 解决方案

### 1. 类型使用描述性后缀

**规则**：所有类型（interface、type、enum）都应该使用描述性后缀，明确表示它们的用途。

#### 常用后缀

| 后缀 | 用途 | 示例 |
|------|------|------|
| `Data` | 数据结构 | `ProfileData`, `MessageData` |
| `Props` | 组件属性 | `ProfileProps`, `ButtonProps` |
| `State` | 状态 | `ThemeState`, `NetworkState` |
| `Enum` | 枚举类型 | `NetworkStatusEnum`, `MessageTypeEnum` |
| `Type` | 类型别名 | `ChannelType`, `ThemeType` |
| `Config` | 配置 | `SDKConfig`, `ShortcutConfig` |
| `Options` | 选项 | `SendMessageOptions` |
| `Context` | 上下文 | `SDKContext`, `I18nContext` |
| `Instance` | 实例 | `I18nInstance` |
| `Template` | 模板 | `MessageTemplate`, `ProfileTemplate` |

#### 示例

```typescript
// ✅ 正确：类型使用后缀
export interface ProfileData {
  name: string;
  avatarUrl: string;
}

export const Profile = ({ profile }: { profile: ProfileData }) => {
  return <div>{profile.name}</div>;
};

// ✅ 正确：枚举使用 Enum 后缀
export enum NetworkStatusEnum {
  Connected = 'connected',
  Disconnected = 'disconnected',
}

export const NetworkStatus = ({ status }: { status: NetworkStatusEnum }) => {
  return <div>{status}</div>;
};
```

### 2. 组件命名规则

**规则**：组件使用 PascalCase，不添加前缀或后缀。

```typescript
// ✅ 正确
export const Profile = () => { ... };
export const Button = () => { ... };
export const MessageBubble = () => { ... };

// ❌ 错误
export const ProfileComponent = () => { ... };
export const ProfileView = () => { ... };
```

### 3. Props 接口命名

**规则**：Props 接口使用组件名 + `Props` 后缀。

```typescript
// ✅ 正确
export interface ProfileProps {
  profile: ProfileData;
}

export const Profile = ({ profile }: ProfileProps) => { ... };

// ✅ 正确：复杂组件
export interface MessageBubbleProps {
  message: StandardMessage;
  isSelf: boolean;
}

export const MessageBubble = ({ message, isSelf }: MessageBubbleProps) => { ... };
```

### 4. 枚举命名

**规则**：枚举类型使用 `Enum` 后缀，枚举值使用 PascalCase。

```typescript
// ✅ 正确
export enum MessageStatusEnum {
  Created = 'created',
  Sending = 'sending',
  Sent = 'sent',
  Failed = 'failed',
}

// 使用
const status: MessageStatusEnum = MessageStatusEnum.Sent;
```

### 5. 类型别名命名

**规则**：类型别名使用 `Type` 后缀（如果不够描述性，使用更具体的名称）。

```typescript
// ✅ 正确
export type ChannelType = 'sms' | 'whatsapp' | 'email';

// ✅ 更好的选择：使用枚举
export enum ChannelTypeEnum {
  SMS = 'sms',
  WhatsApp = 'whatsapp',
  Email = 'email',
}
```

## 当前项目的命名冲突

### 已解决的冲突

1. **Profile**
   - 组件：`Profile`
   - 类型：`ProfileData` ✅（已使用后缀）

2. **NetworkStatus**
   - 组件：`NetworkStatus`
   - 枚举：`NetworkStatusEnum` ⚠️（需要重命名）

### 需要修改的文件

#### 1. src/interfaces/network.interface.ts

```typescript
// ❌ 当前
export enum NetworkStatus {
  Connected = 'connected',
  // ...
}

// ✅ 修改为
export enum NetworkStatusEnum {
  Connected = 'connected',
  // ...
}

// 同时导出类型别名以保持向后兼容
export type NetworkStatus = NetworkStatusEnum;
```

#### 2. src/index.tsx

```typescript
// ❌ 当前
export type { NetworkStatus as NetworkStatusType } from './interfaces/network.interface';

// ✅ 修改为
export { NetworkStatusEnum } from './interfaces/network.interface';
export type { NetworkStatusEnum as NetworkStatus } from './interfaces/network.interface';
```

## 导出规范

### 组件导出

```typescript
// 导出组件（默认导出或命名导出）
export { Profile } from './components/profile/Profile';
export { Button } from './components/Button';
```

### 类型导出

```typescript
// 导出类型时使用 type 关键字
export type { ProfileData } from './interfaces/profile.interface';
export type { ProfileProps } from './components/profile/Profile';

// 如果需要避免冲突，使用 as 重命名
export type { NetworkStatusEnum as NetworkStatus } from './interfaces/network.interface';
```

### 枚举导出

```typescript
// 导出枚举
export { MessageStatusEnum, MessageTypeEnum } from './interfaces/message.interface';

// 如果需要向后兼容，同时导出类型别名
export type { MessageStatusEnum as MessageStatus } from './interfaces/message.interface';
```

## 最佳实践

### 1. 优先使用描述性名称

```typescript
// ✅ 好的命名
export interface UserProfileData { ... }
export interface MessageContentData { ... }
export interface ChatConversationData { ... }

// ❌ 不够描述性
export interface Data { ... }
export interface Info { ... }
```

### 2. 避免过度使用后缀

```typescript
// ✅ 简洁明了
export interface MessageProps { ... }

// ❌ 过度使用后缀
export interface MessagePropsType { ... }
export interface MessagePropsInterface { ... }
```

### 3. 保持一致性

在同一个模块中，保持命名风格的一致性：

```typescript
// ✅ 一致的命名
export interface ProfileData { ... }
export interface MessageData { ... }
export interface ConversationData { ... }

// ❌ 不一致的命名
export interface ProfileData { ... }
export interface MessageInfo { ... }
export interface Conversation { ... }
```

## 迁移指南

### 对于现有代码

如果您的代码中使用了旧的类型名称，需要进行以下修改：

```typescript
// ❌ 旧代码
import { NetworkStatus } from '@feoe/bifrost-chat';
const status: NetworkStatus = NetworkStatus.Connected;

// ✅ 新代码
import { NetworkStatusEnum } from '@feoe/bifrost-chat';
const status: NetworkStatusEnum = NetworkStatusEnum.Connected;

// 或者使用类型别名（向后兼容）
import { type NetworkStatus } from '@feoe/bifrost-chat';
const status: NetworkStatus = NetworkStatusEnum.Connected;
```

### 向后兼容性

为了保持向后兼容性，可以在导出时同时提供新旧名称：

```typescript
// src/index.tsx
export { NetworkStatusEnum } from './interfaces/network.interface';
// 向后兼容：导出类型别名
export type { NetworkStatusEnum as NetworkStatus } from './interfaces/network.interface';
```

## 检查清单

在添加新的组件或类型时，请确保：

- [ ] 组件名使用 PascalCase，无前缀或后缀
- [ ] 类型使用描述性后缀（Data、Props、State、Enum、Type 等）
- [ ] Props 接口使用组件名 + Props 后缀
- [ ] 枚举使用 Enum 后缀
- [ ] 导出时使用 `type` 关键字导出类型
- [ ] 没有命名冲突
- [ ] 命名具有描述性和一致性

## 参考资料

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Airbnb TypeScript Style Guide](https://github.com/airbnb/javascript/tree/master/packages/ts-eslint)
