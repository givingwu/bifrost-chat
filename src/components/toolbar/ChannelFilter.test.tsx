import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ChannelFilter } from './ChannelFilter';

describe('ChannelFilter', () => {
  const mockOnChannelClick = vi.fn();

  const defaultProps = {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: mockOnChannelClick,
    compact: true,
    showTooltip: true,
  };

  it('应该渲染渠道切换器', () => {
    render(<ChannelFilter {...defaultProps} />);

    // 检查容器
    const container = screen.getByRole('group');
    expect(container).toBeInTheDocument();
  });

  it('应该渲染所有渠道按钮', () => {
    render(<ChannelFilter {...defaultProps} />);

    // 检查所有渠道按钮
    expect(screen.getByLabelText('SMS')).toBeInTheDocument();
    expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('应该正确标记激活的渠道', () => {
    render(<ChannelFilter {...defaultProps} />);

    const smsButton = screen.getByLabelText('SMS');
    const whatsAppButton = screen.getByLabelText('WhatsApp');
    const emailButton = screen.getByLabelText('Email');

    expect(smsButton).toHaveAttribute('aria-pressed', 'false');
    expect(whatsAppButton).toHaveAttribute('aria-pressed', 'true');
    expect(emailButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('应该在点击时调用 onChannelClick', () => {
    render(<ChannelFilter {...defaultProps} />);

    const smsButton = screen.getByLabelText('SMS');
    smsButton.click();

    expect(mockOnChannelClick).toHaveBeenCalledWith(ChannelTypeEnum.SMS);
  });

  it('应该在紧凑模式下仅显示图标', () => {
    render(
      <ChannelFilter {...defaultProps} compact={true} showTooltip={false} />,
    );

    // 检查按钮是否不包含文字（tooltip 会影响 textContent，所以禁用它）
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.textContent?.trim()).toBe('');
    });
  });

  it('应该在非紧凑模式下显示文字', () => {
    render(<ChannelFilter {...defaultProps} compact={false} />);

    const smsButton = screen.getByLabelText('SMS');
    expect(smsButton.textContent).toContain('SMS');
  });

  it('应该在 showTooltip 为 false 时不渲染工具提示', () => {
    render(<ChannelFilter {...defaultProps} showTooltip={false} />);

    // 检查是否有工具提示
    const tooltips = screen.queryAllByRole('tooltip');
    expect(tooltips.length).toBe(0);
  });

  it('应该在单渠道时不显示指示器', () => {
    render(
      <ChannelFilter
        channels={[ChannelTypeEnum.SMS]}
        activeChannel={ChannelTypeEnum.SMS}
        onChannelClick={mockOnChannelClick}
        compact={true}
        showTooltip={false}
      />,
    );

    // 单渠道时不应该有滑动指示器
    const indicators = screen.queryAllByRole('presentation');
    const slidingIndicators = indicators.filter((el) =>
      el.classList.contains('bg-white'),
    );
    expect(slidingIndicators.length).toBe(0);
  });

  it('应该在无激活渠道时不显示指示器', () => {
    render(<ChannelFilter {...defaultProps} activeChannel={undefined} />);

    // 无激活渠道时不应该有滑动指示器
    const indicators = screen.queryAllByRole('presentation');
    const slidingIndicators = indicators.filter((el) =>
      el.classList.contains('bg-white'),
    );
    expect(slidingIndicators.length).toBe(0);
  });
});
