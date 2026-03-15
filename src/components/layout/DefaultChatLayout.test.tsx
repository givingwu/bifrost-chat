import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { DefaultChatLayout } from './DefaultChatLayout';

const {
  composerOnSendRef,
  mutateAsyncMock,
} = vi.hoisted(() => ({
  composerOnSendRef: {
    current: undefined as
      | ((content: string, options?: Record<string, unknown>) => unknown)
      | undefined,
  },
  mutateAsyncMock: vi.fn(),
}));

vi.mock('@/components/composer/Composer', () => ({
  Composer: ({ onSend }: { onSend?: typeof composerOnSendRef.current }) => {
    composerOnSendRef.current = onSend;
    return <div data-testid="composer" />;
  },
}));

vi.mock('@/components/conversation/ConversationHeader', () => ({
  ConversationHeader: () => <div />,
}));

vi.mock('@/components/conversation/ConversationList', () => ({
  ConversationList: () => <div />,
}));

vi.mock('@/components/conversation/ConversationPanel', () => ({
  ConversationPanel: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/messages/InfiniteMessageList', () => ({
  InfiniteMessageList: () => <div />,
}));

vi.mock('@/components/profile/Profile', () => ({
  Profile: () => <div />,
}));

vi.mock('@/components/template/TemplatePanel', () => ({
  TemplatePanel: () => <div />,
}));

vi.mock('@/components/toolbar/Topbar', () => ({
  Topbar: () => <div />,
}));

vi.mock('@/components/toolbar/TopbarTools', () => ({
  TopbarTools: () => <div />,
}));

vi.mock('./ChatLayout', () => ({
  ChatLayout: ({
    topbar,
    conversationPanel,
    composer,
    profilePanel,
    children,
  }: {
    topbar?: ReactNode;
    conversationPanel?: ReactNode;
    composer?: ReactNode;
    profilePanel?: ReactNode;
    children?: ReactNode;
  }) => (
    <div>
      {topbar}
      {conversationPanel}
      {composer}
      {profilePanel}
      {children}
    </div>
  ),
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-conversations.hook', () => ({
  useConversations: () => ({
    data: [
      {
        id: 'conv-1',
        channel: ChannelTypeEnum.WhatsApp,
        user: {
          name: '张三',
        },
      },
    ],
    isFetching: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-active-conversation-metadata.hook', () => ({
  useActiveConversationMetadata: () => ({
    metadata: null,
  }),
}));

vi.mock('@/hooks/use-send-message.hook', () => ({
  useSendMessage: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}));

vi.mock('@/hooks/use-template-preview.hook', () => ({
  useTemplatePreview: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-total-unread.hook', () => ({
  useTotalUnread: () => ({
    totalUnread: 0,
  }),
}));

vi.mock('@/hooks/use-unread-sync.hook', () => ({
  useUnreadSync: () => undefined,
}));

vi.mock('@/hooks/use-message-status-sync.hook', () => ({
  useMessageStatusSync: () => undefined,
}));

vi.mock('@/store', () => ({
  useActions: () => ({
    setSearchQuery: vi.fn(),
    setActiveConversationId: vi.fn(),
  }),
  useComposerConfig: () => ({
    templateMode: 'edit',
    clearDraftOnSend: true,
  }),
  useConversation: () => ({
    activeConversationId: 'conv-1',
    searchQuery: '',
  }),
  useProfile: () => ({
    profile: null,
  }),
  useStrategy: () => ({
    activeChannel: ChannelTypeEnum.WhatsApp,
  }),
}));

describe('DefaultChatLayout', () => {
  beforeEach(() => {
    composerOnSendRef.current = undefined;
    mutateAsyncMock.mockReset();
  });

  it('应把 sendMessage.mutateAsync 的结果返回给 Composer onSend', async () => {
    const failedResult = {
      status: 'failed',
      error: '消息包含敏感词',
      needRollback: true,
    };
    mutateAsyncMock.mockResolvedValue(failedResult);

    render(<DefaultChatLayout />);

    expect(composerOnSendRef.current).toBeTypeOf('function');

    const result = await composerOnSendRef.current?.('敏感内容', {
      type: 'text',
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      content: '敏感内容',
      options: {
        type: 'text',
      },
    });
    expect(result).toBe(failedResult);
  });
});
