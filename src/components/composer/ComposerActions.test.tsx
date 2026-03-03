import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioOutputFormatEnum } from '@/interfaces/audio.interface';
import { useChatStore } from '@/store';
import { ComposerActions } from './ComposerActions';

// Mock composer config
const mockComposerConfig = {
  enableAudioInput: true,
  enableAttachments: false,
  enableDraft: true,
  draftDebounceDelay: 500,
  clearDraftOnSend: true,
  keepDraftOnSwitch: true,
  maxAttachments: 10,
  maxAttachmentSize: 10 * 1024 * 1024,
  allowedFileTypes: undefined,
  maxAudioDuration: 300,
  audioOutputFormat: AudioOutputFormatEnum.Raw,
  showChannelSwitcher: false,
  showCharCount: false,
  showHint: false,
  showEmojiButton: true,
  templateMode: 'edit' as const,
  allowTemplateEdit: false,
};

describe('ComposerActions', () => {
  beforeEach(() => {
    cleanup();
    // Reset store to default
    useChatStore.setState({
      composer: mockComposerConfig,
    });
  });

  describe('发送按钮', () => {
    it('当 canSend 为 true 时应显示发送按钮', () => {
      render(<ComposerActions canSend={true} onSend={vi.fn()} />);
      const sendButton = screen.getByTestId('composer-send');
      expect(sendButton).toBeDefined();
      expect(sendButton.getAttribute('aria-label')).toBe('Send message');
    });

    it('当 canSend 为 false 时不应显示发送按钮', () => {
      render(<ComposerActions canSend={false} />);
      const sendButton = screen.queryByTestId('composer-send');
      expect(sendButton).toBeNull();
    });

    it('点击发送按钮应触发 onSend 回调', () => {
      const onSend = vi.fn();
      render(<ComposerActions canSend={true} onSend={onSend} />);
      const sendButton = screen.getByTestId('composer-send');
      fireEvent.click(sendButton);
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('当 loading 为 true 时应显示加载状态', () => {
      render(
        <ComposerActions canSend={true} onSend={vi.fn()} loading={true} />,
      );
      const sendButton = screen.getByTestId('composer-send');
      expect(sendButton.getAttribute('disabled')).toBeDefined();
    });

    it('当 disabled 为 true 时应禁用发送按钮', () => {
      render(
        <ComposerActions canSend={true} onSend={vi.fn()} disabled={true} />,
      );
      const sendButton = screen.getByTestId('composer-send');
      expect(sendButton.getAttribute('disabled')).toBeDefined();
    });
  });

  describe('清空按钮', () => {
    it('当 canSend 为 true 且 showClear 为 true 且 onClear 存在时应显示清空按钮', () => {
      render(
        <ComposerActions canSend={true} showClear={true} onClear={vi.fn()} />,
      );
      const clearButton = screen.getByTestId('composer-clear');
      expect(clearButton).toBeDefined();
      expect(clearButton.getAttribute('aria-label')).toBe('Clear input');
    });

    it('当 canSend 为 true 且 showClear 为 true 时应同时显示清空和发送按钮', () => {
      render(
        <ComposerActions
          canSend={true}
          showClear={true}
          onSend={vi.fn()}
          onClear={vi.fn()}
        />,
      );
      const clearButton = screen.getByTestId('composer-clear');
      const sendButton = screen.getByTestId('composer-send');
      expect(clearButton).toBeDefined();
      expect(sendButton).toBeDefined();
    });

    it('当 canSend 为 false 且 showClear 为 true 时不应显示清空按钮', () => {
      render(
        <ComposerActions canSend={false} showClear={true} onClear={vi.fn()} />,
      );
      const clearButton = screen.queryByTestId('composer-clear');
      expect(clearButton).toBeNull();
    });

    it('点击清空按钮应触发 onClear 回调', () => {
      const onClear = vi.fn();
      render(
        <ComposerActions canSend={true} showClear={true} onClear={onClear} />,
      );
      const clearButton = screen.getByTestId('composer-clear');
      fireEvent.click(clearButton);
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('当 disabled 为 true 时应禁用清空按钮', () => {
      render(
        <ComposerActions
          canSend={true}
          showClear={true}
          onClear={vi.fn()}
          disabled={true}
        />,
      );
      const clearButton = screen.getByTestId('composer-clear');
      expect(clearButton.getAttribute('disabled')).toBeDefined();
    });
  });

  describe('渲染逻辑', () => {
    it('当 canSend 为 true 且 showClear 为 false 时应只显示发送按钮', () => {
      render(<ComposerActions canSend={true} onSend={vi.fn()} />);
      const sendButton = screen.getByTestId('composer-send');
      const clearButton = screen.queryByTestId('composer-clear');
      expect(sendButton).toBeDefined();
      expect(clearButton).toBeNull();
    });

    it('当 canSend 为 false 且 showClear 为 false 时不应显示任何按钮', () => {
      const { container } = render(<ComposerActions canSend={false} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
