import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiPicker } from './EmojiPicker';

describe('EmojiPicker', () => {
  it('默认使用 8 列网格布局', () => {
    render(<EmojiPicker open={true} onEmojiSelect={vi.fn()} />);

    const listbox = screen.getByRole('listbox', { name: '表情列表' });
    expect(listbox).toHaveStyle({
      gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
    });
  });

  it('鼠标点击表情会触发选择和关闭', () => {
    const onEmojiSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <EmojiPicker
        open={true}
        emojis={['😀', '😁']}
        onEmojiSelect={onEmojiSelect}
        onClose={onClose}
      />,
    );

    const emojiButton = screen.getByRole('option', { name: '插入表情 😀' });
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });

    const dispatchResult = emojiButton.dispatchEvent(mouseDownEvent);
    expect(dispatchResult).toBe(false);

    fireEvent.click(emojiButton);

    expect(onEmojiSelect).toHaveBeenCalledWith('😀');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
