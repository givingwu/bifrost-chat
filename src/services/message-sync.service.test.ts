// cspell:disable
// cspell:words conv cust
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
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

    expect(addMessageSpy).toHaveBeenCalledWith(queryClient, 'conv-1', message);
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

    expect(updateSpy).toHaveBeenCalledWith(
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

    const data = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-1'));

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

    const data = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-1'));

    const items = data?.pages?.[0]?.items ?? [];
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual(['cust-msg-1', 'cust-msg-2']);
  });
});
