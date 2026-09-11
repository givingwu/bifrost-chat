import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { DefaultChatLayout } from './DefaultChatLayout';

const {
  activeConversationMetadataRef,
  cacheConversationMock,
  composerFocusMock,
  composerOnSendRef,
  composerSetTemplateMock,
  conversationHeaderPropsRef,
  conversationGetMock,
  conversationListOnSelectRef,
  conversationStateRef,
  conversationsRef,
  getConversationDetailMock,
  mutateAsyncMock,
  previewTemplateMutateAsyncMock,
  queryClientRef,
  setActiveConversationIdMock,
  setConversationSwitchingMock,
} = vi.hoisted(() => ({
  activeConversationMetadataRef: {
    current: {
      metadata: {
        supportedChannels: ['whatsapp'],
      },
      isPending: false,
    } as {
      metadata:
        | {
            supportedChannels: string[];
          }
        | undefined;
      isPending: boolean;
    },
  },
  cacheConversationMock: vi.fn(),
  composerFocusMock: vi.fn(),
  composerOnSendRef: {
    current: undefined as
      | ((content: string, options?: Record<string, unknown>) => unknown)
      | undefined,
  },
  composerSetTemplateMock: vi.fn(),
  conversationHeaderPropsRef: {
    current: undefined as
      | {
          title?: ReactNode;
          extra?: ReactNode;
          search?: ReactNode;
        }
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
        supportedChannels: ['whatsapp'] as string[],
      },
      {
        id: 'conv-2',
        channel: 'whatsapp',
        user: {
          name: '李四',
        },
        supportedChannels: ['whatsapp'] as string[],
      },
    ] as Array<{
      id: string;
      channel: string;
      user: { name: string };
      supportedChannels?: string[];
    }>,
  },
  getConversationDetailMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
  previewTemplateMutateAsyncMock: vi.fn(),
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
      {
        onSend,
        loading,
      }: {
        onSend?: typeof composerOnSendRef.current;
        loading?: boolean;
      },
      ref: React.ForwardedRef<{
        focus: () => void;
        setValue: (
          value: string,
          templateCode?: string,
          templateMetadata?: unknown,
          templateError?: string | null,
        ) => void;
        getValue: () => string;
        clear: () => void;
        setTemplate: (data: {
          content: string;
          templateCode?: string;
          templateMetadata?: unknown;
          templateError?: string | null;
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
        setTemplate: composerSetTemplateMock,
        getAttachments: () => [],
      }));

      if (loading) {
        return <div data-testid="composer-skeleton" />;
      }

      return <div data-testid="composer" />;
    }),
  };
});

vi.mock('@/components/conversation/ConversationHeader', () => ({
  ConversationHeader: (props: {
    title?: ReactNode;
    extra?: ReactNode;
    search?: ReactNode;
  }) => {
    conversationHeaderPropsRef.current = props;
    return <div data-testid="conversation-header" />;
  },
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
  ConversationPanel: ({
    header,
    children,
  }: {
    header?: ReactNode;
    children?: ReactNode;
  }) => (
    <div>
      {header}
      {children}
    </div>
  ),
}));

vi.mock('@/components/messages/InfiniteMessageList', () => ({
  InfiniteMessageList: () => <div />,
}));

vi.mock('@/components/profile/ProfilePanel', () => ({
  ProfilePanel: ({
    onTemplateSelect,
  }: {
    onTemplateSelect?: (template: {
      id: string;
      code?: string;
      content: string;
      name: string;
    }) => Promise<void>;
  }) => (
    <button
      data-testid="template-item-tpl-1"
      type="button"
      onClick={() => {
        void onTemplateSelect?.({
          id: 'tpl-1',
          code: 'tpl-code-1',
          content: '原始模板内容',
          name: '模板1',
        });
      }}
    >
      tpl-1
    </button>
  ),
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
    t: (key: string) => {
      const translations: Record<string, string> = {
        'template.previewFailed': '模板参数替换失败，当前模板暂不可发送',
      };
      return translations[key] ?? key;
    },
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
  useActiveConversationMetadata: () => activeConversationMetadataRef.current,
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
    mutateAsync: previewTemplateMutateAsyncMock,
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
    activeConversationMetadataRef.current = {
      metadata: {
        supportedChannels: [ChannelTypeEnum.WhatsApp],
      },
      isPending: false,
    };
    cacheConversationMock.mockReset();
    composerFocusMock.mockReset();
    composerOnSendRef.current = undefined;
    composerSetTemplateMock.mockReset();
    conversationHeaderPropsRef.current = undefined;
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
        supportedChannels: [ChannelTypeEnum.WhatsApp],
      },
      {
        id: 'conv-2',
        channel: 'whatsapp',
        user: {
          name: '李四',
        },
        supportedChannels: [ChannelTypeEnum.WhatsApp],
      },
    ];
    getConversationDetailMock.mockReset();
    mutateAsyncMock.mockReset();
    previewTemplateMutateAsyncMock.mockReset();
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

  it('应在会话详情加载中时渲染 Composer skeleton', () => {
    activeConversationMetadataRef.current = {
      metadata: undefined,
      isPending: true,
    };

    render(<DefaultChatLayout />);

    expect(screen.getByTestId('composer-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('composer')).not.toBeInTheDocument();
  });

  it('模板预览失败时应阻止发送，并回填模板错误状态到 Composer', async () => {
    previewTemplateMutateAsyncMock.mockRejectedValue(
      new Error('模板参数替换异常'),
    );

    render(<DefaultChatLayout />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('template-item-tpl-1'));
      await Promise.resolve();
    });

    expect(previewTemplateMutateAsyncMock).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      currentChannel: ChannelTypeEnum.WhatsApp,
      templateCode: 'tpl-code-1',
    });
    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(composerSetTemplateMock).toHaveBeenCalledWith({
      content: '原始模板内容',
      templateCode: 'tpl-code-1',
      templateError: '模板参数替换失败，当前模板暂不可发送',
      templateMetadata: undefined,
    });
  });

  it('应向 ConversationHeader 透传自定义 title 和 extra，并保留内部搜索框', () => {
    render(
      <DefaultChatLayout
        conversationHeaderProps={{
          title: <span>客户会话</span>,
          extra: <button type="button">账号管理</button>,
        }}
      />,
    );

    expect(conversationHeaderPropsRef.current?.title).toBeTruthy();
    expect(conversationHeaderPropsRef.current?.extra).toBeTruthy();
    expect(conversationHeaderPropsRef.current?.search).toBeTruthy();
  });
});
