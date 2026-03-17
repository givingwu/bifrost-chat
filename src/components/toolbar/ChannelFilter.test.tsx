import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import enUS from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import { ChannelFilter } from './ChannelFilter';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale={LanguageCodeEnum.EnUS} messages={enUS}>
      {children}
    </I18nProvider>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

// 使用 data-channel 属性查找按钮，避免依赖 i18n 翻译结果
function getChannelButton(channel: ChannelTypeEnum) {
  return document.querySelector(`[data-channel="${channel}"]`) as HTMLElement;
}

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
    renderWithProviders(<ChannelFilter {...defaultProps} />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('应该渲染所有渠道按钮', () => {
    renderWithProviders(<ChannelFilter {...defaultProps} />);
    expect(getChannelButton(ChannelTypeEnum.SMS)).toBeInTheDocument();
    expect(getChannelButton(ChannelTypeEnum.WhatsApp)).toBeInTheDocument();
    expect(getChannelButton(ChannelTypeEnum.Email)).toBeInTheDocument();
  });

  it('应该正确标记激活的渠道', () => {
    renderWithProviders(<ChannelFilter {...defaultProps} />);
    expect(getChannelButton(ChannelTypeEnum.SMS)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(getChannelButton(ChannelTypeEnum.WhatsApp)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(getChannelButton(ChannelTypeEnum.Email)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('应该在点击时调用 onChannelClick', () => {
    renderWithProviders(<ChannelFilter {...defaultProps} />);
    getChannelButton(ChannelTypeEnum.SMS).click();
    expect(mockOnChannelClick).toHaveBeenCalledWith(ChannelTypeEnum.SMS);
  });

  it('应该在禁用渠道时显示提示且不触发切换', () => {
    renderWithProviders(
      <ChannelFilter
        {...defaultProps}
        channelStates={{
          [ChannelTypeEnum.Email]: {
            disabled: true,
            tooltip: '当前会话暂不支持 Email',
          },
        }}
      />,
    );

    const emailButton = getChannelButton(ChannelTypeEnum.Email);

    fireEvent.click(emailButton);

    expect(emailButton).toHaveAttribute('aria-disabled', 'true');
    expect(emailButton).toHaveAttribute('title', '当前会话暂不支持 Email');
    expect(mockOnChannelClick).not.toHaveBeenCalledWith(ChannelTypeEnum.Email);
  });

  it('应该在紧凑模式下仅显示图标', () => {
    renderWithProviders(
      <ChannelFilter {...defaultProps} compact={true} showTooltip={false} />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.textContent?.trim()).toBe('');
    });
  });

  it('应该在非紧凑模式下显示文字', () => {
    renderWithProviders(<ChannelFilter {...defaultProps} compact={false} />);
    // 非紧凑模式下 WhatsApp 按钮应包含渠道名称文字
    const whatsAppBtn = getChannelButton(ChannelTypeEnum.WhatsApp);
    expect(whatsAppBtn.textContent).toContain('WhatsApp');
  });

  it('应该在 showTooltip 为 false 时不渲染工具提示', () => {
    renderWithProviders(
      <ChannelFilter {...defaultProps} showTooltip={false} />,
    );
    expect(screen.queryAllByRole('tooltip').length).toBe(0);
  });

  it('应该在单渠道时不显示指示器', () => {
    renderWithProviders(
      <ChannelFilter
        channels={[ChannelTypeEnum.SMS]}
        activeChannel={ChannelTypeEnum.SMS}
        onChannelClick={mockOnChannelClick}
        compact={true}
        showTooltip={false}
      />,
    );
    const slidingIndicators = screen
      .queryAllByRole('presentation')
      .filter((el) => el.classList.contains('bg-white'));
    expect(slidingIndicators.length).toBe(0);
  });

  it('应该在传入 unreadByChannel 时显示 badge', () => {
    renderWithProviders(
      <ChannelFilter
        {...defaultProps}
        unreadByChannel={{
          [ChannelTypeEnum.SMS]: 3,
          [ChannelTypeEnum.WhatsApp]: 10,
        }}
      />,
    );
    expect(screen.getByLabelText('3 unread')).toBeInTheDocument();
    expect(screen.getByLabelText('10 unread')).toBeInTheDocument();
  });

  it('不传 unreadByChannel 时不显示 badge', () => {
    renderWithProviders(<ChannelFilter {...defaultProps} />);
    expect(screen.queryAllByLabelText(/unread/).length).toBe(0);
  });
});
