import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComposerActions } from './ComposerActions';

describe('ComposerActions', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should render send button when canSend is true', () => {
    render(<ComposerActions canSend={true} onSend={vi.fn()} />);
    const sendButton = screen.getByTestId('composer-send');
    expect(sendButton).toBeDefined();
    expect(sendButton.getAttribute('aria-label')).toBe('Send message');
  });

  it('should render voice button when canSend is false', () => {
    render(<ComposerActions canSend={false} />);
    const voiceButton = screen.getByTestId('composer-voice');
    expect(voiceButton).toBeDefined();
    expect(voiceButton.getAttribute('aria-label')).toBe('Voice input');
  });

  it('should call onSend when send button is clicked', () => {
    const onSend = vi.fn();
    render(<ComposerActions canSend={true} onSend={onSend} />);
    const sendButton = screen.getByTestId('composer-send');
    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when loading is true', () => {
    render(<ComposerActions canSend={true} onSend={vi.fn()} loading={true} />);
    const sendButton = screen.getByTestId('composer-send');
    expect(sendButton.getAttribute('disabled')).toBeDefined();
  });

  it('should be disabled when disabled is true', () => {
    render(<ComposerActions canSend={true} onSend={vi.fn()} disabled={true} />);
    const sendButton = screen.getByTestId('composer-send');
    expect(sendButton.getAttribute('disabled')).toBeDefined();
  });

  it('should not render voice button when canSend is true', () => {
    render(<ComposerActions canSend={true} onSend={vi.fn()} />);
    const voiceButton = screen.queryByTestId('composer-voice');
    expect(voiceButton).toBeNull();
  });

  it('should not render send button when canSend is false', () => {
    render(<ComposerActions canSend={false} />);
    const sendButton = screen.queryByTestId('composer-send');
    expect(sendButton).toBeNull();
  });
});
