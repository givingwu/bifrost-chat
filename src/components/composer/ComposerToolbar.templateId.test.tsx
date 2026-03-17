import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ComposerToolbarRef } from './ComposerToolbar';
import { ComposerToolbar } from './ComposerToolbar';

// Mock the translation provider
vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'composer.placeholder.channel') {
        return `Message via ${params?.channel}`;
      }
      return 'Type a message...';
    },
  }),
}));

// Mock the composer config store
vi.mock('@/store', () => ({
  useComposerConfig: () => ({
    enableAttachments: false,
    enableAudioInput: false,
    showEmojiButton: false,
    showCharCount: false,
    showHint: false,
    customMessageMaxLength: undefined,
    ignoreMaxLengthForTemplateMessages: true,
    templateMode: 'edit',
    allowTemplateEdit: false,
  }),
}));

describe('ComposerToolbar - Template ID 功能验证', () => {
  it('应该通过 setValue 传递 templateId', async () => {
    const ref = createRef<ComposerToolbarRef>();
    const onSend = vi.fn().mockResolvedValue(undefined);

    render(<ComposerToolbar ref={ref} onSend={onSend} />);

    // 获取 ref 并设置值和 templateId
    if (ref.current) {
      ref.current.setValue('Hello from template', 'template-123');
    }

    // 等待 DOM 更新
    await waitFor(() => {
      const input = screen.getByTestId('composer-input');
      expect(input).toHaveValue('Hello from template');
    });
  });

  it('应该在发送时携带 templateId', async () => {
    const ref = createRef<ComposerToolbarRef>();
    const onSend = vi.fn().mockResolvedValue(undefined);

    render(<ComposerToolbar ref={ref} onSend={onSend} />);

    // 设置值和 templateId
    if (ref.current) {
      ref.current.setValue('Hello from template', 'template-123');
    }

    // 点击发送按钮
    const sendButton = await screen.findByTestId('composer-send');
    sendButton.click();

    // 等待异步操作
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 验证 onSend 被调用时携带了 templateId
    expect(onSend).toHaveBeenCalledWith('Hello from template', 'template-123');
  });

  it('应该支持通过 setTemplateId 单独设置 templateId', async () => {
    const ref = createRef<ComposerToolbarRef>();
    const onSend = vi.fn().mockResolvedValue(undefined);

    render(<ComposerToolbar ref={ref} onSend={onSend} />);

    // 先设置值
    if (ref.current) {
      ref.current.setValue('Hello');
    }

    // 等待 DOM 更新
    await waitFor(() => {
      const input = screen.getByTestId('composer-input');
      expect(input).toHaveValue('Hello');
    });

    // 然后单独设置 templateId
    if (ref.current) {
      ref.current.setTemplateId('template-456');
    }

    // 验证输入框的值仍然存在
    const input = screen.getByTestId('composer-input');
    expect(input).toHaveValue('Hello');
  });
});
