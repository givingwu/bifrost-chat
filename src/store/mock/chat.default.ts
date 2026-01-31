import { AgentStatus } from '@/interfaces/agent.interface';
import { ChannelType } from '@/interfaces/channel.interface';
import type {
  ContextPanelProfile,
  ContextTemplateItem,
} from '@/interfaces/context.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
  type StandardMessage,
} from '@/interfaces/message.interface';

export const defaultConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: 'Liam Walker',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      status: AgentStatus.Online,
    },
    lastMessage: 'Thanks for the update! 👋',
    lastMessageTime: '09:42 AM',
    unreadCount: 2,
    channel: ChannelType.WhatsApp,
    isActive: true,
  },
  {
    id: 'conv-2',
    user: {
      id: 'user-2',
      name: 'Sophia Reed',
      avatarUrl: 'https://i.pravatar.cc/150?img=48',
      status: AgentStatus.Busy,
    },
    lastMessage: 'Need help with my order.',
    lastMessageTime: '09:10 AM',
    unreadCount: 0,
    channel: ChannelType.SMS,
  },
  {
    id: 'conv-3',
    user: {
      id: 'user-3',
      name: 'Evelyn Carter',
      avatarUrl: 'https://i.pravatar.cc/150?img=16',
      status: AgentStatus.Offline,
    },
    lastMessage: 'Invoice sent via email.',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    channel: ChannelType.Email,
  },
];

export const defaultMessages: StandardMessage[] = [
  {
    id: 'msg-1',
    direction: MessageDirection.Incoming,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Sent,
    timestamp: Date.now() - 1000 * 60 * 60,
    type: MessageType.Text,
    content: { text: 'Hi! I need help with my order.' },
  },
  {
    id: 'msg-2',
    direction: MessageDirection.Outgoing,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Delivered,
    timestamp: Date.now() - 1000 * 60 * 45,
    type: MessageType.Text,
    content: { text: 'Sure! Can you share your order ID?' },
  },
  {
    id: 'msg-3',
    direction: MessageDirection.Outgoing,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Read,
    timestamp: Date.now() - 1000 * 60 * 30,
    type: MessageType.Template,
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
    direction: MessageDirection.Incoming,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Sent,
    timestamp: Date.now() - 1000 * 60 * 20,
    type: MessageType.Text,
    content: { text: 'Thanks! That helps a lot.' },
  },
];

export const defaultProfile: ContextPanelProfile = {
  name: 'Liam Walker',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  role: 'Customer',
  email: 'liam.walker@example.com',
  phone: '+1 (555) 123-4567',
  localTime: '10:45 AM',
};

export const defaultTemplates: ContextTemplateItem[] = [
  { id: 'tpl-1', content: 'Hi, how can I help you today?' },
  { id: 'tpl-2', content: 'Your order #12345 has been shipped.' },
  { id: 'tpl-3', content: 'Could you please verify your email?' },
  { id: 'tpl-4', content: 'Thank you for contacting support.' },
];
