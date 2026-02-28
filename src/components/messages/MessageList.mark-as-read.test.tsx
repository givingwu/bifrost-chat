import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import enUSMessages from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';
import { MessageList } from './MessageList';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  private readonly callback: IntersectionObserverCallback;
  private readonly observedElements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn((element: Element) => {
    this.observedElements.add(element);
  });

  unobserve = vi.fn((element: Element) => {
    this.observedElements.delete(element);
  });

  disconnect = vi.fn(() => {
    this.observedElements.clear();
  });

  takeRecords = vi.fn(() => []);

  triggerIntersecting(ratio = 1) {
    for (const element of this.observedElements) {
      const rect = element.getBoundingClientRect();
      const entry: IntersectionObserverEntry = {
        target: element,
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        time: Date.now(),
      };

      this.callback([entry], this as unknown as IntersectionObserver);
    }
  }
}

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockTemplateService: ITemplateService = {
  list: vi.fn(),
  send: vi.fn(),
};

const mockMessageService: IMessageService = {
  list: vi.fn(),
  send: vi.fn(),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  subscribeToMessages: vi.fn(() => () => {}),
  subscribeToMessageStatus: vi.fn(() => () => {}),
  sendAttachment: vi.fn(),
  sendAudio: vi.fn(),
};

function createMessage(
  id: string,
  direction: MessageDirectionEnum,
  status: MessageStatusEnum,
): StandardMessage {
  return {
    id,
    direction,
    channelType: ChannelTypeEnum.WhatsApp,
    status,
    timestamp: Date.now(),
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    // 添加 sender 信息（消息发送者，即对方）
    sender: {
      app: 'fox_collect.customer',
      pin: `customer-${id}`,
    },
  };
}

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={LanguageCodeEnum.EnUS} messages={enUSMessages}>
          <ServiceProvider
            conversationService={mockConversationService}
            messageService={mockMessageService}
            templateService={mockTemplateService}
          >
            {children}
          </ServiceProvider>
        </I18nProvider>
      </QueryClientProvider>
    );
  };
}

describe('MessageList markAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MockIntersectionObserver.instances = [];
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
      MockIntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('消息进入视口后应在 1 秒防抖后批量调用 markAsRead', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const message = createMessage(
      'msg-visible',
      MessageDirectionEnum.Incoming,
      MessageStatusEnum.Delivered,
    );

    // 设置 QueryCache 中的消息数据，供 mutationFn 使用
    queryClient.setQueryData(queryKeys.messages.list('conv-mark-read'), {
      pages: [
        {
          items: [message],
        },
      ],
      pageParams: [1],
    });

    render(
      <MessageList
        messages={[message]}
        conversationId="conv-mark-read"
        enableVirtualization={false}
        enableAutoMarkAsRead={true}
        markAsReadDebounceDelay={1000}
      />,
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);

    act(() => {
      for (const observer of MockIntersectionObserver.instances) {
        observer.triggerIntersecting(1);
        observer.triggerIntersecting(1);
      }
    });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(mockMessageService.markAsRead).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockMessageService.markAsRead).toHaveBeenCalledTimes(1);

    // 验证调用了 markAsRead，参数格式为 ReadAckParams
    expect(mockMessageService.markAsRead).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: 'Pin is required',
        app: 'Bifrost Chat',
        mid: 'msg-visible',
        chatId: 'conv-mark-read',
        toApp: 'fox_collect.customer',
        toPin: 'customer-msg-visible',
        datetime: expect.any(Number),
      }),
    );
  });

  it('只应上报 incoming 且未读消息', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const outgoingMessage = createMessage(
      'msg-outgoing',
      MessageDirectionEnum.Outgoing,
      MessageStatusEnum.Sent,
    );
    const readIncomingMessage = createMessage(
      'msg-read',
      MessageDirectionEnum.Incoming,
      MessageStatusEnum.Read,
    );

    render(
      <MessageList
        messages={[outgoingMessage, readIncomingMessage]}
        conversationId="conv-filter"
        enableVirtualization={false}
        enableAutoMarkAsRead={true}
        markAsReadDebounceDelay={1000}
      />,
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);

    act(() => {
      for (const observer of MockIntersectionObserver.instances) {
        observer.triggerIntersecting(1);
      }
      vi.advanceTimersByTime(1000);
    });

    expect(mockMessageService.markAsRead).not.toHaveBeenCalled();
  });
});
