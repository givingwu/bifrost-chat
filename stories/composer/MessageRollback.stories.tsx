import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ComposerToolbarRef } from '@/components/composer/ComposerToolbar';
import { ComposerWithSend } from '@/components/composer/ComposerWithSend';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageFailureTypeEnum,
  type MessageSendResult,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IMessageService } from '@/services/message.service';

// Mock MessageService
class MockMessageService implements IMessageService {
  private scenario: 'success' | 'retryable' | 'non-retryable' = 'success';

  setScenario(scenario: 'success' | 'retryable' | 'non-retryable') {
    this.scenario = scenario;
  }

  async list() {
    return [];
  }

  async send(): Promise<MessageSendResult> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    const tempId = `temp-${Date.now()}`;

    switch (this.scenario) {
      case 'success':
        return {
          tempId,
          messageId: `msg-${Date.now()}`,
          status: MessageStatusEnum.Sent,
        };
      case 'retryable':
        return {
          tempId,
          status: MessageStatusEnum.Failed,
          error: '网络连接失败，请检查网络设置',
          errorType: MessageFailureTypeEnum.Network,
          retryable: true,
        };
      case 'non-retryable':
        return {
          tempId,
          status: MessageStatusEnum.Failed,
          error: '已达到今日发送次数上限，请明天再试',
          errorType: MessageFailureTypeEnum.Quota,
          retryable: false,
        };
      default:
        return {
          tempId,
          status: MessageStatusEnum.Sent,
        };
    }
  }

  async markAsRead() {
    return Promise.resolve();
  }

  subscribeToMessages() {
    return () => {};
  }

  subscribeToMessageStatus() {
    return () => {};
  }

  async sendAttachment() {
    return {
      tempId: `temp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
  }

  async sendAudio() {
    return {
      tempId: `temp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      status: MessageStatusEnum.Sent,
    };
  }
}

const mockMessageService = new MockMessageService();

const meta = {
  title: 'Composer/MessageRollback',
  component: ComposerWithSend,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# 消息回填功能 Story

这个 Story 用于测试消息发送失败后的回填功能。

## 场景说明

### 1. 成功发送
- 消息正常发送成功
- 没有错误提示
- 消息显示在列表中

### 2. 可重试错误（网络错误）
- 模拟网络连接失败
- 消息保存在离线队列
- 显示重试按钮
- 不触发消息回填

### 3. 不可重试错误（配额限制）
- 模拟达到发送次数上限
- 消息从缓存中删除
- 消息内容回填到输入框
- 显示错误提示（3秒后自动消失）
- 不保存到离线队列

## 测试步骤

1. 选择不同的场景
2. 在输入框中输入消息内容
3. 点击发送按钮
4. 观察不同的行为
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComposerWithSend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            mutations: {
              retry: false,
            },
            queries: {
              retry: false,
            },
          },
        }),
    );

    mockMessageService.setScenario('success');

    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          services={{
            messageService: mockMessageService,
          }}
        >
          <div className="w-full max-w-2xl">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">场景：成功发送</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                此场景模拟消息发送成功的情况。消息会正常显示，没有错误提示。
              </p>
            </div>
            <ComposerWithSend
              conversationId="conv-1"
              channel={ChannelTypeEnum.WhatsApp}
            />
          </div>
        </ServiceProvider>
      </QueryClientProvider>
    );
  },
};

export const RetryableError: Story = {
  render: () => {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            mutations: {
              retry: false,
            },
            queries: {
              retry: false,
            },
          },
        }),
    );

    mockMessageService.setScenario('retryable');

    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          services={{
            messageService: mockMessageService,
          }}
        >
          <div className="w-full max-w-2xl">
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">
                场景：可重试错误（网络错误）
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                此场景模拟网络连接失败的情况。消息会保存在离线队列中，并显示重试按钮。
                消息内容不会回填到输入框。
              </p>
            </div>
            <ComposerWithSend
              conversationId="conv-1"
              channel={ChannelTypeEnum.WhatsApp}
            />
          </div>
        </ServiceProvider>
      </QueryClientProvider>
    );
  },
};

export const NonRetryableError: Story = {
  render: () => {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            mutations: {
              retry: false,
            },
            queries: {
              retry: false,
            },
          },
        }),
    );

    mockMessageService.setScenario('non-retryable');

    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          services={{
            messageService: mockMessageService,
          }}
        >
          <div className="w-full max-w-2xl">
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">
                场景：不可重试错误（配额限制）
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                此场景模拟达到发送次数上限的情况。消息会从缓存中删除，内容回填到输入框，
                并显示错误提示（3秒后自动消失）。不保存到离线队列。
              </p>
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                <strong>预期行为：</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>消息从列表中消失</li>
                  <li>消息内容重新出现在输入框中</li>
                  <li>显示红色错误提示条</li>
                  <li>错误提示3秒后自动消失</li>
                </ul>
              </div>
            </div>
            <ComposerWithSend
              conversationId="conv-1"
              channel={ChannelTypeEnum.WhatsApp}
            />
          </div>
        </ServiceProvider>
      </QueryClientProvider>
    );
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [scenario, setScenario] = useState<
      'success' | 'retryable' | 'non-retryable'
    >('success');
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            mutations: {
              retry: false,
            },
            queries: {
              retry: false,
            },
          },
        }),
    );

    mockMessageService.setScenario(scenario);

    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          services={{
            messageService: mockMessageService,
          }}
        >
          <div className="w-full max-w-2xl">
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <h3 className="font-semibold mb-3">交互式演示</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scenario"
                    value="success"
                    checked={scenario === 'success'}
                    onChange={(e) =>
                      setScenario(e.target.value as typeof scenario)
                    }
                    className="text-primary"
                  />
                  <span className="text-sm">成功发送</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scenario"
                    value="retryable"
                    checked={scenario === 'retryable'}
                    onChange={(e) =>
                      setScenario(e.target.value as typeof scenario)
                    }
                    className="text-primary"
                  />
                  <span className="text-sm">可重试错误（网络错误）</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scenario"
                    value="non-retryable"
                    checked={scenario === 'non-retryable'}
                    onChange={(e) =>
                      setScenario(e.target.value as typeof scenario)
                    }
                    className="text-primary"
                  />
                  <span className="text-sm">不可重试错误（配额限制）</span>
                </label>
              </div>
              <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                <strong>当前场景：</strong>
                {scenario === 'success' && (
                  <span className="ml-2 text-green-600">
                    消息会正常发送成功
                  </span>
                )}
                {scenario === 'retryable' && (
                  <span className="ml-2 text-yellow-600">
                    消息会保存在离线队列，显示重试按钮
                  </span>
                )}
                {scenario === 'non-retryable' && (
                  <span className="ml-2 text-red-600">
                    消息会撤回并回填到输入框，显示错误提示
                  </span>
                )}
              </div>
            </div>
            <ComposerWithSend
              conversationId="conv-1"
              channel={ChannelTypeEnum.WhatsApp}
            />
          </div>
        </ServiceProvider>
      </QueryClientProvider>
    );
  },
};

// 添加模板消息测试
export const TemplateMessageNonRetryableError: Story = {
  render: () => {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            mutations: {
              retry: false,
            },
            queries: {
              retry: false,
            },
          },
        }),
    );

    mockMessageService.setScenario('non-retryable');

    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          services={{
            messageService: mockMessageService,
          }}
        >
          <div className="w-full max-w-2xl">
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">
                场景：模板消息发送失败（配额限制）
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                此场景测试模板消息发送失败后的回填功能。模板内容会回填到输入框，
                并保留模板 ID，以便用户可以重新发送。
              </p>
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                <strong>测试步骤：</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>在输入框中输入消息内容（模拟模板内容）</li>
                  <li>点击发送按钮</li>
                  <li>观察消息是否撤回并回填到输入框</li>
                  <li>检查是否显示错误提示</li>
                </ol>
              </div>
            </div>
            <ComposerWithSend
              conversationId="conv-1"
              channel={ChannelTypeEnum.WhatsApp}
            />
          </div>
        </ServiceProvider>
      </QueryClientProvider>
    );
  },
};
