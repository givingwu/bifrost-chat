import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore } from '@/store';
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

  it('成功获取模板列表', async () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: '问候语',
        code: 'greeting',
        content: '您好，请问有什么可以帮助您的？',
      },
      {
        id: 'template-2',
        name: '催款提醒',
        code: 'payment_reminder',
        content: '您好，您的账单已逾期，请尽快处理。',
      },
    ];
    listMock.mockResolvedValue(mockTemplates);

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
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      currentChannel: 'whatsapp',
    });
  });

  it('返回空数组当服务未提供', async () => {
    const mockTemplateService = null as unknown as ITemplateService;

    function createWrapperWithoutService() {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      return function TestWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            <ServiceProvider
              conversationService={mockConversationService}
              messageService={mockMessageService}
              templateService={mockTemplateService}
            >
              {children}
            </ServiceProvider>
          </QueryClientProvider>
        );
      };
    }

    const { result } = renderHook(
      () =>
        useTemplates({
          conversationId: 'conv-1',
          currentChannel: 'whatsapp',
        }),
      {
        wrapper: createWrapperWithoutService(),
      },
    );

    // 当服务未提供时，查询被禁用，fetchStatus 应该是 idle
    expect(result.current.fetchStatus).toBe('idle');
    expect(listMock).not.toHaveBeenCalled();
  });

  it('处理服务错误', async () => {
    const mockError = new Error('Failed to fetch templates');
    listMock.mockRejectedValue(mockError);

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
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('显示加载状态', async () => {
    const mockPromise = new Promise(() => undefined);
    listMock.mockReturnValue(mockPromise);

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

    // React Query 应该开始获取数据
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });
  });

  it('使用缓存数据（5分钟内不重复请求）', async () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: '问候语',
        code: 'greeting',
        content: '您好，请问有什么可以帮助您的？',
      },
    ];
    listMock.mockResolvedValue(mockTemplates);

    const { result, rerender } = renderHook(
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
      expect(result.current.isSuccess).toBe(true);
    });

    expect(listMock).toHaveBeenCalledTimes(1);

    // 重新渲染，应该使用缓存不重新请求
    rerender();

    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('不同参数会触发新的请求', async () => {
    const mockTemplates1 = [
      {
        id: 'template-1',
        name: 'WhatsApp 模板',
        code: 'whatsapp_template',
        content: 'WhatsApp 消息',
      },
    ];
    const mockTemplates2 = [
      {
        id: 'template-2',
        name: 'SMS 模板',
        code: 'sms_template',
        content: 'SMS 消息',
      },
    ];
    listMock
      .mockResolvedValueOnce(mockTemplates1)
      .mockResolvedValueOnce(mockTemplates2);

    const { result, rerender } = renderHook(
      ({ channel }) =>
        useTemplates({
          conversationId: 'conv-1',
          currentChannel: channel,
        }),
      {
        wrapper: createWrapper(),
        initialProps: { channel: 'whatsapp' },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates1);
    expect(listMock).toHaveBeenCalledTimes(1);

    // 切换渠道
    rerender({ channel: 'sms' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates2);
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it('当未选择会话时禁用模板查询', () => {
    const { result } = renderHook(
      () => useTemplates({ currentChannel: 'sms' }),
      {
        wrapper: createWrapper(),
      },
    );

    // query enabled=false 时应处于 idle，且不会触发 list
    expect(result.current.fetchStatus).toBe('idle');
    expect(listMock).not.toHaveBeenCalled();
  });
});
