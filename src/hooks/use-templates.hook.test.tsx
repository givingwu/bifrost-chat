import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore, useChatStore } from '@/store';
import { useTemplates } from './use-templates.hook';

const listMock = vi.fn();

const mockConversationService = {} as IConversationService;
const mockMessageService = {} as IMessageService;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const templateService = {
    list: listMock,
  } as unknown as ITemplateService;

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={mockMessageService}
          templateService={templateService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useTemplates', () => {
  afterEach(() => {
    listMock.mockReset();
    resetChatStore();
  });

  it('会话切换完成前不查询模板，完成后再恢复请求', async () => {
    listMock.mockResolvedValue([]);

    act(() => {
      useChatStore.getState().actions.setConversationSwitching(true);
    });

    const { result } = renderHook(
      () =>
        useTemplates({
          conversationId: 'conv-1',
          currentChannel: 'whatsapp',
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
