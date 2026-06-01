import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ChannelIcon,
  EmailChannelIcon,
  RcsChannelIcon,
  SmsChannelIcon,
  ViberChannelIcon,
  WaAgentChannelIcon,
  WhatsAppChannelIcon,
} from '@/components';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

describe('ChannelIcon public API', () => {
  it('公开所有可用渠道的具名图标组件', () => {
    const icons = [
      SmsChannelIcon,
      WhatsAppChannelIcon,
      WaAgentChannelIcon,
      EmailChannelIcon,
      ViberChannelIcon,
      RcsChannelIcon,
    ];

    icons.forEach((Icon, index) => {
      const { container } = render(
        <Icon data-testid={`channel-icon-${index}`} size="md" />,
      );
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('按渠道类型渲染通用 ChannelIcon', () => {
    render(
      <ChannelIcon
        channel={ChannelTypeEnum.RCS}
        size={18}
        title="RCS channel"
      />,
    );

    const icon = screen.getByRole('img', { name: 'RCS channel' });
    expect(icon).toHaveAttribute('width', '18');
    expect(icon).toHaveAttribute('height', '18');
  });
});
