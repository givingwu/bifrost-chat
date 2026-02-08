import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { IComposerConfig } from '@/interfaces/composer.interface';
import {
  createNotImplementedServices,
  ServiceProvider,
} from '@/providers/service.provider';
import { useChatStore } from '@/store';
import { ComposerToolbar } from './ComposerToolbar';

const meta: Meta<typeof ComposerToolbar> = {
  title: 'Components/Composer/ComposerToolbar',
  component: ComposerToolbar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
输入框工具栏组件，支持草稿自动保存功能。

## 草稿功能

- **自动保存**：输入时自动保存到 localStorage（防抖 500ms）
- **自动恢复**：组件挂载时自动加载草稿
- **草稿提示**：检测到草稿时显示恢复/丢弃选项
- **发送清除**：发送成功后自动清除草稿

## 配置选项

通过 \`composerConfig\` 配置草稿行为：

- \`enableDraft\`: 是否启用草稿（默认 true）
- \`draftDebounceDelay\`: 防抖延迟（默认 500ms）
- \`clearDraftOnSend\`: 发送后清除（默认 true）
- \`keepDraftOnSwitch\`: 切换会话保留（默认 true）
        `,
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      // 设置 composer 配置
      const setComposerConfig = useChatStore(
        (state) => state.actions.setComposerConfig,
      );

      React.useEffect(() => {
        if ((args as { composerConfig?: IComposerConfig }).composerConfig) {
          setComposerConfig(
            (args as { composerConfig?: IComposerConfig }).composerConfig!,
          );
        }
      }, [
        (args as { composerConfig?: IComposerConfig }).composerConfig,
        setComposerConfig,
      ]);

      return (
        <ServiceProvider {...createNotImplementedServices()}>
          <div style={{ width: '600px' }}>
            <Story />
          </div>
        </ServiceProvider>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComposerToolbar>;

/**
 * 基础示例
 *
 * 默认启用草稿功能，输入内容会自动保存。
 */
export const Default: Story = {
  args: {
    conversationId: 'conv-123',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

/**
 * 带草稿恢复
 *
 * 模拟已有草稿的场景，显示草稿恢复提示。
 */
export const WithDraft: Story = {
  args: {
    conversationId: 'conv-456',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
  play: async () => {
    // 模拟保存草稿
    localStorage.setItem(
      'bifrost-chat-draft-conversation-456',
      'This is a saved draft message',
    );
  },
};

/**
 * 禁用草稿功能
 *
 * 通过配置禁用草稿自动保存。
 */
export const DisabledDraft: Story = {
  args: {
    conversationId: 'conv-789',
    channel: ChannelTypeEnum.WhatsApp,
    composerConfig: {
      enableDraft: false, // 禁用草稿
    },
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  } as Story['args'],
};

/**
 * 自定义防抖延迟
 *
 * 设置更长的防抖延迟（1秒）。
 */
export const CustomDebounce: Story = {
  args: {
    conversationId: 'conv-101',
    channel: ChannelTypeEnum.WhatsApp,
    composerConfig: {
      enableDraft: true,
      draftDebounceDelay: 1000, // 1秒防抖
    },
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  } as Story['args'],
};

/**
 * 发送后保留草稿
 *
 * 配置发送成功后不自动清除草稿。
 */
export const KeepDraftOnSend: Story = {
  args: {
    conversationId: 'conv-102',
    channel: ChannelTypeEnum.WhatsApp,
    composerConfig: {
      enableDraft: true,
      clearDraftOnSend: false, // 发送后不清除草稿
    },
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  } as Story['args'],
};

/**
 * SMS 渠道
 *
 * SMS 渠道有字符限制（160字符）。
 */
export const SMSChannel: Story = {
  args: {
    conversationId: 'conv-104',
    channel: ChannelTypeEnum.SMS,
    onSend: async (message) => {
      console.log('Sending SMS:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

/**
 * Email 渠道
 *
 * Email 渠道支持更长的消息。
 */
export const EmailChannel: Story = {
  args: {
    conversationId: 'conv-105',
    channel: ChannelTypeEnum.Email,
    onSend: async (message) => {
      console.log('Sending Email:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

/**
 * 禁用状态
 *
 * 展示禁用状态的输入框。
 */
export const Disabled: Story = {
  args: {
    conversationId: 'conv-106',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    disabled: true,
  },
};

/**
 * 加载状态
 *
 * 展示加载状态的输入框。
 */
export const Loading: Story = {
  args: {
    conversationId: 'conv-107',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    loading: true,
  },
};

/**
 * 模板锁定
 *
 * 展示模板内容锁定状态（不允许编辑）。
 */
export const TemplateLocked: Story = {
  args: {
    conversationId: 'conv-108',
    channel: ChannelTypeEnum.WhatsApp,
    onSend: async (message) => {
      console.log('Sending:', message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    templateLocked: true,
  },
};

/**
 * 多会话切换
 *
 * 模拟在不同会话间切换，每个会话有独立的草稿。
 */
export const MultiConversation: Story = {
  render: () => {
    const [conversationId, setConversationId] = React.useState('conv-109-a');

    return (
      <ServiceProvider {...createNotImplementedServices()}>
        <div style={{ width: '600px' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setConversationId('conv-109-a')}
              style={{
                padding: '0.5rem 1rem',
                background:
                  conversationId === 'conv-109-a' ? '#007bff' : '#e0e0e0',
                color: conversationId === 'conv-109-a' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              会话 A
            </button>
            <button
              type="button"
              onClick={() => setConversationId('conv-109-b')}
              style={{
                padding: '0.5rem 1rem',
                background:
                  conversationId === 'conv-109-b' ? '#007bff' : '#e0e0e0',
                color: conversationId === 'conv-109-b' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              会话 B
            </button>
          </div>
          <ComposerToolbar
            key={conversationId}
            conversationId={conversationId}
            channel={ChannelTypeEnum.WhatsApp}
            onSend={async (message) => {
              console.log('Sending:', message);
              await new Promise((resolve) => setTimeout(resolve, 500));
            }}
          />
        </div>
      </ServiceProvider>
    );
  },
};
