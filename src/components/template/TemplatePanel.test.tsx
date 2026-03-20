import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { TemplatePanel } from './TemplatePanel';

type MockConversation = { id: string; channel: ChannelTypeEnum };
let mockConversations: MockConversation[] = [];
let mockIsConversationsLoading = false;

vi.mock('@/hooks/use-templates.hook', () => ({
  useTemplates: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-conversations.hook', () => ({
  useConversations: () => ({
    data: mockConversations,
    isLoading: mockIsConversationsLoading,
  }),
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'template.panel.selectConversationFirst') {
        return '请先选择会话';
      }
      return key;
    },
  }),
}));

vi.mock('@/store', () => ({
  useActiveConversationId: () => undefined,
}));

vi.mock('@/components/layout/UnsupportedChannelWarning', () => ({
  UnsupportedChannelWarning: ({ channel }: { channel: ChannelTypeEnum }) => (
    <div data-testid="unsupported-channel-warning">UNSUPPORTED {channel}</div>
  ),
}));

describe('TemplatePanel', () => {
  it('无会话选择时优先显示“请先选择会话”', () => {
    mockConversations = [];
    mockIsConversationsLoading = false;

    render(
      <TemplatePanel
        currentChannel={ChannelTypeEnum.WhatsApp}
        isChannelSupported={false}
      />,
    );

    expect(screen.getByText('请先选择会话')).toBeInTheDocument();
    expect(
      screen.queryByTestId('unsupported-channel-warning'),
    ).not.toBeInTheDocument();
  });

  it('有会话但不支持当前渠道时显示“当前会话暂不支持 XXX”警告', () => {
    mockConversations = [{ id: 'conv-1', channel: ChannelTypeEnum.WhatsApp }];
    mockIsConversationsLoading = false;

    render(
      <TemplatePanel
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
        isChannelSupported={false}
      />,
    );

    expect(
      screen.getByTestId('unsupported-channel-warning'),
    ).toBeInTheDocument();
  });

  it('会话列表为空时（即使传入 conversationId）仍显示“请先选择会话”', () => {
    mockConversations = [];
    mockIsConversationsLoading = false;

    render(
      <TemplatePanel
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
        isChannelSupported={true}
      />,
    );

    expect(screen.getByText('请先选择会话')).toBeInTheDocument();
  });
});

