import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StandardMessage } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';

describe('MessageCacheHelper', () => {
  let queryClient: QueryClient;
  const conversationId = 'conv-123';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('messageExists', () => {
    it('应该通过 id 判断消息存在', () => {
      const messages: StandardMessage[] = [
        { id: 'msg-1', tempId: 'temp-1' } as StandardMessage,
        { id: 'msg-2', tempId: 'temp-2' } as StandardMessage,
      ];

      const newMessage = { id: 'msg-1', tempId: 'temp-999' } as StandardMessage;

      expect(MessageCacheHelper.messageExists(messages, newMessage)).toBe(true);
    });

    it('应该通过 tempId 判断消息存在', () => {
      const messages: StandardMessage[] = [
        { id: 'msg-1', tempId: 'temp-1' } as StandardMessage,
        { id: 'msg-2', tempId: 'temp-2' } as StandardMessage,
      ];

      const newMessage = { id: 'msg-999', tempId: 'temp-1' } as StandardMessage;

      expect(MessageCacheHelper.messageExists(messages, newMessage)).toBe(true);
    });

    it('应该返回 false 当消息不存在时', () => {
      const messages: StandardMessage[] = [
        { id: 'msg-1', tempId: 'temp-1' } as StandardMessage,
      ];

      const newMessage = {
        id: 'msg-999',
        tempId: 'temp-999',
      } as StandardMessage;

      expect(MessageCacheHelper.messageExists(messages, newMessage)).toBe(
        false,
      );
    });
  });

  describe('addMessageToCache', () => {
    it('应该添加消息到空缓存', () => {
      const message = {
        id: 'msg-1',
        tempId: 'temp-1',
      } as StandardMessage;

      MessageCacheHelper.addMessageToCache(
        queryClient,
        conversationId,
        message,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data).toEqual({
        pages: [{ items: [message] }],
        pageParams: [undefined],
      });
    });

    it('应该添加消息到现有缓存的最后一页', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          { items: [{ id: 'msg-1' } as StandardMessage] },
          { items: [{ id: 'msg-2' } as StandardMessage] },
        ],
        pageParams: [1, 2],
      });

      const newMessage = { id: 'msg-3' } as StandardMessage;

      MessageCacheHelper.addMessageToCache(
        queryClient,
        conversationId,
        newMessage,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data).toEqual({
        pages: [
          { items: [{ id: 'msg-1' }] },
          { items: [{ id: 'msg-2' }, { id: 'msg-3' }] },
        ],
        pageParams: [1, 2],
      });
    });

    it('应该避免添加重复消息（通过 id）', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [{ items: [{ id: 'msg-1' } as StandardMessage] }],
        pageParams: [undefined],
      });

      const duplicateMessage = {
        id: 'msg-1',
        tempId: 'temp-999',
      } as StandardMessage;

      MessageCacheHelper.addMessageToCache(
        queryClient,
        conversationId,
        duplicateMessage,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      // 应该保持不变
      expect(data).toEqual({
        pages: [{ items: [{ id: 'msg-1' }] }],
        pageParams: [undefined],
      });
    });

    it('应该避免添加重复消息（通过 tempId）', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          { items: [{ id: 'msg-1', tempId: 'temp-1' } as StandardMessage] },
        ],
        pageParams: [undefined],
      });

      const duplicateMessage = {
        id: 'msg-999',
        tempId: 'temp-1',
      } as StandardMessage;

      MessageCacheHelper.addMessageToCache(
        queryClient,
        conversationId,
        duplicateMessage,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      // 应该保持不变
      expect(data).toEqual({
        pages: [{ items: [{ id: 'msg-1', tempId: 'temp-1' }] }],
        pageParams: [undefined],
      });
    });
  });

  describe('updateMessageInCache', () => {
    it('应该通过 messageId 更新消息', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                status: MessageStatusEnum.Sending,
              } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      MessageCacheHelper.updateMessageInCache(
        queryClient,
        conversationId,
        { status: MessageStatusEnum.Sent },
        'msg-1',
        undefined,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data).toEqual({
        pages: [
          {
            items: [{ id: 'msg-1', status: MessageStatusEnum.Sent }],
          },
        ],
        pageParams: [undefined],
      });
    });

    it('应该通过 tempId 更新消息', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                tempId: 'temp-1',
                status: MessageStatusEnum.Sending,
              } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      MessageCacheHelper.updateMessageInCache(
        queryClient,
        conversationId,
        { status: MessageStatusEnum.Sent },
        undefined,
        'temp-1',
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data).toEqual({
        pages: [
          {
            items: [
              { id: 'msg-1', tempId: 'temp-1', status: MessageStatusEnum.Sent },
            ],
          },
        ],
        pageParams: [undefined],
      });
    });

    it('应该更新多个字段', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                status: MessageStatusEnum.Sending,
                timestamp: 1000,
              } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      MessageCacheHelper.updateMessageInCache(
        queryClient,
        conversationId,
        {
          status: MessageStatusEnum.Sent,
          timestamp: 2000,
        },
        'msg-1',
        undefined,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data).toEqual({
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                status: MessageStatusEnum.Sent,
                timestamp: 2000,
              },
            ],
          },
        ],
        pageParams: [undefined],
      });
    });
  });

  describe('updateMessageStatus', () => {
    it('应该更新消息状态', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                status: MessageStatusEnum.Sending,
              } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      MessageCacheHelper.updateMessageStatus(
        queryClient,
        conversationId,
        MessageStatusEnum.Sent,
        'msg-1',
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data?.pages[0].items[0].status).toBe(MessageStatusEnum.Sent);
    });
  });

  describe('replaceTempMessageWithRealMessage', () => {
    it('应该替换临时消息为真实消息', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              {
                id: 'msg-1',
                tempId: 'temp-1',
                status: MessageStatusEnum.Sending,
              } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      const realMessage = {
        id: 'msg-real-1',
        tempId: 'temp-1',
        status: MessageStatusEnum.Sent,
      } as StandardMessage;

      MessageCacheHelper.replaceTempMessageWithRealMessage(
        queryClient,
        conversationId,
        'temp-1',
        realMessage,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data?.pages[0].items[0]).toEqual(realMessage);
    });
  });

  describe('addMessagesToCache', () => {
    it('应该批量添加消息并去重', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [{ items: [{ id: 'msg-1' } as StandardMessage] }],
        pageParams: [undefined],
      });

      const newMessages = [
        { id: 'msg-2' } as StandardMessage,
        { id: 'msg-3' } as StandardMessage,
        { id: 'msg-1' } as StandardMessage, // 重复
      ];

      MessageCacheHelper.addMessagesToCache(
        queryClient,
        conversationId,
        newMessages,
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      // 应该只有 3 条消息（msg-1, msg-2, msg-3）
      expect(data?.pages[0].items.length).toBe(3);
    });
  });

  describe('removeMessageFromCache', () => {
    it('应该从缓存中删除消息', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          {
            items: [
              { id: 'msg-1' } as StandardMessage,
              { id: 'msg-2' } as StandardMessage,
              { id: 'msg-3' } as StandardMessage,
            ],
          },
        ],
        pageParams: [undefined],
      });

      MessageCacheHelper.removeMessageFromCache(
        queryClient,
        conversationId,
        'msg-2',
      );

      const data = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      expect(data?.pages[0].items).toEqual([{ id: 'msg-1' }, { id: 'msg-3' }]);
    });
  });

  describe('getAllMessagesFromCache', () => {
    it('应该返回所有消息的扁平化列表', () => {
      // 初始化缓存
      queryClient.setQueryData(queryKeys.messages.list(conversationId), {
        pages: [
          { items: [{ id: 'msg-1' } as StandardMessage] },
          { items: [{ id: 'msg-2' } as StandardMessage] },
        ],
        pageParams: [1, 2],
      });

      const messages = MessageCacheHelper.getAllMessagesFromCache(
        queryClient,
        conversationId,
      );

      expect(messages).toEqual([{ id: 'msg-1' }, { id: 'msg-2' }]);
    });

    it('应该返回空数组当缓存不存在时', () => {
      const messages = MessageCacheHelper.getAllMessagesFromCache(
        queryClient,
        conversationId,
      );

      expect(messages).toEqual([]);
    });
  });

  describe('findMessageInInfiniteData', () => {
    it('应该通过 messageId 查找消息', () => {
      const data = {
        pages: [
          {
            items: [
              { id: 'msg-1' } as StandardMessage,
              { id: 'msg-2' } as StandardMessage,
            ],
          },
          {
            items: [{ id: 'msg-3' } as StandardMessage],
          },
        ],
        pageParams: [1, 2],
      };

      const result = MessageCacheHelper.findMessageInInfiniteData(
        data,
        'msg-2',
      );

      expect(result).toEqual({
        message: { id: 'msg-2' },
        pageIndex: 0,
        itemIndex: 1,
      });
    });

    it('应该通过 tempId 查找消息', () => {
      const data = {
        pages: [
          {
            items: [{ id: 'msg-1', tempId: 'temp-1' } as StandardMessage],
          },
        ],
        pageParams: [1],
      };

      const result = MessageCacheHelper.findMessageInInfiniteData(
        data,
        undefined,
        'temp-1',
      );

      expect(result).toEqual({
        message: { id: 'msg-1', tempId: 'temp-1' },
        pageIndex: 0,
        itemIndex: 0,
      });
    });

    it('应该返回 null 当消息不存在时', () => {
      const data = {
        pages: [
          {
            items: [{ id: 'msg-1' } as StandardMessage],
          },
        ],
        pageParams: [1],
      };

      const result = MessageCacheHelper.findMessageInInfiniteData(
        data,
        'msg-999',
      );

      expect(result).toBeNull();
    });
  });
});
