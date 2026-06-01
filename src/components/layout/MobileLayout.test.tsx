import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { MobileLayout } from './MobileLayout';

const {
  activeConversationMetadataRef,
  activeConversationIdRef,
  composerConfigRef,
  mutateAsyncMock,
  previewTemplateMock,
  templatesRef,
} = vi.hoisted(() => ({
  activeConversationMetadataRef: {
    current: {
      metadata: {
        supportedChannels: ['viber'],
      },
    },
  },
  activeConversationIdRef: {
    current: 'conv-1',
  },
  composerConfigRef: {
    current: {
      templateMode: 'edit' as 'direct' | 'edit',
      placeholder: '输入消息...',
    },
  },
  mutateAsyncMock: vi.fn(),
  previewTemplateMock: vi.fn(),
  templatesRef: {
    current: [
      {
        id: 'tpl-1',
        name: '常规提醒',
        code: 'TPL_NOTICE',
        content: '账单即将逾期通知',
      },
    ],
  },
}));

vi.mock('@/components/messages/InfiniteMessageList', () => ({
  InfiniteMessageList: ({
    conversationId,
    currentChannel,
  }: {
    conversationId: string;
    currentChannel: ChannelTypeEnum;
  }) => (
    <div
      data-testid="mobile-message-list"
      data-conversation-id={conversationId}
      data-channel={currentChannel}
    />
  ),
}));

vi.mock('@/hooks/use-active-conversation-metadata.hook', () => ({
  useActiveConversationMetadata: () => activeConversationMetadataRef.current,
}));

vi.mock('@/hooks/use-conversations.hook', () => ({
  useConversations: () => ({
    data: [
      {
        id: 'conv-1',
        channel: 'viber',
        user: {
          name: '叶+义',
        },
      },
    ],
  }),
}));

vi.mock('@/hooks/use-send-message.hook', () => ({
  useSendMessage: () => ({
    isPending: false,
    mutateAsync: mutateAsyncMock,
  }),
}));

vi.mock('@/hooks/use-template-preview.hook', () => ({
  useTemplatePreview: () => ({
    mutateAsync: previewTemplateMock,
  }),
}));

vi.mock('@/hooks/use-message-status-sync.hook', () => ({
  useMessageStatusSync: () => undefined,
}));

vi.mock('@/hooks/use-templates.hook', () => ({
  useTemplates: () => ({
    data: templatesRef.current,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-unread-sync.hook', () => ({
  useUnreadSync: () => undefined,
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'toolbar.channel.viber': 'Viber',
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/store', () => ({
  useActiveConversationId: () => activeConversationIdRef.current,
  useComposerConfig: () => composerConfigRef.current,
  useStrategy: () => ({
    activeChannel: 'viber',
  }),
}));

describe('MobileLayout', () => {
  beforeEach(() => {
    activeConversationIdRef.current = 'conv-1';
    composerConfigRef.current = {
      templateMode: 'edit',
      placeholder: '输入消息...',
    };
    mutateAsyncMock.mockReset();
    previewTemplateMock.mockReset();
    previewTemplateMock.mockResolvedValue({
      previewContent: '账单即将逾期通知（已渲染）',
    });
    templatesRef.current = [
      {
        id: 'tpl-1',
        name: '常规提醒',
        code: 'TPL_NOTICE',
        content: '账单即将逾期通知',
      },
    ];
  });

  it('应渲染移动端 header、消息区和底部输入区', () => {
    const { container } = render(<MobileLayout />);

    expect(screen.getByText('叶+义')).toBeInTheDocument();
    expect(screen.getByText('Viber 会话')).toBeInTheDocument();
    expect(
      container
        .querySelector('[data-component="mobile-layout"]')
        ?.getAttribute('style'),
    ).toContain('--mobile-accent-color: var(--primary)');
    expect(
      container
        .querySelector('[data-component="mobile-layout"]')
        ?.getAttribute('style'),
    ).toContain('--mobile-accent-foreground-color: var(--primary-foreground)');
    expect(screen.getByTestId('mobile-message-list')).toHaveAttribute(
      'data-conversation-id',
      'conv-1',
    );
    expect(
      screen.getByRole('button', { name: '打开快捷话术模板' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
  });

  it('应通过模板 ActionSheet 回填输入框，并发送当前内容', async () => {
    mutateAsyncMock.mockResolvedValue({
      tempId: 'tmp-1',
      status: 'sent',
    });

    render(<MobileLayout />);

    fireEvent.click(screen.getByRole('button', { name: '打开快捷话术模板' }));
    fireEvent.click(screen.getByRole('button', { name: /常规提醒/ }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入消息...')).toHaveValue(
        '账单即将逾期通知（已渲染）',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '发送消息' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        content: '账单即将逾期通知（已渲染）',
        options: {
          templateMetadata: {
            previewContent: '账单即将逾期通知（已渲染）',
          },
        },
      });
    });
  });
});
