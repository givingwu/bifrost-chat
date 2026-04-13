import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ProfilePanel } from './ProfilePanel';

vi.mock('@/components/profile/Profile', () => ({
  Profile: () => <div data-testid="profile">profile</div>,
}));

vi.mock('@/components/template/TemplatePanel', () => ({
  TemplatePanel: () => <div data-testid="template-panel">template-panel</div>,
}));

describe('ProfilePanel', () => {
  it('右侧面板应包含 min-h-0 以允许模板区域在 flex 布局中滚动', () => {
    const { container } = render(
      <ProfilePanel
        profile={undefined}
        activeConversationId="conv-1"
        activeChannel={ChannelTypeEnum.SMS}
        renderingTemplateId={undefined}
        onTemplateSelect={vi.fn()}
      />,
    );

    const aside = container.querySelector('aside');

    expect(aside?.className).toContain('min-h-0');
  });
});
