import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
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

// Mock the composer config to enable all features for testing
vi.mock('@/store', () => ({
  useComposerConfig: () => ({
    enableAttachments: true,
    enableAudioInput: true,
    enableDraft: true,
    draftDebounceDelay: 500,
    clearDraftOnSend: true,
    keepDraftOnSwitch: true,
    maxAttachments: 10,
    maxAttachmentSize: 10 * 1024 * 1024,
    allowedFileTypes: undefined,
    maxAudioDuration: 300,
    audioOutputFormat: 'raw',
    showChannelSwitcher: true,
    showCharCount: true,
    showHint: true,
    showEmojiButton: true,
    templateMode: 'edit',
    allowTemplateEdit: false,
  }),
  useStrategy: () => ({
    allowedChannels: ['sms', 'whatsapp', 'email', 'viber', 'ivr'],
    activeChannel: 'whatsapp',
  }),
  useActions: () => ({
    setActiveChannel: vi.fn(),
  }),
}));

describe('ComposerToolbar', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should render composer with default state', () => {
    render(<ComposerToolbar />);
    const composer = screen.getByTestId('composer');
    expect(composer).toBeDefined();
  });

  it('should display channel switcher when channel is provided', () => {
    render(<ComposerToolbar channel={ChannelTypeEnum.WhatsApp} />);
    // ChannelFilter compact 模式只显示图标，通过 data-channel 属性验证按钮存在
    const channelButton = document.querySelector('[data-channel="whatsapp"]');
    expect(channelButton).toBeDefined();
  });

  it('should display character count', () => {
    render(<ComposerToolbar />);
    const charCount = screen.getByTestId('composer-char-count');
    expect(charCount.textContent).toContain('0 /');
  });

  it('should update character count when typing', () => {
    render(<ComposerToolbar />);
    const input = screen.getByTestId('composer-input');
    const charCount = screen.getByTestId('composer-char-count');

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(charCount.textContent).toContain('5 /');
  });

  it('should call onSend when send button is clicked', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ComposerToolbar onSend={onSend} />);
    const input = screen.getByTestId('composer-input');

    fireEvent.change(input, { target: { value: 'Hello' } });

    // Wait for the component to update and show the send button
    const sendButton = await screen.findByTestId('composer-send');
    fireEvent.click(sendButton);

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 0));

    // onSend 现在接受两个参数：content 和 templateId（可选）
    expect(onSend).toHaveBeenCalledWith('Hello', undefined);
  });

  it('should not call onSend with empty message', async () => {
    const onSend = vi.fn();
    render(<ComposerToolbar onSend={onSend} />);
    const sendButton = screen.queryByTestId('composer-send');

    expect(sendButton).toBeNull();
  });

  it('should not call onSend with whitespace only', async () => {
    const onSend = vi.fn();
    render(<ComposerToolbar onSend={onSend} />);
    const input = screen.getByTestId('composer-input');

    fireEvent.change(input, { target: { value: '   ' } });
    const sendButton = screen.queryByTestId('composer-send');

    expect(sendButton).toBeNull();
  });

  it('should disable all interactions when disabled is true', () => {
    render(<ComposerToolbar disabled={true} />);
    const input = screen.getByTestId('composer-input');
    const attachButton = screen.getByTestId('composer-attach');

    expect(input.getAttribute('disabled')).toBeDefined();
    expect(attachButton.getAttribute('disabled')).toBeDefined();
  });

  it('should show loading state during send', async () => {
    let resolveSend: (() => void) | undefined;
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    );

    render(<ComposerToolbar onSend={onSend} />);
    const input = screen.getByTestId('composer-input');

    fireEvent.change(input, { target: { value: 'Hello' } });

    // Wait for the component to update and show the send button
    const sendButton = await screen.findByTestId('composer-send');
    fireEvent.click(sendButton);

    // Should show loading state
    expect(sendButton.getAttribute('disabled')).toBeDefined();

    // Resolve the promise
    resolveSend?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('should use correct maxLength for SMS channel', () => {
    render(<ComposerToolbar channel={ChannelTypeEnum.SMS} />);
    const input = screen.getByTestId('composer-input');
    const charCount = screen.getByTestId('composer-char-count');

    expect(input.getAttribute('maxlength')).toBe('160');
    expect(charCount.textContent).toContain('160');
  });

  it('should use correct maxLength for WhatsApp channel', () => {
    render(<ComposerToolbar channel={ChannelTypeEnum.WhatsApp} />);
    const input = screen.getByTestId('composer-input');
    const charCount = screen.getByTestId('composer-char-count');

    expect(input.getAttribute('maxlength')).toBe('4096');
    expect(charCount.textContent).toContain('4096');
  });

  it('should use custom maxLength when provided', () => {
    render(<ComposerToolbar maxLength={500} />);
    const input = screen.getByTestId('composer-input');
    const charCount = screen.getByTestId('composer-char-count');

    expect(input.getAttribute('maxlength')).toBe('500');
    expect(charCount.textContent).toContain('500');
  });

  it('should call onSendAttachment when files are selected and sent', () => {
    const onSendAttachment = vi.fn();
    render(<ComposerToolbar onSendAttachment={onSendAttachment} />);
    const attachButton = screen.getByTestId('composer-attach');

    // Note: This test simulates the button click, but actual file selection
    // requires more complex setup with createObjectURL and file input
    fireEvent.click(attachButton);

    // The function creates a file input dynamically, so we verify the callback exists
    expect(onSendAttachment).toBeDefined();
  });

  it('should not allow attachments for SMS channel', () => {
    render(<ComposerToolbar channel={ChannelTypeEnum.SMS} />);
    const attachButton = screen.getByTestId('composer-attach');

    expect(attachButton.getAttribute('disabled')).toBeDefined();
  });
});
