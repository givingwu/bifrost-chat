import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { IConversationService } from '@/services/conversation.service';
import { toChannel, toRecord } from '../utils/converter.util';

/**
 * FoxCollect 电催场景配置
 */
export interface FoxCollectConfig {
  endpoint: string;
  wsEndpoint: string;
  token: string;
  agentPin: string;
  app: string;
}

interface FoxCollectListParams {
  current?: number;
  pageSize?: number;
}

interface FoxCollectCreateParams {
  debtorId: string;
  contactId: string;
}

interface FoxCollectQueryParams {
  chatId?: string;
  conversationId?: string;
}

/**
 * FoxCollect 会话服务
 */
export class FoxCollectConversationService
  implements
    IConversationService<
      FoxCollectListParams,
      FoxCollectCreateParams,
      FoxCollectQueryParams
    >
{
  constructor(private readonly config: FoxCollectConfig) {}

  async list(params?: FoxCollectListParams): Promise<Conversation[]> {
    const payload = {
      app: this.config.app,
      pin: this.config.agentPin,
      clientVersion: '2.0.0',
      current: params?.current ?? 1,
      pageSize: params?.pageSize ?? 20,
    };

    const response = await fetch(
      `${this.config.endpoint}/bifrost-hermod/chat/list`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const result = toRecord(await response.json());
    const data = Array.isArray(result.data) ? result.data : [];

    return data.map((raw): Conversation => {
      const item = toRecord(raw);
      const lastMessage = toRecord(item.lastMessage);
      const lastBody = toRecord(lastMessage.body);
      const lastContent = toRecord(lastBody.content);

      const pin = String(item.pin ?? '');
      const sid = String(item.sid ?? '');
      const name = String(item.name ?? (pin || sid || 'Unknown'));
      const lastTime = typeof item.time === 'number' ? item.time : Date.now();

      return {
        id: sid,
        user: {
          id: pin,
          name,
          avatarUrl: `https://i.pravatar.cc/150?u=${pin}`,
          status: AgentStatusEnum.Online,
        },
        lastMessage: String(lastContent.text ?? ''),
        lastMessageTime: new Date(lastTime).toISOString(),
        unreadCount: item.newUnreadCount ? 1 : 0,
        channel: toChannel(toRecord(lastMessage.from).channelType),
        isActive: false,
        metadata: {
          sid,
          app: item.app,
          pin,
          subjectId: item.subjectId,
          time: lastTime,
          newUnreadCount: item.newUnreadCount,
        },
      };
    });
  }

  async get(conversationId: string): Promise<Conversation | null> {
    const response = await fetch(
      `${this.config.endpoint}/chat/v2/session/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          chatId: conversationId,
          customerPin: '',
          channel: 'whatsapp',
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }

    const result = toRecord(await response.json());
    if (result.code !== 0) {
      throw new Error(String(result.message ?? 'Failed to query conversation'));
    }

    const data = toRecord(result.data);
    const chatId = String(data.chatId ?? conversationId);
    const customerPin = String(data.customerPin ?? '');

    return {
      id: chatId,
      user: {
        id: customerPin,
        name: customerPin || 'Unknown',
        avatarUrl: `https://i.pravatar.cc/150?u=${customerPin}`,
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
      metadata: {
        chatId,
        agentPin: data.agentPin,
        lastAgentPin: data.lastAgentPin,
        customerPin,
        debtorId: data.debtorId,
        assetItemNumber: data.assetItemNumber,
      },
    };
  }

  async create(params: FoxCollectCreateParams): Promise<Conversation> {
    const response = await fetch(
      `${this.config.endpoint}/chat/v2/session/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          debtorId: params.debtorId,
          contactId: params.contactId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const result = toRecord(await response.json());
    if (result.code !== 0) {
      throw new Error(
        String(result.message ?? 'Failed to create conversation'),
      );
    }

    const data = toRecord(result.data);
    const chatId = String(data.chatId ?? '');
    const customerPin = String(data.customerPin ?? '');

    return {
      id: chatId,
      user: {
        id: customerPin,
        name: customerPin || 'Unknown',
        avatarUrl: `https://i.pravatar.cc/150?u=${customerPin}`,
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
      metadata: {
        chatId,
        agentPin: data.agentPin,
        customerPin,
        debtorId: data.debtorId,
        assetItemNumber: data.assetItemNumber,
      },
    };
  }

  async query(params: FoxCollectQueryParams): Promise<Conversation | null> {
    const conversationId = params.chatId ?? params.conversationId;
    if (!conversationId) {
      return null;
    }
    return this.get(conversationId);
  }
}
