import { describe, expect, it } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  isServerMessageStatus,
  mapServerMessageStatusToLocal,
} from './status.mapper';

describe('status.mapper', () => {
  describe('isServerMessageStatus', () => {
    it('应接受有效的大写状态值', () => {
      expect(isServerMessageStatus('UN_SEND')).toBe(true);
      expect(isServerMessageStatus('SEND_FAIL')).toBe(true);
      expect(isServerMessageStatus('DELIVER_FAIL')).toBe(true);
      expect(isServerMessageStatus('UN_READ')).toBe(true);
      expect(isServerMessageStatus('READ')).toBe(true);
      expect(isServerMessageStatus('REVOKE')).toBe(true);
      expect(isServerMessageStatus('DELETE')).toBe(true);
      expect(isServerMessageStatus('CLICK')).toBe(true);
    });

    it('应接受有效的小写状态值（服务端实际下发格式）', () => {
      expect(isServerMessageStatus('send_fail')).toBe(true);
      expect(isServerMessageStatus('deliver_fail')).toBe(true);
      expect(isServerMessageStatus('un_read')).toBe(true);
      expect(isServerMessageStatus('read')).toBe(true);
      expect(isServerMessageStatus('un_send')).toBe(true);
      expect(isServerMessageStatus('clicked')).toBe(true);
    });

    it('应拒绝无效的状态值', () => {
      expect(isServerMessageStatus('UNKNOWN')).toBe(false);
      expect(isServerMessageStatus('')).toBe(false);
      expect(isServerMessageStatus(null)).toBe(false);
      expect(isServerMessageStatus(undefined)).toBe(false);
      expect(isServerMessageStatus(123)).toBe(false);
    });
  });

  describe('mapServerMessageStatusToLocal', () => {
    it('大写状态应映射正确', () => {
      expect(mapServerMessageStatusToLocal('UN_SEND')).toBe(
        MessageStatusEnum.Sent,
      );
      expect(mapServerMessageStatusToLocal('SEND_FAIL')).toBe(
        MessageStatusEnum.Failed,
      );
      expect(mapServerMessageStatusToLocal('DELIVER_FAIL')).toBe(
        MessageStatusEnum.Failed,
      );
      expect(mapServerMessageStatusToLocal('UN_READ')).toBe(
        MessageStatusEnum.Delivered,
      );
      expect(mapServerMessageStatusToLocal('READ')).toBe(
        MessageStatusEnum.Read,
      );
      expect(mapServerMessageStatusToLocal('REVOKE')).toBe(
        MessageStatusEnum.Revoked,
      );
      expect(mapServerMessageStatusToLocal('DELETE')).toBe(
        MessageStatusEnum.Deleted,
      );
      expect(mapServerMessageStatusToLocal('CLICK')).toBe(
        MessageStatusEnum.Clicked,
      );
    });

    it('小写 send_fail 应映射为 Failed（修复 #regression）', () => {
      expect(mapServerMessageStatusToLocal('send_fail')).toBe(
        MessageStatusEnum.Failed,
      );
    });

    it('小写状态应与大写结果一致', () => {
      expect(mapServerMessageStatusToLocal('un_read')).toBe(
        mapServerMessageStatusToLocal('UN_READ'),
      );
      expect(mapServerMessageStatusToLocal('deliver_fail')).toBe(
        mapServerMessageStatusToLocal('DELIVER_FAIL'),
      );
      expect(mapServerMessageStatusToLocal('read')).toBe(
        mapServerMessageStatusToLocal('READ'),
      );
      expect(mapServerMessageStatusToLocal('clicked')).toBe(
        mapServerMessageStatusToLocal('CLICKED'),
      );
    });
  });
});
