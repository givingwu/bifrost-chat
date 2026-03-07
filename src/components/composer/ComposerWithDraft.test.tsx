import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftData } from '@/hooks/use-composer-draft.hook';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { ComposerToolbarRef } from './ComposerToolbar';
import { ComposerWithDraft } from './ComposerWithDraft';

// Mock the translation provider
vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the service provider (for useTemplateRender hook)
vi.mock('@/providers/service.provider', () => ({
  useServices: () => ({
    templateService: {
      render: vi.fn().mockResolvedValue({
        previewContent: 'Rendered template content',
        content: 'Template content',
        params: {},
      }),
    },
  }),
}));

// Mock the store
vi.mock('@/store', () => ({
  useComposerConfig: () => ({
    enableDraft: true,
    draftDebounceDelay: 500,
    clearDraftOnSend: true,
    keepDraftOnSwitch: false,
    enableAttachments: true,
    enableAudioInput: false,
    showEmojiButton: true,
    showCharCount: true,
    showChannelSwitcher: true,
    showHint: false,
  }),
  useStrategy: () => ({
    allowedChannels: ['sms', 'whatsapp', 'email', 'waba', 'viber', 'ivr'],
    activeChannel: 'whatsapp',
  }),
  useActions: () => ({
    setActiveChannel: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Custom render function with QueryClient wrapper
const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(ui, { wrapper: createWrapper() });
};

describe('ComposerWithDraft - Draft 功能验证', () => {
  const conversationId = 'test-conversation-123';
  const draftKey = `bifrost-chat-draft-conversation-${conversationId}`;

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. 草稿自动保存功能', () => {
    it('应该在输入时自动保存草稿到 localStorage', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 模拟用户输入
      fireEvent.change(input, {
        target: { value: 'Hello, this is a draft message' },
      });

      // 等待防抖时间（500ms）
      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Hello, this is a draft message');
        },
        { timeout: 1000 },
      );
    });

    it('应该在多次输入后更新草稿', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 第一次输入
      fireEvent.change(input, { target: { value: 'First message' } });

      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('First message');
        },
        { timeout: 1000 },
      );

      // 第二次输入
      fireEvent.change(input, { target: { value: 'Second message' } });

      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Second message');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('2. 草稿自动加载功能', () => {
    it('应该在组件挂载时自动加载已保存的草稿', async () => {
      // 预先保存草稿（新格式）
      const draftData: DraftData = { content: 'Saved draft message' };
      localStorage.setItem(draftKey, JSON.stringify(draftData));

      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 等待草稿加载
      await waitFor(
        () => {
          expect(input).toHaveValue('Saved draft message');
        },
        { timeout: 1000 },
      );
    });

    it('应该在没有草稿时不加载任何内容', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input = screen.getByTestId('composer-input');

      await waitFor(
        () => {
          expect(input).toHaveValue('');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('3. 组件卸载后草稿保留', () => {
    it('应该在组件卸载后保留草稿', async () => {
      const { unmount } = renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 输入内容
      fireEvent.change(input, { target: { value: 'Draft to persist' } });

      // 等待草稿保存
      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Draft to persist');
        },
        { timeout: 1000 },
      );

      // 卸载组件
      unmount();

      // 验证草稿仍然存在
      const savedDraft = localStorage.getItem(draftKey);
      expect(savedDraft).not.toBeNull();
      const parsed = JSON.parse(savedDraft!) as DraftData;
      expect(parsed.content).toBe('Draft to persist');
    });

    it('应该在重新挂载时加载之前保存的草稿', async () => {
      // 第一次挂载
      const { unmount: unmount1 } = renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input1 = screen.getByTestId('composer-input');

      // 输入内容
      fireEvent.change(input1, { target: { value: 'Persistent draft' } });

      // 等待草稿保存
      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Persistent draft');
        },
        { timeout: 1000 },
      );

      // 卸载组件
      unmount1();

      // 第二次挂载
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input2 = screen.getByTestId('composer-input');

      // 验证草稿已加载
      await waitFor(
        () => {
          expect(input2).toHaveValue('Persistent draft');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('4. 发送成功后草稿清除', () => {
    it('应该在发送成功后清除草稿', async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);

      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          onSend={onSend}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 输入内容
      fireEvent.change(input, { target: { value: 'Message to send' } });

      // 等待草稿保存
      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(draftKey);
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Message to send');
        },
        { timeout: 1000 },
      );

      // 点击发送按钮
      const sendButton = await screen.findByTestId('composer-send');
      fireEvent.click(sendButton);

      // 等待发送完成
      await waitFor(
        () => {
          expect(onSend).toHaveBeenCalledWith('Message to send', undefined);
        },
        { timeout: 1000 },
      );

      // 验证草稿已清除
      await waitFor(
        () => {
          expect(localStorage.getItem(draftKey)).toBeNull();
        },
        { timeout: 1000 },
      );

      // 验证输入框已清空
      expect(input).toHaveValue('');
    });
  });

  describe('5. 不同会话的草稿隔离', () => {
    it('应该为不同会话保存独立的草稿', async () => {
      const conversationId1 = 'conv-1';
      const conversationId2 = 'conv-2';

      // 第一个会话
      const { unmount: unmount1 } = renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId1}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input1 = screen.getByTestId('composer-input');

      fireEvent.change(input1, {
        target: { value: 'Draft for conversation 1' },
      });

      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(
            'bifrost-chat-draft-conversation-conv-1',
          );
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Draft for conversation 1');
        },
        { timeout: 1000 },
      );

      unmount1();

      // 第二个会话
      const { unmount: unmount2 } = renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId2}
          channel={ChannelTypeEnum.WhatsApp}
        />,
      );

      const input2 = screen.getByTestId('composer-input');

      fireEvent.change(input2, {
        target: { value: 'Draft for conversation 2' },
      });

      await waitFor(
        () => {
          const savedDraft = localStorage.getItem(
            'bifrost-chat-draft-conversation-conv-2',
          );
          expect(savedDraft).not.toBeNull();
          const parsed = JSON.parse(savedDraft!) as DraftData;
          expect(parsed.content).toBe('Draft for conversation 2');
        },
        { timeout: 1000 },
      );

      unmount2();

      // 验证两个草稿都存在且独立
      const draft1 = localStorage.getItem(
        'bifrost-chat-draft-conversation-conv-1',
      );
      const draft2 = localStorage.getItem(
        'bifrost-chat-draft-conversation-conv-2',
      );
      expect(draft1).not.toBeNull();
      expect(draft2).not.toBeNull();
      expect((JSON.parse(draft1!) as DraftData).content).toBe(
        'Draft for conversation 1',
      );
      expect((JSON.parse(draft2!) as DraftData).content).toBe(
        'Draft for conversation 2',
      );
    });
  });

  describe('6. 模板锁定功能', () => {
    it('应该在 templateLocked=true 时禁用输入框', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 验证输入框被禁用
      expect(input).toBeDisabled();
    });

    it('应该在 templateLocked=true 时禁用附件按钮', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      // 验证附件按钮被禁用
      const attachmentButton = screen.queryByTestId('composer-attachments');
      if (attachmentButton) {
        expect(attachmentButton).toBeDisabled();
      }
    });

    it('应该在 templateLocked=true 时禁用输入框', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      // 验证输入框被禁用
      const input = screen.getByTestId('composer-input');
      expect(input).toBeDisabled();
    });

    it('应该在模板锁定时不加载草稿', async () => {
      // 预先保存草稿（新格式）
      const draftData: DraftData = { content: 'Saved draft message' };
      localStorage.setItem(draftKey, JSON.stringify(draftData));

      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 验证草稿未被加载（输入框应该为空）
      await waitFor(
        () => {
          expect(input).toHaveValue('');
        },
        { timeout: 1000 },
      );
    });

    it('应该在模板锁定时拒绝 setValue 调用', async () => {
      const ref = { current: null as ComposerToolbarRef | null };

      renderWithQueryClient(
        <ComposerWithDraft
          ref={ref}
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      // 尝试通过 ref 设置值
      ref.current?.setValue('This should not be set');

      const input = screen.getByTestId('composer-input');

      // 验证输入框仍然为空
      expect(input).toHaveValue('');
    });

    it('应该在 templateLocked 从 true 变为 false 时恢复输入功能', async () => {
      const { rerender } = renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 验证输入框被禁用
      expect(input).toBeDisabled();

      // 重新渲染，解除锁定
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ComposerWithDraft
            conversationId={conversationId}
            channel={ChannelTypeEnum.WhatsApp}
            templateLocked={false}
          />
        </QueryClientProvider>,
      );

      // 验证输入框已启用
      await waitFor(
        () => {
          const inputAfter = screen.getByTestId('composer-input');
          expect(inputAfter).not.toBeDisabled();
        },
        { timeout: 1000 },
      );
    });

    it('应该在模板锁定时仍然允许通过清除按钮解锁', async () => {
      renderWithQueryClient(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 验证输入框被禁用
      expect(input).toBeDisabled();

      // 查找清除按钮
      const clearButton = screen.queryByTestId('composer-clear');

      // 如果存在清除按钮，点击它
      if (clearButton) {
        fireEvent.click(clearButton);

        // 验证输入框已启用
        await waitFor(
          () => {
            expect(input).not.toBeDisabled();
          },
          { timeout: 1000 },
        );
      }
    });
  });
});
