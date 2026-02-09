import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import enUSMessages from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import { StatusIndicator, type StatusIndicatorProps } from './StatusIndicator';

/**
 * 测试覆盖说明：
 * - 空状态渲染
 * - i18n 状态文案（aria-label）
 * - tooltip 文案（title）
 * - 发送中动画开关
 */
function renderStatusIndicator(props: StatusIndicatorProps) {
  return render(
    <I18nProvider locale={LanguageCodeEnum.EnUS} messages={enUSMessages}>
      <StatusIndicator {...props} />
    </I18nProvider>,
  );
}

describe('StatusIndicator', () => {
  it('未传状态时应不渲染图标', () => {
    const { container } = renderStatusIndicator({});

    expect(container.querySelector('svg')).toBeNull();
  });

  it('应渲染状态文案并提供 title 悬浮提示', () => {
    const { container } = renderStatusIndicator({
      status: MessageStatusEnum.Sent,
    });

    const icon = container.querySelector('svg');
    const wrapper = icon?.closest('span');

    expect(icon).not.toBeNull();
    expect(wrapper).not.toBeNull();
    expect(icon).toHaveAttribute('aria-label', 'Message sent');
    expect(wrapper).toHaveAttribute('title', 'Status: Message sent');
  });

  it('发送中状态默认应启用旋转动画', () => {
    const { container } = renderStatusIndicator({
      status: MessageStatusEnum.Sending,
    });

    const icon = container.querySelector('svg');

    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('animate-spin');
  });

  it('animate 为 false 时应禁用旋转动画', () => {
    const { container } = renderStatusIndicator({
      status: MessageStatusEnum.Sending,
      animate: false,
    });

    const icon = container.querySelector('svg');

    expect(icon).not.toBeNull();
    expect(icon).not.toHaveClass('animate-spin');
  });

  it('showTooltip 为 false 时不应设置 title', () => {
    const { container } = renderStatusIndicator({
      status: MessageStatusEnum.Delivered,
      showTooltip: false,
    });

    const icon = container.querySelector('svg');
    const wrapper = icon?.closest('span');

    expect(icon).not.toBeNull();
    expect(wrapper).not.toHaveAttribute('title');
    expect(icon).toHaveAttribute('aria-label', 'Message delivered');
  });
});
