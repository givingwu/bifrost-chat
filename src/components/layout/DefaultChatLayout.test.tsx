import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { DefaultChatLayout } from './DefaultChatLayout';

const {
  cacheConversationMock,
  composerFocusMock,
  composerOnSendRef,
  conversationGetMock,
  conversationListOnSelectRef,
  conversationStateRef,
  conversationsRef,
  getConversationDetailMock,
  mutateAsyncMock,
  queryClientRef,
  setActiveConversationIdMock,
  setConversationSwitchingMock,
} = vi.hoisted(() => ({
  cacheConversationMock: vi.fn(),
  composerFocusMock: vi.fn(),
  composerOnSendRef: {
    current: undefined as
      | ((content: string, options?: Record<string, unknown>) => unknown)
      | undefined,
  },
  conversationGetMock: vi.fn(),
  conversationListOnSelectRef: {
    current: undefined as
      | ((conversationId: string) => Promise<void>)
      | undefined,
  },
  conversationStateRef: {
    current: {
      activeConversationId: 'conv-1',
      searchQuery: '',
    },
  },
  conversationsRef: {
    current: [
      {
        id: 'conv-1',
        channel: 'whatsapp',
        user: {
          name: '张三',
        },
      },
      {
        id: 'conv-2',
        channel: 'whatsapp',
        user: {
          name: '李四',
        },
      },
    ],
  },
  getConversationDetailMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
  queryClientRef: {
    current: {} as object,
  },
  setActiveConversationIdMock: vi.fn(),
  setConversationSwitchingMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );

  return {
    ...actual,
    useQueryClient: () => queryClientRef.current,
  };
});

vi.mock('@/components/composer/Composer', async () => {
  const React = await import('react');

  return {
    Composer: React.forwardRef(function MockComposer(
      { onSend }: { onSend?: typeof composerOnSendRef.current },
      ref: React.ForwardedRef<{
        focus: () => void;
        setValue: (
          value: string,
          templateCode?: string,
          templateMetadata?: unknown,
        ) => void;
        getValue: () => string;
        clear: () => void;
        setTemplate: (data: {
          content: string;
          templateCode?: string;
          templateMetadata?: unknown;
        }) => void;
        getAttachments: () => [];
      }>,
    ) {
      composerOnSendRef.current = onSend;
      React.useImperativeHandle(ref, () => ({
        focus: composerFocusMock,
        setValue: () => undefined,
        getValue: () => '',
        clear: () => undefined,
        setTemplate: () => undefined,
        getAttachments: () => [],
      }));

      return <div data-testid="composer" />;
    }),
  };
});

vi.mock('@/components/conversation/ConversationHeader', () => ({
  ConversationHeader: () => <div />,
}));

vi.mock('@/components/conversation/ConversationList', () => ({
  ConversationList: ({
    onSelect,
  }: {
    onSelect?: (conversationId: string) => Promise<void>;
  }) => {
    conversationListOnSelectRef.current = onSelect;

    return (
      <button
        data-testid="conversation-item-conv-2"
        type="button"
        onClick={() => {
          void onSelect?.('conv-2');
        }}
      >
        conv-2
      </button>
    );
  },
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
    data: conversationsRef.current,
    isFetching: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-active-conversation-metadata.hook', () => ({
  useActiveConversationMetadata: () => ({
    metadata: null,
  }),
}));

vi.mock('@/hooks/use-conversation-detail.hook', () => ({
  useConversationDetail: () => ({
    data: undefined,
    isFetching: false,
    isLoading: false,
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

vi.mock('@/providers/service.provider', () => ({
  useServices: () => ({
    conversationService: {
      get: conversationGetMock,
    },
  }),
}));

vi.mock('@/services/cache/conversation-cache-helper.service', () => ({
  ConversationCacheHelper: {
    cacheConversation: cacheConversationMock,
    getConversationDetail: getConversationDetailMock,
  },
}));

vi.mock('@/store', () => ({
  useActions: () => ({
    setSearchQuery: vi.fn(),
    setActiveConversationId: setActiveConversationIdMock,
    setConversationSwitching: setConversationSwitchingMock,
  }),
  useComposerConfig: () => ({
    templateMode: 'edit',
    clearDraftOnSend: true,
  }),
  useConversation: () => conversationStateRef.current,
  useProfile: () => ({
    profile: null,
  }),
  useStrategy: () => ({
    activeChannel: ChannelTypeEnum.WhatsApp,
  }),
}));

describe('DefaultChatLayout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cacheConversationMock.mockReset();
    composerFocusMock.mockReset();
    composerOnSendRef.current = undefined;
    conversationGetMock.mockReset();
    conversationListOnSelectRef.current = undefined;
    conversationStateRef.current = {
      activeConversationId: 'conv-1',
      searchQuery: '',
    };
    conversationsRef.current = [
      {
        id: 'conv-1',
        channel: 'whatsapp',
        user: {
          name: '张三',
        },
      },
      {
        id: 'conv-2',
        channel: 'whatsapp',
        user: {
          name: '李四',
        },
      },
    ];
    getConversationDetailMock.mockReset();
    mutateAsyncMock.mockReset();
    setActiveConversationIdMock.mockReset();
    setConversationSwitchingMock.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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

  it('应在 activeConversationId 变更后延迟聚焦 Composer', () => {
    const { rerender } = render(<DefaultChatLayout />);

    expect(composerFocusMock).not.toHaveBeenCalled();
    conversationStateRef.current = {
      activeConversationId: 'conv-2',
      searchQuery: '',
    };

    rerender(<DefaultChatLayout />);

    expect(composerFocusMock).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(composerFocusMock).toHaveBeenCalledTimes(1);
  });

  it('应在点击会话列表项时激活会话', async () => {
    render(<DefaultChatLayout />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('conversation-item-conv-2'));
      await Promise.resolve();
    });

    // 当前实现：直接设置 activeConversationId，由 useConversationDetail hook 负责获取详情
    expect(setActiveConversationIdMock).toHaveBeenCalledWith('conv-2');
  });
});
