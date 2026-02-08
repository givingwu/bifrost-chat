# ComposerToolbar 草稿功能集成设计

## 架构分析

### 当前已实现（As-Is）

#### ComposerToolbar 组件结构

```typescript
// src/components/composer/ComposerToolbar.tsx
export const ComposerToolbar = forwardRef<ComposerToolbarRef, ComposerToolbarProps>(
  function ComposerToolbar({ channel, onSend, ... }, ref) {
    // 本地状态管理
    const [value, setValue] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTemplateLocked, setIsTemplateLocked] = useState(templateLocked);

    // 全局配置
    const composerConfig = useComposerConfig();

    // 发送逻辑
    const handleSend = async () => {
      await onSend(messageToSend);
      setValue(''); // 发送成功后清空
      setIsTemplateLocked(false);
    };

    // ...
  }
);
```

#### IComposerConfig 接口

```typescript
// src/interfaces/composer.interface.ts
export interface IComposerConfig {
  // 功能启用配置
  enableAttachments: boolean;
  enableAudioInput: boolean;

  // 限制参数配置
  maxAttachments?: number;
  maxAttachmentSize?: number;
  allowedFileTypes?: string[];
  maxAudioDuration?: number;
  audioOutputFormat?: AudioOutputFormatEnum;

  // UI 显示配置
  showChannelBadge?: boolean;
  showCharCount?: boolean;
  showHint?: boolean;
  showEmojiButton?: boolean;

  // 模板配置
  templateMode?: 'direct' | 'edit';
  allowTemplateEdit?: boolean;
}
```

#### useComposerDraft Hook

```typescript
// src/hooks/use-composer-draft.hook.ts
export function useComposerDraft(
  key: string,
  value: string,
  options?: ComposerDraftOptions
): ComposerDraftReturn {
  // 返回
  return {
    loadDraft: () => string,
    clearDraft: () => void,
    saveDraft: () => void,
    hasDraft: () => boolean,
    initialValueLoaded: boolean,
  };
}
```

### 目标架构（To-Be）

## 设计方案

### 1. 接口扩展

#### 1.1 更新 IComposerConfig 接口

在 `src/interfaces/composer.interface.ts` 中添加草稿功能配置：

```typescript
export interface IComposerConfig {
  // ==================== 草稿功能配置 ====================

  /**
   * 是否启用草稿自动保存功能
   * @default true
   */
  enableDraft?: boolean;

  /**
   * 草稿防抖延迟时间（毫秒）
   * @default 500
   */
  draftDebounceDelay?: number;

  /**
   * 是否在发送成功后自动清除草稿
   * @default true
   */
  clearDraftOnSend?: boolean;

  /**
   * 是否在切换会话时保留草稿
   * @default true
   */
  keepDraftOnSwitch?: boolean;

  // ... 现有配置
}
```

#### 1.2 更新 ComposerToolbarProps 接口

在 `src/components/composer/ComposerToolbar.tsx` 中添加会话 ID 参数：

```typescript
export interface ComposerToolbarProps {
  /** 会话 ID（用于草稿存储） */
  conversationId?: string;

  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;

  /** 发送回调 */
  onSend?: (message: string) => void | Promise<void>;

  // ... 现有属性
}
```

### 2. 组件集成

#### 2.1 在 ComposerToolbar 中集成 useComposerDraft

```typescript
export const ComposerToolbar = forwardRef<
  ComposerToolbarRef,
  ComposerToolbarProps
>(function ComposerToolbar(
  {
    conversationId, // 新增：会话 ID
    channel,
    onSend,
    disabled = false,
    // ... 其他 props
  },
  ref
) {
  const { t } = useTranslation();
  const composerConfig = useComposerConfig();

  // 本地状态
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDraftHint, setShowDraftHint] = useState(false);

  // 草稿功能
  const draftEnabled = composerConfig.enableDraft ?? true;
  const draftKey = conversationId ? `conversation-${conversationId}` : '';

  const { loadDraft, clearDraft, hasDraft, initialValueLoaded } =
    useComposerDraft(
      draftKey,
      value,
      {
        debounceDelay: composerConfig.draftDebounceDelay ?? 500,
        clearOnUnmount: !composerConfig.keepDraftOnSwitch,
        onSave: (val) => {
          console.log('[ComposerToolbar] Draft saved:', val.length, 'chars');
        },
        onSaveError: (error) => {
          console.error('[ComposerToolbar] Draft save failed:', error);
        },
      }
    );

  // 初始化时加载草稿
  useEffect(() => {
    if (!draftEnabled || !draftKey || initialValueLoaded) {
      return;
    }

    const draft = loadDraft();
    if (draft) {
      setValue(draft);
      setShowDraftHint(true);
    }
  }, [draftEnabled, draftKey, loadDraft, initialValueLoaded]);

  // 发送消息
  const handleSend = useCallback(async () => {
    // ... 现有逻辑

    try {
      await onSend(messageToSend);

      // 发送成功后清空输入框
      setValue('');
      setIsTemplateLocked(false);

      // 清除草稿（如果配置了）
      if (draftEnabled && composerConfig.clearDraftOnSend !== false) {
        clearDraft();
        setShowDraftHint(false);
      }
    } catch (error) {
      console.error('[ComposerToolbar] Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [
    canSend,
    disabled,
    isSending,
    value,
    attachments,
    onSend,
    onSendAttachment,
    draftEnabled,
    composerConfig.clearDraftOnSend,
    clearDraft,
  ]);

  // 恢复草稿
  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setValue(draft);
      setShowDraftHint(false);
    }
  }, [loadDraft]);

  // 丢弃草稿
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftHint(false);
  }, [clearDraft]);

  return (
    <div className={/* ... */}>
      {/* 草稿提示 */}
      {showDraftHint && draftEnabled && (
        <div className="draft-hint-banner">
          <span>检测到未发送的草稿</span>
          <button onClick={handleRestoreDraft}>恢复</button>
          <button onClick={handleDiscardDraft}>丢弃</button>
        </div>
      )}

      {/* 附件预览 */}
      {attachments.length > 0 && (
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          disabled={disabled || isSending}
        />
      )}

      {/* 音频录音器 */}
      {isRecording && composerConfig.enableAudioInput && (
        <AudioRecorder
          onSendAudio={handleSendAudio}
          onCancel={handleCancelRecording}
          disabled={disabled || isSending}
          maxDuration={composerConfig.maxAudioDuration}
        />
      )}

      {/* 输入区域 */}
      <div className="flex items-center gap-3">
        {/* ... 现有组件 */}
      </div>
    </div>
  );
});
```

#### 2.2 更新 ComposerWithSend 组件

```typescript
export interface ComposerWithSendProps {
  /** 会话 ID */
  conversationId: string;
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;
}

export const ComposerWithSend = memo(
  forwardRef<ComposerToolbarRef, ComposerWithSendProps>(
    function ComposerWithSend({ conversationId, channel }, ref) {
      const sendMessage = useSendMessage();

      const handleSend = useCallback(
        async (content: string) => {
          try {
            await sendMessage.mutateAsync({
              conversationId,
              content,
            });
          } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
          }
        },
        [conversationId, sendMessage.mutateAsync],
      );

      return (
        <ComposerToolbar
          ref={ref}
          conversationId={conversationId} // 传递会话 ID
          channel={channel}
          onSend={handleSend}
          disabled={sendMessage.isPending}
          loading={sendMessage.isPending}
        />
      );
    },
  ),
);
```

### 3. 默认配置更新

#### 3.1 更新 DEFAULT_COMPOSER_CONFIG

在 `src/store/slices/composer.slice.ts` 中更新默认配置：

```typescript
const DEFAULT_COMPOSER_CONFIG: IComposerConfig = {
  // 功能启用配置
  enableAttachments: false,
  enableAudioInput: false,

  // 草稿功能配置（新增）
  enableDraft: true,
  draftDebounceDelay: 500,
  clearDraftOnSend: true,
  keepDraftOnSwitch: true,

  // 限制参数配置
  maxAttachments: 10,
  maxAttachmentSize: 10 * 1024 * 1024,
  allowedFileTypes: undefined,
  maxAudioDuration: 300,
  audioOutputFormat: AudioOutputFormatEnum.Raw,

  // UI 显示配置
  showChannelBadge: true,
  showCharCount: true,
  showHint: true,
  showEmojiButton: true,

  // 模板配置
  templateMode: 'edit',
  allowTemplateEdit: false,
};
```

### 4. 单元测试

#### 4.1 useComposerDraft Hook 测试

创建 `src/hooks/use-composer-draft.hook.test.ts`：

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComposerDraft } from './use-composer-draft.hook';

describe('useComposerDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应该保存草稿到 localStorage', async () => {
    const { result } = renderHook(() =>
      useComposerDraft('test-key', 'hello', {
        debounceDelay: 100,
      })
    );

    await waitFor(
      () => {
        expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe('hello');
      },
      { timeout: 500 }
    );
  });

  it('应该加载草稿', () => {
    localStorage.setItem('bifrost-chat-draft-test-key', 'saved draft');

    const { result } = renderHook(() =>
      useComposerDraft('test-key', '')
    );

    const draft = result.current.loadDraft();
    expect(draft).toBe('saved draft');
  });

  it('应该清除草稿', () => {
    localStorage.setItem('bifrost-chat-draft-test-key', 'draft');

    const { result } = renderHook(() =>
      useComposerDraft('test-key', 'draft')
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();
  });

  it('应该检测是否存在草稿', () => {
    const { result } = renderHook(() =>
      useComposerDraft('test-key', '')
    );

    expect(result.current.hasDraft()).toBe(false);

    localStorage.setItem('bifrost-chat-draft-test-key', 'draft');

    expect(result.current.hasDraft()).toBe(true);
  });

  it('应该处理 localStorage 配额超限错误', async () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const onError = jest.fn();
    renderHook(() =>
      useComposerDraft('test-key', 'x'.repeat(10000000), {
        onSaveError: onError,
      })
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    Storage.prototype.setItem = originalSetItem;
  });
});
```

#### 4.2 ComposerToolbar 组件测试

更新 `src/components/composer/ComposerToolbar.test.tsx`，添加草稿功能测试：

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposerToolbar } from './ComposerToolbar';

describe('ComposerToolbar - Draft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应该加载并显示草稿提示', async () => {
    localStorage.setItem(
      'bifrost-chat-draft-conversation-123',
      'saved draft'
    );

    const { getByText, getByPlaceholderText } = render(
      <ServiceProvider>
        <ComposerToolbar
          conversationId="123"
          onSend={jest.fn()}
        />
      </ServiceProvider>
    );

    await waitFor(() => {
      expect(getByPlaceholderText(/输入/)).toHaveValue('saved draft');
    });
  });

  it('应该在发送成功后清除草稿', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole } = render(
      <ServiceProvider>
        <ComposerToolbar
          conversationId="123"
          onSend={onSend}
        />
      </ServiceProvider>
    );

    const input = getByPlaceholderText(/输入/);
    await userEvent.type(input, 'test message');

    const sendButton = getByRole('button', { name: /发送/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(localStorage.getItem('bifrost-chat-draft-conversation-123')).toBeNull();
    });
  });
});
```

### 5. Storybook 示例

创建 `src/components/composer/ComposerToolbar.stories.tsx`：

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from './ComposerToolbar';
import { ServiceProvider } from '@/providers/service.provider';

const meta: Meta<typeof ComposerToolbar> = {
  title: 'Components/Composer/ComposerToolbar',
  component: ComposerToolbar,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ServiceProvider>
        <div style={{ width: '600px' }}>
          <Story />
        </div>
      </ServiceProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComposerToolbar>;

export const Default: Story = {
  args: {
    conversationId: 'conv-123',
    channel: 'whatsapp',
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const WithDraft: Story = {
  args: {
    conversationId: 'conv-456',
    channel: 'whatsapp',
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
  play: async ({ canvasElement }) => {
    // 模拟保存草稿
    localStorage.setItem(
      'bifrost-chat-draft-conversation-456',
      'This is a saved draft'
    );
    // 重新加载页面以触发草稿加载
    window.location.reload();
  },
};

export const DisabledDraft: Story = {
  args: {
    conversationId: 'conv-789',
    channel: 'whatsapp',
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
  decorators: [
    (Story) => (
      <ServiceProvider
        config={{
          composer: {
            enableDraft: false, // 禁用草稿
          },
        }}
      >
        <Story />
      </ServiceProvider>
    ),
  ],
};
```

### 6. 使用示例

#### 6.1 基础使用

```tsx
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';

function ConversationPanel({ conversationId }: { conversationId: string }) {
  return (
    <ComposerWithSend
      conversationId={conversationId}
      channel="whatsapp"
    />
  );
}
```

#### 6.2 自定义草稿配置

```tsx
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';
import { useChatStore } from '@/store';

function ConversationPanel({ conversationId }: { conversationId: string }) {
  const setComposerConfig = useChatStore((state) => state.actions.setComposerConfig);

  useEffect(() => {
    // 自定义草稿配置
    setComposerConfig({
      enableDraft: true,
      draftDebounceDelay: 1000, // 1秒防抖
      clearDraftOnSend: true,
      keepDraftOnSwitch: false, // 切换会话时不保留草稿
    });
  }, [setComposerConfig]);

  return (
    <ComposerWithSend
      conversationId={conversationId}
      channel="whatsapp"
    />
  );
}
```

#### 6.3 禁用草稿功能

```tsx
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';
import { useChatStore } from '@/store';

function ConversationPanel({ conversationId }: { conversationId: string }) {
  const setComposerConfig = useChatStore((state) => state.actions.setComposerConfig);

  useEffect(() => {
    setComposerConfig({
      enableDraft: false, // 禁用草稿
    });
  }, [setComposerConfig]);

  return (
    <ComposerWithSend
      conversationId={conversationId}
      channel="whatsapp"
    />
  );
}
```

## 实施步骤

### 阶段 1：接口和配置更新
1. ✅ 更新 [`IComposerConfig`](src/interfaces/composer.interface.ts:29) 接口
2. ✅ 更新 [`ComposerToolbarProps`](src/components/composer/ComposerToolbar.tsx:41) 接口
3. ✅ 更新 [`DEFAULT_COMPOSER_CONFIG`](src/store/slices/composer.slice.ts:31)

### 阶段 2：组件集成
4. ✅ 在 [`ComposerToolbar`](src/components/composer/ComposerToolbar.tsx:90) 中集成 useComposerDraft
5. ✅ 更新 [`ComposerWithSend`](src/components/composer/ComposerWithSend.tsx:35) 组件

### 阶段 3：测试
6. ✅ 编写 useComposerDraft Hook 单元测试
7. ✅ 编写 ComposerToolbar 草稿功能测试

### 阶段 4：文档和示例
8. ✅ 创建 Storybook 示例
9. ✅ 更新使用指南文档

## 注意事项

1. **向后兼容**：
   - `conversationId` 为可选参数，不传时不启用草稿
   - 默认启用草稿功能，可通过配置禁用

2. **性能优化**：
   - 使用防抖减少 localStorage 写入频率
   - 只在值变化时保存

3. **错误处理**：
   - localStorage 配额超限时优雅降级
   - SSR 环境自动禁用

4. **用户体验**：
   - 草稿提示不干扰正常输入
   - 提供恢复和丢弃选项
   - 发送成功后自动清除

## 相关文件

- [`src/hooks/use-composer-draft.hook.ts`](src/hooks/use-composer-draft.hook.ts:1) - 草稿 Hook
- [`src/components/composer/ComposerToolbar.tsx`](src/components/composer/ComposerToolbar.tsx:90) - 输入工具栏
- [`src/components/composer/ComposerWithSend.tsx`](src/components/composer/ComposerWithSend.tsx:35) - 带发送功能组件
- [`src/interfaces/composer.interface.ts`](src/interfaces/composer.interface.ts:29) - Composer 接口定义
- [`src/store/slices/composer.slice.ts`](src/store/slices/composer.slice.ts:31) - Composer 状态管理
- [`docs/use-composer-draft-usage.md`](docs/use-composer-draft-usage.md:1) - 使用指南
