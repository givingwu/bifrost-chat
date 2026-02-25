import type { Meta, StoryObj } from '@storybook/react';
import { DefaultChatLayout } from '@/components';
import { QueryProvider } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { FoxCollectConfig } from './services/FoxCollectConversation.service';
import { FoxCollectConversationService } from './services/FoxCollectConversation.service';
import { FoxCollectMessageService } from './services/FoxCollectMessage.service';
import { FoxCollectTemplateService } from './services/FoxCollectTemplate.service';

/**
 * FoxCollect 电催场景 Storybook
 *
 * 展示 Bifrost-Chat SDK 在电催场景中的完整集成
 *
 * 场景特点：
 * - Session ID = 债务 ID
 * - from.app = fox_collect.waiter（坐席）
 * - to.app = im.waiter（用户）
 * - entry = fox.collect.detail
 * - 支持多渠道（WhatsApp、SMS、Email）
 * - 频次检查（防止过度骚扰）
 */

const meta: Meta<typeof DefaultChatLayout> = {
  title: 'Integration/FoxCollect',
  component: DefaultChatLayout,
  tags: ['integration', 'fox-collect'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: 'FoxCollect 电催场景完整集成示例',
    },
  },
  decorators: [
    (Story) => {
      // 创建服务配置
      const config: FoxCollectConfig = {
        endpoint: '/api',
        wsEndpoint: '/ws',
        token: 'demo-token',
        agentPin: 'agent-123',
        app: 'fox_collect.waiter',
      };

      // 创建服务实例
      const conversationService = new FoxCollectConversationService(config);
      const messageService = new FoxCollectMessageService(config);
      const templateService = new FoxCollectTemplateService(config);

      return (
        <QueryProvider>
          <ServiceProvider
            conversationService={conversationService}
            messageService={messageService}
            templateService={templateService}
          >
            <Story />
          </ServiceProvider>
        </QueryProvider>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof DefaultChatLayout>;

/**
 * Basic Story - 基础布局
 *
 * 展示 FoxCollect 场景的完整聊天界面
 */
export const Basic: Story = {
  name: '基础布局',
  args: {},
};

/**
 * WithMessageList Story - 带消息列表
 *
 * 展示完整的消息列表和发送功能
 */
export const WithMessageList: Story = {
  name: '带消息列表',
  args: {},
};

/**
 * WhatsAppChannel Story - WhatsApp 渠道
 *
 * 展示 WhatsApp 渠道的消息发送
 */
export const WhatsAppChannel: Story = {
  name: 'WhatsApp 渠道',
  args: {},
};

/**
 * SMSChannel Story - SMS 渠道
 *
 * 展示 SMS 渠道的消息发送
 */
export const SMSChannel: Story = {
  name: 'SMS 渠道',
  args: {},
};

/**
 * EmailChannel Story - Email 渠道
 *
 * 展示 Email 渠道的消息发送
 */
export const EmailChannel: Story = {
  name: 'Email 渠道',
  args: {},
};

/**
 * MessageStatuses Story - 消息状态展示
 *
 * 展示各种消息状态（发送中、已发送、已送达、已读、失败）
 */
export const MessageStatuses: Story = {
  name: '消息状态展示',
  args: {},
};

/**
 * TemplateSelection Story - 模板选择与发送
 *
 * 展示模板选择和发送功能
 */
export const TemplateSelection: Story = {
  name: '模板选择与发送',
  args: {},
};

/**
 * NetworkStatus Story - 网络状态展示
 *
 * 展示 WebSocket 连接状态和网络状态
 */
export const NetworkStatus: Story = {
  name: '网络状态展示',
  args: {},
};
