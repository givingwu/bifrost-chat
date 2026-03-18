import { describe, expect, it } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  conversationMatchesQuery,
  filterConversations,
} from './conversation-filter.util';

describe('conversation-filter.util', () => {
  const createMockConversation = (
    overrides: Partial<Conversation> = {},
  ): Conversation => ({
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: 'John Doe',
      status: AgentStatusEnum.Online,
    },
    lastMessage: 'Hello world',
    lastMessageTime: '2024-01-01T00:00:00Z',
    unreadCount: 0,
    channel: ChannelTypeEnum.WhatsApp,
    ...overrides,
  });

  describe('conversationMatchesQuery', () => {
    it('should match by user name', () => {
      const conversation = createMockConversation();
      expect(conversationMatchesQuery(conversation, 'john')).toBe(true);
      expect(conversationMatchesQuery(conversation, 'doe')).toBe(true);
      expect(conversationMatchesQuery(conversation, 'JOHN')).toBe(true);
    });

    it('should match by last message', () => {
      const conversation = createMockConversation();
      expect(conversationMatchesQuery(conversation, 'hello')).toBe(true);
      expect(conversationMatchesQuery(conversation, 'world')).toBe(true);
    });

    it('should match by conversation id', () => {
      const conversation = createMockConversation();
      expect(conversationMatchesQuery(conversation, 'conv-1')).toBe(true);
      expect(conversationMatchesQuery(conversation, 'CONV-1')).toBe(true);
    });

    it('should match by phone (metadata.pin)', () => {
      const conversation = createMockConversation({
        metadata: { pin: '13800138000' },
      });
      expect(conversationMatchesQuery(conversation, '13800')).toBe(true);
    });

    it('should match by subjectId', () => {
      const conversation = createMockConversation({
        metadata: { subjectId: 'ASSET-12345' },
      });
      expect(conversationMatchesQuery(conversation, 'asset')).toBe(true);
      expect(conversationMatchesQuery(conversation, '12345')).toBe(true);
    });

    it('should not match when query does not match any field', () => {
      const conversation = createMockConversation();
      expect(conversationMatchesQuery(conversation, 'nonexistent')).toBe(false);
    });

    it('should respect search options', () => {
      const conversation = createMockConversation({
        metadata: { pin: '13800138000' },
      });

      // Disable phone search
      expect(
        conversationMatchesQuery(conversation, '13800', {
          searchPhone: false,
        }),
      ).toBe(false);

      // Enable phone search (default)
      expect(
        conversationMatchesQuery(conversation, '13800', {
          searchPhone: true,
        }),
      ).toBe(true);
    });

    it('should support custom fields', () => {
      const conversation = createMockConversation({
        metadata: { orderId: 'ORDER-999' },
      });

      expect(
        conversationMatchesQuery(conversation, 'order-999', {
          customFields: (conv) => [conv.metadata?.orderId as string],
        }),
      ).toBe(true);

      expect(
        conversationMatchesQuery(conversation, 'nonexistent', {
          customFields: (conv) => [conv.metadata?.orderId as string],
        }),
      ).toBe(false);
    });

    it('should handle undefined user name', () => {
      const conversation = createMockConversation({
        user: {
          id: 'user-1',
          name: undefined as unknown as string,
          status: AgentStatusEnum.Online,
        },
      });
      expect(conversationMatchesQuery(conversation, 'john')).toBe(false);
    });
  });

  describe('filterConversations', () => {
    it('should return original array when search query is empty', () => {
      const conversations = [
        createMockConversation({ id: 'conv-1' }),
        createMockConversation({ id: 'conv-2' }),
      ];
      expect(filterConversations(conversations, '')).toBe(conversations);
    });

    it('should return original array when search query is only whitespace', () => {
      const conversations = [
        createMockConversation({ id: 'conv-1' }),
        createMockConversation({ id: 'conv-2' }),
      ];
      expect(filterConversations(conversations, '   ')).toBe(conversations);
    });

    it('should filter conversations by query', () => {
      const conversations = [
        createMockConversation({
          id: 'conv-1',
          user: { id: 'u1', name: 'Alice', status: AgentStatusEnum.Online },
        }),
        createMockConversation({
          id: 'conv-2',
          user: { id: 'u2', name: 'Bob', status: AgentStatusEnum.Online },
        }),
        createMockConversation({
          id: 'conv-3',
          user: { id: 'u3', name: 'Charlie', status: AgentStatusEnum.Online },
        }),
      ];

      const result = filterConversations(conversations, 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('Alice');
    });

    it('should return empty array when no matches', () => {
      const conversations = [
        createMockConversation({
          id: 'conv-1',
          user: { id: 'u1', name: 'Alice', status: AgentStatusEnum.Online },
        }),
      ];

      const result = filterConversations(conversations, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should return all matching conversations', () => {
      const conversations = [
        createMockConversation({
          id: 'conv-1',
          user: { id: 'u1', name: 'Alice', status: AgentStatusEnum.Online },
        }),
        createMockConversation({
          id: 'conv-2',
          user: { id: 'u2', name: 'Bob', status: AgentStatusEnum.Online },
        }),
        createMockConversation({
          id: 'conv-3',
          user: {
            id: 'u3',
            name: 'Alice Smith',
            status: AgentStatusEnum.Online,
          },
        }),
      ];

      const result = filterConversations(conversations, 'alice');
      expect(result).toHaveLength(2);
    });

    it('should pass options to conversationMatchesQuery', () => {
      const conversations = [
        createMockConversation({
          id: 'conv-1',
          user: { id: 'u1', name: 'Alice', status: AgentStatusEnum.Online },
          metadata: { pin: '13800138000' },
        }),
        createMockConversation({
          id: 'conv-2',
          user: { id: 'u2', name: 'Bob', status: AgentStatusEnum.Online },
          metadata: { pin: '13900139000' },
        }),
      ];

      // Search only by phone, not by name
      const result = filterConversations(conversations, '13800', {
        searchUserName: false,
        searchLastMessage: false,
        searchConversationId: false,
        searchSubjectId: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('Alice');
    });
  });
});
