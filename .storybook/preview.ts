import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import '@/styles/index.css';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import zhCNMessages from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import {
  createNotImplementedServices,
  ServiceProvider,
} from '@/providers/service.provider';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// 创建默认服务实现（用于 Storybook）
const mockServices = createNotImplementedServices();

/**
 * 全局装饰器：为所有 Story 提供必要的 Context
 */
export const decorators = [
  (Story: () => React.ReactElement) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        ServiceProvider,
        {
          conversationService: mockServices.conversationService,
          messageService: mockServices.messageService,
          templateService: mockServices.templateService,
        } as React.ComponentProps<typeof ServiceProvider>,
        React.createElement(
          I18nProvider,
          {
            locale: LanguageCodeEnum.ZhCN,
            messages: zhCNMessages,
          },
          React.createElement(Story),
        ),
      ),
    ),
];

const preview: Preview = {
  decorators,
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
