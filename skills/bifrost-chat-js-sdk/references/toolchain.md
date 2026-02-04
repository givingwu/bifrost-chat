# 工具链与命令

## 常用命令

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 监听构建：`pnpm run dev`
- 测试：`pnpm run test`
- 代码检查：`pnpm run lint`
- 格式化：`pnpm run format`

## 构建体系

- Rslib 负责产物构建。
- 配置读取：`rslib.config.ts` 使用 `PORT` 与 `ENV_MODE`。

## Storybook

当修改或新增 `src/components/` 下的组件时，**必须同步更新对应的 Story 文档**。

### Story 文档位置

- 基础组件：`stories/basic/`
- Composer 组件：`stories/composer/`
- Conversation 组件：`stories/conversation/`
- Layout 组件：`stories/layout/`
- Messages 组件：`stories/messages/`
- Profile 组件：`stories/profile/`
- Toolbar 组件：`stories/toolbar/`

### Story 文档必须包含的内容

每个 Story 文档必须包含以下内容：

1. **Meta 配置**（title、component、tags）
   ```tsx
   const meta: Meta<typeof ComponentName> = {
     title: 'Category/ComponentName',
     component: ComponentName,
     tags: ['autodocs'],
   };
   ```

2. **基础示例**（Default）
   - 展示组件的基本用法
   - 包含必要的 props

3. **变体示例**
   - 展示组件的不同状态或样式
   - 例如：不同尺寸、不同变体、不同主题等

4. **交互示例**
   - 展示组件的交互行为
   - 例如：点击事件、状态切换等

5. **中文描述**
   - 每个示例都必须有中文注释
   - 描述示例的用途和特点

### Story 文档示例

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@/components/ComponentName';
import '@/styles/theme.css';

/**
 * ComponentName 组件 Story 文档
 *
 * 展示组件的各种用法：
 * - 功能描述
 * - 使用场景
 */

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

/**
 * 基础示例
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComponentName prop="value" />
    </div>
  );
};

/**
 * 变体示例
 */
export const Variants = () => {
  return (
    <div className="space-y-4">
      <ComponentName variant="primary" />
      <ComponentName variant="secondary" />
    </div>
  );
};

/**
 * 交互示例
 */
export const Interactive = () => {
  const [state, setState] = useState(false);
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComponentName onClick={() => setState(!state)} />
    </div>
  );
};
```

### 特殊注意事项

- **I18nProvider**：如果组件使用了 `useTranslation` hook，必须在 Story 中包裹 `I18nProvider`
  ```tsx
  import { I18nProvider } from '@/providers/I18n.provider';
  import zhCN from '@/locales/zh-CN.json';

  export const Default = () => {
    return (
      <I18nProvider locale="zh-CN" messages={zhCN}>
        <ComponentName />
      </I18nProvider>
    );
  };
  ```

- **Store Provider**：如果组件使用了 Zustand store，可能需要包裹相应的 Provider

- **主题样式**：确保导入 `@/styles/theme.css` 以应用正确的样式


## 测试

- Vitest 为默认测试体系。
- 测试文件：`*.test.ts` / `*.test.tsx`。
- 覆盖重点：状态存储、Hooks、路由守卫等流程。
