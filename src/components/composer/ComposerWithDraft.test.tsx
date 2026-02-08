import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { ComposerToolbarRef } from './ComposerToolbar';
import { ComposerWithDraft } from './ComposerWithDraft';

// Mock the translation provider
vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    showChannelBadge: true,
    showHint: false,
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
      render(
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
          expect(savedDraft).toBe('Hello, this is a draft message');
        },
        { timeout: 1000 },
      );
    });

    it('应该在多次输入后更新草稿', async () => {
      render(
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
          expect(localStorage.getItem(draftKey)).toBe('First message');
        },
        { timeout: 1000 },
      );

      // 第二次输入
      fireEvent.change(input, { target: { value: 'Second message' } });

      await waitFor(
        () => {
          expect(localStorage.getItem(draftKey)).toBe('Second message');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('2. 草稿自动加载功能', () => {
    it('应该在组件挂载时自动加载已保存的草稿', async () => {
      // 预先保存草稿
      localStorage.setItem(draftKey, 'Saved draft message');

      render(
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
      render(
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
      const { unmount } = render(
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
          expect(localStorage.getItem(draftKey)).toBe('Draft to persist');
        },
        { timeout: 1000 },
      );

      // 卸载组件
      unmount();

      // 验证草稿仍然存在
      expect(localStorage.getItem(draftKey)).toBe('Draft to persist');
    });

    it('应该在重新挂载时加载之前保存的草稿', async () => {
      // 第一次挂载
      const { unmount: unmount1 } = render(
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
          expect(localStorage.getItem(draftKey)).toBe('Persistent draft');
        },
        { timeout: 1000 },
      );

      // 卸载组件
      unmount1();

      // 第二次挂载
      render(
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

      render(
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
          expect(localStorage.getItem(draftKey)).toBe('Message to send');
        },
        { timeout: 1000 },
      );

      // 点击发送按钮
      const sendButton = await screen.findByTestId('composer-send');
      fireEvent.click(sendButton);

      // 等待发送完成
      await waitFor(
        () => {
          expect(onSend).toHaveBeenCalledWith('Message to send');
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
      const { unmount: unmount1 } = render(
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
          expect(
            localStorage.getItem('bifrost-chat-draft-conversation-conv-1'),
          ).toBe('Draft for conversation 1');
        },
        { timeout: 1000 },
      );

      unmount1();

      // 第二个会话
      const { unmount: unmount2 } = render(
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
          expect(
            localStorage.getItem('bifrost-chat-draft-conversation-conv-2'),
          ).toBe('Draft for conversation 2');
        },
        { timeout: 1000 },
      );

      unmount2();

      // 验证两个草稿都存在且独立
      expect(
        localStorage.getItem('bifrost-chat-draft-conversation-conv-1'),
      ).toBe('Draft for conversation 1');
      expect(
        localStorage.getItem('bifrost-chat-draft-conversation-conv-2'),
      ).toBe('Draft for conversation 2');
    });
  });

  describe('6. 模板锁定功能', () => {
    it('应该在 templateLocked=true 时禁用输入框', async () => {
      render(
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
      render(
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

    it('应该在 templateLocked=true 时显示清除按钮', async () => {
      render(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      // 验证清除按钮显示
      const clearButton = screen.queryByTestId('composer-clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('应该在模板锁定时不加载草稿', async () => {
      // 预先保存草稿
      localStorage.setItem(draftKey, 'Saved draft message');

      render(
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
      const ref: React.RefObject<ComposerToolbarRef | null> = { current: null };

      render(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
          ref={(r) => {
            if (r) ref.current = r;
          }}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 尝试通过 ref 设置值
      if (ref.current) {
        ref.current.setValue('New value');
      }

      // 验证值没有被设置（输入框应该仍然为空）
      expect(input).toHaveValue('');
    });

    it('应该在 templateLocked 从 true 变为 false 时恢复输入功能', async () => {
      const { rerender } = render(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');

      // 初始状态：输入框被禁用
      expect(input).toBeDisabled();

      // 重新渲染，解除锁定
      rerender(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={false}
        />,
      );

      // 验证输入框恢复可用
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });

    it('应该在模板锁定时仍然允许通过清除按钮解锁', async () => {
      render(
        <ComposerWithDraft
          conversationId={conversationId}
          channel={ChannelTypeEnum.WhatsApp}
          templateLocked={true}
        />,
      );

      const input = screen.getByTestId('composer-input');
      const clearButton = screen.queryByTestId('composer-clear');

      // 初始状态：输入框被禁用
      expect(input).toBeDisabled();

      // 点击清除按钮
      if (clearButton) {
        fireEvent.click(clearButton);

        // 验证输入框恢复可用
        await waitFor(() => {
          expect(input).not.toBeDisabled();
        });
      }
    });
  });
});
