import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore, useChatStore } from '@/store';
import { useMessages } from './use-messages.hook';

const listMock = vi.fn();

const mockConversationService = {} as IConversationService;
const mockTemplateService = {} as ITemplateService;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const messageService = {
    list: listMock,
  } as unknown as IMessageService;

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={messageService}
          templateService={mockTemplateService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useMessages', () => {
  afterEach(() => {
    listMock.mockReset();
    resetChatStore();
  });

  it('会话切换完成前不拉取消息，完成后再恢复请求', async () => {
    listMock.mockResolvedValue([]);

    act(() => {
      useChatStore.getState().actions.setConversationSwitching(true);
    });

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(listMock).not.toHaveBeenCalled();

    act(() => {
      useChatStore.getState().actions.setConversationSwitching(false);
    });

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledTimes(1);
    });
  });
});
