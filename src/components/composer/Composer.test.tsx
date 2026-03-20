import { render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { Composer } from './Composer';

const mockUseComposerLogic = vi.fn();

vi.mock('@/hooks/use-composer-logic.hook', () => ({
  useComposerLogic: (options: unknown) => mockUseComposerLogic(options),
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: () => 'Type a message...',
  }),
}));

vi.mock('@/store', () => ({
  useComposerConfig: () => ({
    enableAttachments: false,
    enableAudioInput: false,
    showHint: false,
    showCharCount: false,
    customMessageMaxLength: undefined,
    ignoreMaxLengthForTemplateMessages: true,
  }),
}));

vi.mock('./AttachmentPreview', () => ({
  AttachmentPreview: () => null,
}));

vi.mock('./AudioRecorder', () => ({
  AudioRecorder: () => null,
}));

vi.mock('./ChannelBadgeSwitcher', () => ({
  ChannelBadgeSwitcher: () => null,
}));

vi.mock('./ComposerActions', () => ({
  ComposerActions: () => <div data-testid="composer-actions" />,
}));

vi.mock('./ComposerAttachments', () => ({
  ComposerAttachments: () => null,
}));

vi.mock('./ComposerCharCount', () => ({
  ComposerCharCount: () => null,
}));

vi.mock('./ComposerHint', () => ({
  ComposerHint: () => null,
}));

vi.mock('./ComposerInput', () => ({
  ComposerInput: forwardRef<
    { focus: () => void },
    {
      value: string;
      readOnly?: boolean;
      onChange?: (value: string) => void;
    }
  >(({ value, readOnly, onChange }, ref) => {
    useImperativeHandle(ref, () => ({
      focus: vi.fn(),
    }));

    return (
      <textarea
        data-testid="composer-input"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }),
}));

vi.mock('./ComposerVoice', () => ({
  ComposerVoice: () => null,
}));

function createComposerLogic(overrides?: Record<string, unknown>) {
  return {
    value: '',
    attachments: [],
    isRecording: false,
    isSending: false,
    isTemplateLocked: false,
    isRestoring: false,
    sendError: null,
    canSend: false,
    setValue: vi.fn(),
    handleSend: vi.fn(),
    handleClear: vi.fn(),
    handleAttachmentSelect: vi.fn(),
    handleRemoveAttachment: vi.fn(),
    handleAudioInput: vi.fn(),
    handleSendAudio: vi.fn(),
    handleCancelRecording: vi.fn(),
    setTemplate: vi.fn(),
    inputRef: { current: null },
    focus: vi.fn(),
    config: {},
    effectiveMaxLength: 2000,
    placeholder: 'Type a message...',
    messageType: undefined,
    templateCode: undefined,
    ...overrides,
  };
}

describe('Composer', () => {
  beforeEach(() => {
    mockUseComposerLogic.mockReturnValue(createComposerLogic());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render send error from useComposerLogic', () => {
    mockUseComposerLogic.mockReturnValue(
      createComposerLogic({
        sendError: '发送失败',
      }),
    );

    render(
      <Composer channel={ChannelTypeEnum.Email} conversationId="conv-1" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('发送失败');
  });

  it('should not register messageSendFailed listener on window', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<Composer channel={ChannelTypeEnum.SMS} conversationId="conv-1" />);

    expect(
      addEventListenerSpy.mock.calls.some(
        ([eventName]) => eventName === 'messageSendFailed',
      ),
    ).toBe(false);
  });
});
