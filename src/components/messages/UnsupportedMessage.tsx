import {
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { memo } from 'react';

export interface UnsupportedMessageProps {
  /** 标准消息 */
  message?: StandardMessage;
  /** 消息类型 */
  messageType?: MessageTypeEnum;
  /** 自定义提示文案 */
  customMessage?: string;
}

/**
 * UnsupportedMessage：不支持的消息类型组件。
 * - 当消息类型无法识别时显示的占位组件。
 * - 支持显示原始消息类型信息。
 * - 支持自定义提示文案。
 */
export const UnsupportedMessage = memo(
  ({ message, messageType, customMessage }: UnsupportedMessageProps) => {
    const type = messageType ?? message?.type ?? MessageTypeEnum.Other;
    const displayMessage = customMessage ?? `Unsupported Message Type: ${type}`;

    return (
      <div className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-orange-500 shrink-0"
          aria-label="警告图标"
          role="img"
        >
          <title>Unsupported Message Type</title>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-sm leading-relaxed !text-orange-500">
          {displayMessage}
        </span>
      </div>
    );
  },
);

UnsupportedMessage.displayName = 'UnsupportedMessage';
