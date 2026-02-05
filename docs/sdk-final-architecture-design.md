# SDK 最终架构设计 (改进版)

## 概述

本文档基于反馈改进架构设计,解决以下关键问题:
1. Template 从 Profile 中剥离
2. 统一会话概念 (Conversation vs Session)
3. 使用泛型解耦参数类型
4. 其他未考虑的问题

## 1. 概念统一与重构

### 1.1 会话概念统一

**决策**: 统一使用 **Conversation**

**理由**:
- ✅ 更符合即时通讯的业务语义
- ✅ 更直观和易于理解
- ✅ 与业界标准一致 (WhatsApp, Telegram, iMessage 都使用 Conversation)
- ✅ 更好的可读性

**命名规范**:
```typescript
// ✅ 正确
interface Conversation { }
interface ConversationService { }
useConversations()

// ❌ 错误
interface Session { }
interface SessionService { }
useSessions()
```

### 1.2 Template 从 Profile 剥离

**重构前**:
```
src/
├── components/
│   └── profile/
│       ├── Profile.tsx
│       ├── ProfileTemplates.tsx  // ❌ Template 混在 Profile 中
│       └── ...
```

**重构后**:
```
src/
├── components/
│   ├── profile/           // Profile 组件
│   │   ├── Profile.tsx
│   │   ├── ProfileInfo.tsx
│   │   └── ...
│   └── templates/         // Template 组件 (独立)
│       ├── TemplateList.tsx
│       ├── TemplatePicker.tsx
│       └── TemplatePreview.tsx
├── interfaces/
│   ├── profile.interface.ts
│   └── template.interface.ts  // 独立的接口
├── store/
│   ├── profile.slice.ts
│   └── template.slice.ts  // 独立的状态
└── hooks/
    ├── use-profile.hook.ts
    └── use-templates.hook.ts  // 独立的 hooks
```

**职责划分**:

| 模块 | 职责 |
|------|------|
| **Profile** | 展示客户/联系人信息 (姓名、头像、标签等) |
| **Template** | 管理和选择消息模版 (模版列表、预览、发送) |

## 2. 使用泛型解耦参数类型

### 2.1 问题分析

**之前的设计**:
```typescript
// ❌ 硬编码参数类型,不同业务方需要修改 SDK
interface IConversationService {
  list(params?: ListSessionsParams): Promise<Conversation[]>;
  create(params: CreateSessionParams): Promise<Conversation>;
}
```

**问题**:
- 参数类型硬编码,不同业务方的 API 参数不同
- 每次参数变化都需要修改 SDK 接口
- 违反了开闭原则

### 2.2 使用泛型改进

**新设计**:
```typescript
// ✅ 使用泛型,调用方自定义参数类型
interface IConversationService<TListParams = any, TCreateParams = any, TQueryParams = any> {
  list(params?: TListParams): Promise<Conversation[]>;
  create(params: TCreateParams): Promise<Conversation>;
  query(params: TQueryParams): Promise<Conversation | null>;
}
```

**使用示例**:

```typescript
// 业务方 A: 使用临时方案 API
interface TemporaryListParams {
  page?: number;
  pageSize?: number;
}

interface TemporaryCreateParams {
  businessNo: string;
  contactAccount: string;
  channel: number;
  source: number;
}

class TemporaryConversationService
  implements IConversationService<TemporaryListParams, TemporaryCreateParams, any> {
  async list(params?: TemporaryListParams) {
    // 实现...
  }
  async create(params: TemporaryCreateParams) {
    // 实现...
  }
}

// 业务方 B: 使用标准化协议
interface StandardListParams {
  limit?: number;
  cursor?: string;
}

interface StandardCreateParams {
  participants: string[];
  metadata?: Record<string, unknown>;
}

class StandardConversationService
  implements IConversationService<StandardListParams, StandardCreateParams, any> {
  async list(params?: StandardListParams) {
    // 实现...
  }
  async create(params: StandardCreateParams) {
    // 实现...
  }
}
```

### 2.3 完整的泛型接口定义

```typescript
// src/interfaces/conversation-service.interface.ts

/**
 * 会话服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TCreateParams 创建参数类型
 * @template TQueryParams 查询参数类型
 */
export interface IConversationService<
  TListParams = any,
  TCreateParams = any,
  TQueryParams = any,
> {
  /**
   * 获取会话列表
   * @param params 列表查询参数
   * @returns 会话列表
   */
  list(params?: TListParams): Promise<Conversation[]>;

  /**
   * 获取会话详情
   * @param conversationId 会话 ID
   * @returns 会话详情
   */
  get(conversationId: string): Promise<Conversation | null>;

  /**
   * 创建会话
   * @param params 创建参数
   * @returns 新创建的会话
   */
  create(params: TCreateParams): Promise<Conversation>;

  /**
   * 查询会话
   * @param params 查询参数
   * @returns 会话或 null
   */
  query(params: TQueryParams): Promise<Conversation | null>;
}
```

```typescript
// src/interfaces/message-service.interface.ts

/**
 * 消息服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TSendParams 发送参数类型
 * @template TReadParams 已读参数类型
 */
export interface IMessageService<
  TListParams = any,
  TSendParams = any,
  TReadParams = any,
> {
  /**
   * 获取消息列表
   * @param conversationId 会话 ID
   * @param params 列表查询参数
   * @returns 消息列表
   */
  list(conversationId: string, params: TListParams): Promise<StandardMessage[]>;

  /**
   * 发送消息
   * @param conversationId 会话 ID
   * @param params 发送参数
   * @returns 发送结果
   */
  send(conversationId: string, params: TSendParams): Promise<SendMessageResult>;

  /**
   * 标记消息已读
   * @param params 已读参数
   * @returns void
   */
  markAsRead(params: TReadParams): Promise<void>;

  /**
   * 订阅实时消息
   * @param callback 消息回调
   * @returns 取消订阅函数
   */
  subscribeToMessages(
    callback: (message: StandardMessage) => void,
  ): () => void;

  /**
   * 订阅消息状态更新
   * @param callback 状态更新回调
   * @returns 取消订阅函数
   */
  subscribeToMessageStatus(
    callback: (update: MessageStatusUpdate) => void,
  ): () => void;
}
```

```typescript
// src/interfaces/template-service.interface.ts

/**
 * 模版服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TSendParams 发送参数类型
 */
export interface ITemplateService<
  TListParams = any,
  TSendParams = any,
> {
  /**
   * 获取可用模版列表
   * @param params 列表查询参数
   * @returns 模版列表
   */
  list(params: TListParams): Promise<Template[]>;

  /**
   * 发送模版消息
   * @param params 发送参数
   * @returns 发送结果
   */
  send(params: TSendParams): Promise<SendMessageResult>;
}
```

## 3. 其他未考虑的问题

### 3.1 错误处理策略

**问题**: 不同业务方的错误处理需求不同

**解决方案**: 提供统一的错误类型,支持自定义错误处理

```typescript
// src/interfaces/error.interface.ts

/**
 * SDK 错误基类
 */
export class SDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 权限错误
 */
export class AuthorizationError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}
```

**错误处理配置**:

```typescript
// src/interfaces/sdk-config.interface.ts

export interface SDKConfig {
  // ... 其他配置

  /**
   * 错误处理器
   */
  errorHandler?: {
    /**
     * 全局错误处理
     */
    onError?: (error: SDKError) => void;

    /**
     * 网络错误处理
     */
    onNetworkError?: (error: NetworkError) => void;

    /**
     * 验证错误处理
     */
    onValidationError?: (error: ValidationError) => void;
  };
}
```

### 3.2 类型安全

**问题**: 如何确保类型安全,避免运行时错误?

**解决方案**: 使用 Zod 进行运行时类型校验

```typescript
// src/schemas/conversation.schema.ts

import { z } from 'zod';

/**
 * 会话 Schema (运行时类型校验)
 */
export const conversationSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  contactAccount: z.string(),
  channel: z.enum(['waba', 'sms', 'email', 'voip']),
  source: z.number(),
  customer: z.object({
    encryptedName: z.string().optional(),
    name: z.string().optional(),
  }),
  contact: z.object({
    encryptedName: z.string().optional(),
    name: z.string().optional(),
  }),
  relationType: z.string().optional(),
  remark: z.string().optional(),
  unreadCount: z.number(),
  lastMessageAt: z.number(),
  createdAt: z.number(),
});

/**
 * 从运行时数据推断类型
 */
export type Conversation = z.infer<typeof conversationSchema>;
```

**在 Mapper 中使用**:

```typescript
// src/mappers/conversation.mapper.ts

import { conversationSchema } from '@/schemas/conversation.schema';
import { ValidationError } from '@/interfaces/error.interface';

export class ConversationMapper {
  fromDto(data: unknown): Conversation {
    try {
      // 使用 Zod 校验数据
      return conversationSchema.parse(data);
    } catch (error) {
      throw new ValidationError('Invalid conversation data', { originalError: error });
    }
  }
}
```

### 3.3 性能优化

**问题**: 大量数据可能导致性能问题

**解决方案**:

1. **虚拟滚动**: 使用 `@tanstack/react-virtual`
2. **分页加载**: 使用 `@tanstack/react-query` 内置分页支持
3. **懒加载**: 组件级别的代码分割
4. **缓存策略**: `@tanstack/react-query` 自动缓存

### 3.4 国际化支持

**问题**: 如何支持多语言?

**解决方案**: 使用内置的国际化方案

**在组件中使用**:

```typescript
import { useTranslation } from 'react-i18next';

export function ComposerToolbar() {
  const { t } = useTranslation();

  return (
    <input placeholder={t('message.type')} />
  );
}
```

### 3.5 可访问性 (A11y)

**问题**: 如何确保可访问性?

**解决方案**:

1. **ARIA 属性**: 使用正确的 ARIA 属性
2. **键盘导航**: 支持键盘操作
3. **屏幕阅读器**: 提供语义化的标签

```typescript
export function ConversationItem({ conversation, isActive, onSelect }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isActive}
      aria-label={`Conversation with ${conversation.contact.name}`}
      onClick={() => onSelect(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(conversation.id);
        }
      }}
    >
      {/* ... */}
    </div>
  );
}
```

### 3.6 主题定制

**问题**: 不同业务方需要不同的主题

**解决方案**: 使用 CSS Variables + Tailwind CSS

```css
/* src/styles/theme.css */

:root {
  /* 主色调 */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;

  /* 背景色 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f3f4f6;

  /* 文字色 */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;

  /* 边框色 */
  --color-border: #e5e7eb;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #111827;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
}
```

**在组件中使用**:

```typescript
export function Button({ children, variant = 'primary' }) {
  return (
    <button
      className={`
        px-4 py-2 rounded-md
        ${variant === 'primary' ? 'bg-primary' : 'bg-secondary'}
      `}
    >
      {children}
    </button>
  );
}
```

## 4. 最终架构

### 4.1 目录结构

```
src/
├── components/              # 组件层
│   ├── conversation/        # 会话组件
│   ├── messages/            # 消息组件
│   ├── composer/            # 输入框组件
│   ├── profile/             # 个人资料组件
│   └── templates/           # 模版组件
├── interfaces/              # 接口定义
│   ├── conversation-service.interface.ts
│   ├── message-service.interface.ts
│   ├── template-service.interface.ts
│   ├── conversation.interface.ts
│   ├── message.interface.ts
│   ├── template.interface.ts
│   ├── profile.interface.ts
│   ├── error.interface.ts
│   ├── plugin.interface.ts
│   └── logger.interface.ts
├── hooks/                   # React Hooks
│   ├── use-conversations.hook.ts
│   ├── use-messages.hook.ts
│   ├── use-templates.hook.ts
│   └── use-profile.hook.ts
├── providers/               # Context Providers
│   ├── service.provider.tsx
│   └── sdk.provider.tsx
├── schemas/                 # Zod Schemas (运行时类型校验)
│   ├── conversation.schema.ts
│   ├── message.schema.ts
│   └── template.schema.ts
├── events/                  # 事件系统
│   └── event-bus.event.ts
├── utils/                   # 工具函数
│   ├── sanitizer.util.ts
│   ├── performance.util.ts
│   └── ...
├── i18n/                    # 国际化
│   └── index.ts
├── styles/                  # 样式
│   └── theme.css
└── index.ts                 # 导出
```

### 4.2 核心接口

```typescript
// src/interfaces/sdk.interface.ts

import type { SDKConfig } from './sdk.interface';

export interface BifrostChatSDK {
  /**
   * 初始化 SDK
   */
  init(config: SDKConfig): Promise<void>;

  /**
   * 销毁 SDK
   */
  destroy(): void;

  /**
   * 获取 SDK 版本
   */
  getVersion(): string;
}
```

