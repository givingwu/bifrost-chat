# 编码规范 (Code Style Guide)

> 本文档定义了 `bifrost-chat` SDK 的编码规范，所有贡献者应遵循以下规则。

---

## 1. 导入语句 (Import Statements)

### 规则：同一模块的导入必须合并为一条语句

**不允许**将同一个模块的 `import type` 和 `import` 分开写成两条语句：

```typescript
// ❌ 错误：两条语句导入同一个模块
import type {
  MessageSendResult,
  StandardMessage,
} from '@/interfaces/message.interface';
import {
  MessageStatusEnum,
  MessagePriorityEnum,
} from '@/interfaces/message.interface';
```

应合并为一条，使用内联 `type` 修饰符区分类型导入与值导入：

```typescript
// ✅ 正确：合并为一条语句，使用内联 type 修饰符
import {
  type MessageSendResult,
  type StandardMessage,
  MessageStatusEnum,
  MessagePriorityEnum,
} from '@/interfaces/message.interface';
```

**排列建议（可选）：** 类型导入（`type X`）在前，值导入在后，均按字母序排列。

**适用范围：** 所有 `.ts` / `.tsx` 文件，包括测试文件。

**工具支持：** Biome 的 `organizeImports` 规则会自动合并和排序。可以运行：

```bash
pnpm biome check --write src/
```

---

## 2. React 导入 (React Imports)

不需要手动导入 React（已配置 JSX transform 自动处理）：

```typescript
// ❌ 不需要
import React from 'react';

// ✅ 仅按需导入所用 API
import { useState, useCallback } from 'react';
```

---

## 3. 路径别名 (Path Aliases)

项目使用 `@/` 作为 `src/` 的别名，始终使用绝对路径别名，禁止相对路径越界导入：

```typescript
// ❌ 不允许：跨层级相对路径
import { useMessages } from '../../../hooks/use-messages.hook';

// ✅ 正确：使用 @/ 别名
import { useMessages } from '@/hooks/use-messages.hook';
```

同目录下的模块可以使用 `./` 相对路径：

```typescript
// ✅ 同目录内可以用相对路径
import { ComposerHint } from './ComposerHint';
```

---

## 4. 类型 vs 值 (Types vs Values)

- **接口（Interface）和类型别名（Type Alias）** 只用于类型约束，导入时必须加 `type`。
- **枚举（Enum）** 是值，导入时不加 `type`。
- **类（Class）** 是值，导入时不加 `type`（除非只用于类型推断）。

```typescript
import {
  type StandardMessage,   // interface → type
  type SendMessageOptions, // interface → type
  MessageStatusEnum,       // enum → value
  MessageTypeEnum,         // enum → value
} from '@/interfaces/message.interface';
```

---

## 5. 国际化 (i18n)

所有面向用户的文本必须通过 SDK 内部的 `useTranslation` Hook 获取，禁止硬编码：

```typescript
// ❌ 不允许
<span>loading...</span>

// ✅ 正确
const { t } = useTranslation();
<span>{t('common.loading')}</span>
```

新增文案时，必须同时在 `src/locales/zh-CN.json` 和 `src/locales/en-US.json` 中添加对应条目。

---

## 6. Biome 配置

项目使用 [Biome](https://biomejs.dev/) 进行代码格式化和 Lint，运行以下命令自动修复：

```bash
# 格式化 + import 排序 + 自动修复
pnpm biome check --write src/

# 仅检查，不修改
pnpm biome check src/
```

提交前（`pre-commit`）会自动运行 Biome。
