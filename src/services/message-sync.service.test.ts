// cspell:disable
// cspell:words conv cust
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { StandardMessage } from '@/interfaces/message.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';
import { MessageSyncService } from './message-sync.service';

describe('MessageSyncService', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  function createMessage(
    id: string,
    options?: Partial<StandardMessage>,
  ): StandardMessage {
    return {
      id,
      conversationId: 'conv-1',
      tempId: options?.tempId,
      direction: MessageDirectionEnum.Incoming,
      channelType: ChannelTypeEnum.WhatsApp,
      status: MessageStatusEnum.Sent,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: `msg-${id}` },
      sender: { app: 'sender-app', pin: 'sender-pin' },
      receiver: { app: 'receiver-app', pin: 'receiver-pin' },
      ...options,
    };
  }

  it('应在收到新消息事件时调用 addMessageToCache', () => {
    const addMessageSpy = vi.spyOn(MessageCacheHelper, 'addMessageToCache');

    const syncService = new MessageSyncService(queryClient);

    const message = createMessage('msg-1');

    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message,
    });

    expect(addMessageSpy).toHaveBeenCalledWith(queryClient, 'conv-1', message, {
      channel: ChannelTypeEnum.WhatsApp,
    });
  });

  it('应在收到陌生会话消息时构造临时会话并插入列表顶部', () => {
    const syncService = new MessageSyncService(queryClient);

    queryClient.setQueryData<Conversation[]>(queryKeys.conversations.list(), [
      {
        id: 'conv-existing',
        user: {
          id: 'existing-user',
          name: '已有会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '旧消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 2,
        channel: ChannelTypeEnum.SMS,
      },
    ]);

    const message = createMessage('msg-new-conversation', {
      conversationId: 'conv-new',
      timestamp: 1_770_000_004_000,
      content: { text: '新会话第一条消息' },
      sender: {
        app: 'customer-app',
        pin: '13900000000',
      },
      metadata: {
        senderName: '新客户',
      },
    });

    syncService.pushNewMessage({
      conversationId: 'conv-new',
      message,
    });

    const conversations = queryClient.getQueryData<Conversation[]>(
      queryKeys.conversations.list(),
    );

    expect(conversations?.map((item) => item.id)).toEqual([
      'conv-new',
      'conv-existing',
    ]);
    expect(conversations?.[0]).toMatchObject({
      id: 'conv-new',
      lastMessage: '新会话第一条消息',
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      user: {
        id: '13900000000',
        name: '新客户',
      },
    });
  });

  it('应在已有会话收到新消息时刷新摘要并提升到列表顶部', () => {
    const syncService = new MessageSyncService(queryClient);

    queryClient.setQueryData<Conversation[]>(queryKeys.conversations.list(), [
      {
        id: 'conv-other',
        user: {
          id: 'other-user',
          name: '其他会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '其他旧消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 1,
        channel: ChannelTypeEnum.SMS,
      },
      {
        id: 'conv-1',
        user: {
          id: 'sender-pin',
          name: '已知客户',
          avatarUrl: 'https://example.com/avatar.png',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '老消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 9,
        channel: ChannelTypeEnum.WhatsApp,
        supportedChannels: [ChannelTypeEnum.WhatsApp],
      },
    ]);

    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message: createMessage('msg-refresh', {
        timestamp: 1_770_000_005_000,
        content: { text: '会话有新动态' },
        channelType: ChannelTypeEnum.Email,
        sender: {
          app: 'sender-app',
          pin: 'sender-pin',
        },
      }),
    });

    const conversations = queryClient.getQueryData<Conversation[]>(
      queryKeys.conversations.list(),
    );

    expect(conversations?.[0]).toMatchObject({
      id: 'conv-1',
      lastMessage: '会话有新动态',
      unreadCount: 9,
      channel: ChannelTypeEnum.Email,
      user: {
        id: 'sender-pin',
        name: '已知客户',
        avatarUrl: 'https://example.com/avatar.png',
        status: AgentStatusEnum.Online,
      },
      supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
    });
  });

  it('应在收到状态事件时更新已存在消息', () => {
    const updateSpy = vi.spyOn(MessageCacheHelper, 'updateMessageInCache');

    const syncService = new MessageSyncService(queryClient);

    syncService.updateMessageStatus({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      tempId: 'tmp-1',
      status: MessageStatusEnum.Delivered,
      timestamp: Date.now(),
    });

    expect(updateSpy).toHaveBeenNthCalledWith(
      1,
      queryClient,
      'conv-1',
      {
        id: 'msg-1',
        tempId: 'tmp-1',
        status: MessageStatusEnum.Delivered,
      },
      'msg-1',
      'tmp-1',
    );
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('状态事件包含 channelType 时应同步更新按渠道分片缓存', () => {
    const updateSpy = vi.spyOn(MessageCacheHelper, 'updateMessageInCache');

    const syncService = new MessageSyncService(queryClient);

    syncService.updateMessageStatus({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      tempId: 'tmp-1',
      status: MessageStatusEnum.Delivered,
      timestamp: Date.now(),
      channelType: ChannelTypeEnum.WhatsApp,
    });

    expect(updateSpy).toHaveBeenNthCalledWith(
      1,
      queryClient,
      'conv-1',
      {
        id: 'msg-1',
        tempId: 'tmp-1',
        status: MessageStatusEnum.Delivered,
      },
      'msg-1',
      'tmp-1',
    );
    expect(updateSpy).toHaveBeenNthCalledWith(
      2,
      queryClient,
      'conv-1',
      {
        id: 'msg-1',
        tempId: 'tmp-1',
        status: MessageStatusEnum.Delivered,
      },
      'msg-1',
      'tmp-1',
      { channel: ChannelTypeEnum.WhatsApp },
    );
  });

  it('状态事件携带 error 时应一并更新消息错误信息', () => {
    const updateSpy = vi.spyOn(MessageCacheHelper, 'updateMessageInCache');

    const syncService = new MessageSyncService(queryClient);

    syncService.updateMessageStatus({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      status: MessageStatusEnum.Failed,
      error: 'provider rejected',
      timestamp: Date.now(),
    });

    expect(updateSpy).toHaveBeenNthCalledWith(
      1,
      queryClient,
      'conv-1',
      {
        id: 'msg-1',
        tempId: undefined,
        status: MessageStatusEnum.Failed,
        error: 'provider rejected',
      },
      'msg-1',
      undefined,
    );
  });

  it('状态事件缺失 channelType 时不应更新分片缓存', () => {
    const updateSpy = vi.spyOn(MessageCacheHelper, 'updateMessageInCache');

    const syncService = new MessageSyncService(queryClient);

    syncService.updateMessageStatus({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      tempId: 'tmp-1',
      status: MessageStatusEnum.Delivered,
      timestamp: Date.now(),
    });

    expect(updateSpy).toHaveBeenNthCalledWith(
      1,
      queryClient,
      'conv-1',
      {
        id: 'msg-1',
        tempId: 'tmp-1',
        status: MessageStatusEnum.Delivered,
      },
      'msg-1',
      'tmp-1',
    );
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('状态回调不应新增重复模板消息，只应更新现有消息', () => {
    const templateMessage = createMessage('tpl-1', {
      type: MessageTypeEnum.Template,
      tempId: 'temp-tpl-1',
      status: MessageStatusEnum.Sending,
      content: {
        text: '模板消息',
        templateId: 'tpl-id-1',
        params: { name: 'A' },
      },
    });

    // updateMessageStatus 无 channel，写入无 channel 的缓存
    queryClient.setQueryData(queryKeys.messages.list('conv-1'), {
      pages: [{ items: [templateMessage] }],
      pageParams: [undefined],
    });

    const syncService = new MessageSyncService(queryClient);

    syncService.updateMessageStatus({
      conversationId: 'conv-1',
      messageId: 'tpl-1',
      tempId: 'temp-tpl-1',
      status: MessageStatusEnum.Delivered,
      timestamp: Date.now(),
    });

    const data = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-1'));

    const items = data?.pages?.[0]?.items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('tpl-1');
    expect(items[0]?.status).toBe(MessageStatusEnum.Delivered);
    expect(items[0]?.type).toBe(MessageTypeEnum.Template);
  });

  it('当第二次推送 id 或 tempId 重复时应去重并给出告警', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const syncService = new MessageSyncService(queryClient);

    const first = createMessage('cust-msg-1', { tempId: 'temp-c-1' });
    syncService.pushNewMessage({ conversationId: 'conv-1', message: first });

    const duplicateById = createMessage('cust-msg-1', { tempId: 'temp-c-2' });
    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message: duplicateById,
    });

    const duplicateByTempId = createMessage('cust-msg-2', {
      tempId: 'temp-c-1',
    });
    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message: duplicateByTempId,
    });

    // pushNewMessage 使用 message.channelType 写入带 channel 的缓存
    const messageQueryKey = queryKeys.messages.list(
      'conv-1',
      ChannelTypeEnum.WhatsApp,
    );
    const data = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(messageQueryKey);

    const items = data?.pages?.[0]?.items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('cust-msg-1');
    expect(items[0]?.tempId).toBe('temp-c-1');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('当第二次推送消息 id 与 tempId 都唯一时应正常显示', () => {
    const syncService = new MessageSyncService(queryClient);

    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message: createMessage('cust-msg-1', { tempId: 'temp-c-1' }),
    });

    syncService.pushNewMessage({
      conversationId: 'conv-1',
      message: createMessage('cust-msg-2', { tempId: 'temp-c-2' }),
    });

    // pushNewMessage 使用 message.channelType 写入带 channel 的缓存
    const messageQueryKey = queryKeys.messages.list(
      'conv-1',
      ChannelTypeEnum.WhatsApp,
    );
    const data = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(messageQueryKey);

    const items = data?.pages?.[0]?.items ?? [];
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual(['cust-msg-1', 'cust-msg-2']);
  });
});
