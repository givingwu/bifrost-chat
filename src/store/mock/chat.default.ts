import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type { ProfileData } from '@/interfaces/profile.interface';
import type { Template } from '@/interfaces/template.interface';

export const defaultConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: 'Liam Walker',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      status: AgentStatusEnum.Online,
    },
    lastMessage: 'Thanks for the update! 👋',
    lastMessageTime: '09:42 AM',
    unreadCount: 2,
    channel: ChannelTypeEnum.WhatsApp,
    isActive: true,
  },
  {
    id: 'conv-2',
    user: {
      id: 'user-2',
      name: 'Sophia Reed',
      avatarUrl: 'https://i.pravatar.cc/150?img=48',
      status: AgentStatusEnum.Busy,
    },
    lastMessage: 'Need help with my order.',
    lastMessageTime: '09:10 AM',
    unreadCount: 0,
    channel: ChannelTypeEnum.SMS,
  },
  {
    id: 'conv-3',
    user: {
      id: 'user-3',
      name: 'Evelyn Carter',
      avatarUrl: 'https://i.pravatar.cc/150?img=16',
      status: AgentStatusEnum.Offline,
    },
    lastMessage: 'Invoice sent via email.',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    channel: ChannelTypeEnum.Email,
  },
];

export const defaultMessages: StandardMessage[] = [
  {
    id: 'msg-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp: Date.now() - 1000 * 60 * 60,
    type: MessageTypeEnum.Text,
    content: { text: 'Hi! I need help with my order.' },
  },
  {
    id: 'msg-2',
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Delivered,
    timestamp: Date.now() - 1000 * 60 * 45,
    type: MessageTypeEnum.Text,
    content: { text: 'Sure! Can you share your order ID?' },
  },
  {
    id: 'msg-3',
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Read,
    timestamp: Date.now() - 1000 * 60 * 30,
    type: MessageTypeEnum.Template,
    content: {
      text: JSON.stringify({
        title: 'Order Update',
        description: 'Your order has been shipped via FedEx.',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
        buttons: ['Track Package', 'View Details'],
      }),
    },
  },
  {
    id: 'msg-4',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp: Date.now() - 1000 * 60 * 20,
    type: MessageTypeEnum.Text,
    content: { text: 'Thanks! That helps a lot.' },
  },
];

export const defaultProfile: ProfileData = {
  name: 'Liam Walker',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  role: 'Customer',
  email: 'liam.walker@example.com',
  phone: '+1 (555) 123-4567',
  localTime: '10:45 AM',
};

export const defaultTemplates: Template[] = [
  {
    id: 'tpl-1',
    name: '问候',
    content: 'Hi, how can I help you today?',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'tpl-2',
    name: '发货通知',
    content: 'Your order #12345 has been shipped.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'tpl-3',
    name: '邮箱验证',
    content: 'Could you please verify your email?',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'tpl-4',
    name: '感谢',
    content: 'Thank you for contacting support.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
