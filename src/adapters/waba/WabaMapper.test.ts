import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { WabaMapper } from './WabaMapper';

describe('WabaMapper', () => {
  const mapper = new WabaMapper();

  describe('outboundToDto', () => {
    it('should convert text message to WABA DTO', () => {
      const message = {
        id: '',
        tempId: 'temp_123',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: 'Hello, World!' },
        receiver: { id: '+1234567890', channelType: ChannelTypeEnum.Waba },
      };

      const dto = mapper.outboundToDto(message);

      expect(dto).toMatchObject({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'text',
        text: {
          body: 'Hello, World!',
          preview_url: false,
        },
      });
    });

    it('should convert image message to WABA DTO', () => {
      const message = {
        id: '',
        tempId: 'temp_123',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: MessageTypeEnum.Image,
        content: {
          url: 'https://example.com/image.jpg',
          mimeType: 'image/jpeg',
        },
        receiver: { id: '+1234567890', channelType: ChannelTypeEnum.Waba },
      };

      const dto = mapper.outboundToDto(message);

      expect(dto).toMatchObject({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'image',
        image: {
          link: 'https://example.com/image.jpg',
        },
      });
    });

    it('should throw error for unsupported message type', () => {
      const message = {
        id: '',
        tempId: 'temp_123',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: MessageTypeEnum.Other,
        content: { text: 'Unsupported' },
        receiver: { id: '+1234567890', channelType: ChannelTypeEnum.Waba },
      };

      expect(() => mapper.outboundToDto(message)).toThrow(
        'Unsupported message type for WABA',
      );
    });
  });

  describe('inboundToStandard', () => {
    it('should convert WABA inbound DTO to standard message', () => {
      const wabaDto = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp' as const,
                  metadata: {
                    display_phone_number: '+15551234567',
                    phone_number_id: 'phone_id_123',
                  },
                  contacts: [
                    {
                      profile: { name: 'John Doe' },
                      wa_id: '1234567890',
                    },
                  ],
                  messages: [
                    {
                      from: '1234567890',
                      id: 'msg_123',
                      timestamp: '1234567890',
                      type: 'text' as const,
                      text: { body: 'Hi there!' },
                    },
                  ],
                },
                field: 'messages' as const,
              },
            ],
          },
        ],
      };

      const message = mapper.inboundToStandard(wabaDto as any);

      expect(message).toMatchObject({
        id: 'msg_123',
        direction: MessageDirectionEnum.Incoming,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sent,
        type: MessageTypeEnum.Text,
        content: { text: 'Hi there!' },
        sender: {
          id: '1234567890',
          channelType: ChannelTypeEnum.Waba,
        },
      });
    });
  });

  describe('ackToStatus', () => {
    it('should convert WABA ACK to message status', () => {
      const wabaAck = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp' as const,
                  metadata: {
                    display_phone_number: '+15551234567',
                    phone_number_id: 'phone_id_123',
                  },
                  statuses: [
                    {
                      id: 'msg_123',
                      status: 'read' as const,
                      timestamp: '1234567890',
                      recipient_id: '1234567890',
                    },
                  ],
                },
                field: 'message_status' as const,
              },
            ],
          },
        ],
      };

      const status = mapper.ackToStatus(wabaAck as any);

      expect(status).toBe(MessageStatusEnum.Read);
    });

    it('should convert delivered status', () => {
      const wabaAck = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp' as const,
                  metadata: {
                    display_phone_number: '+15551234567',
                    phone_number_id: 'phone_id_123',
                  },
                  statuses: [
                    {
                      id: 'msg_123',
                      status: 'delivered' as const,
                      timestamp: '1234567890',
                      recipient_id: '1234567890',
                    },
                  ],
                },
                field: 'message_status' as const,
              },
            ],
          },
        ],
      };

      const status = mapper.ackToStatus(wabaAck as any);

      expect(status).toBe(MessageStatusEnum.Delivered);
    });

    it('should convert failed status', () => {
      const wabaAck = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp' as const,
                  metadata: {
                    display_phone_number: '+15551234567',
                    phone_number_id: 'phone_id_123',
                  },
                  statuses: [
                    {
                      id: 'msg_123',
                      status: 'failed' as const,
                      timestamp: '1234567890',
                      recipient_id: '1234567890',
                    },
                  ],
                },
                field: 'message_status' as const,
              },
            ],
          },
        ],
      };

      const status = mapper.ackToStatus(wabaAck as any);

      expect(status).toBe(MessageStatusEnum.Failed);
    });
  });

  describe('validateOutbound', () => {
    it('should validate valid outbound DTO', () => {
      const validDto = {
        messaging_product: 'whatsapp' as const,
        recipient_type: 'individual' as const,
        to: '+1234567890',
        type: 'text' as const,
        text: {
          body: 'Hello, World!',
        },
      };

      const result = mapper.validateOutbound(validDto as any);

      expect(result).toEqual(validDto);
    });

    it('should throw error for invalid outbound DTO', () => {
      const invalidDto = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'text',
        // Missing text property
      };

      expect(() => mapper.validateOutbound(invalidDto as any)).toThrow();
    });
  });

  describe('validateInbound', () => {
    it('should validate valid inbound DTO', () => {
      const validDto = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp' as const,
                  metadata: {
                    display_phone_number: '+15551234567',
                    phone_number_id: 'phone_id_123',
                  },
                  messages: [
                    {
                      from: '1234567890',
                      id: 'msg_123',
                      timestamp: '1234567890',
                      type: 'text' as const,
                      text: { body: 'Hi there!' },
                    },
                  ],
                },
                field: 'messages' as const,
              },
            ],
          },
        ],
      };

      const result = mapper.validateInbound(validDto as any);

      expect(result).toEqual(validDto);
    });
  });
});
