import type { MessageTypeEnum } from './message.interface';

/**
 * 音频输出格式
 *
 * @description
 * 定义录音后的输出格式
 */
export enum AudioOutputFormatEnum {
  /** 原始音频（浏览器默认格式，通常是 WebM 或 WAV） */
  Raw = 'raw',
  /** WebM 格式（浏览器原生支持） */
  WebM = 'webm',
  /** WAV 格式（需要转换） */
  WAV = 'wav',
  /** MP3 格式（需要转换） */
  MP3 = 'mp3',
  /** 语音识别转文字（发送文本而非音频） */
  Transcript = 'transcript',
}

/**
 * 音频数据
 *
 * @description
 * 录音后的音频数据
 */
export interface AudioData {
  /** 音频 Blob */
  blob: Blob;
  /** 音频格式（MIME type） */
  mimeType: string;
  /** 录音时长（秒） */
  duration: number;
  /** 音频大小（字节） */
  size: number;
  /** 语音识别文本（如果格式为 Transcript） */
  transcript?: string;
}

/**
 * 发送音频消息的参数
 *
 * @description
 * SDK 传递给调用方的音频消息发送参数
 * 调用方负责音频处理和消息发送
 *
 * @example
 * ```typescript
 * // 发送原始音频
 * const params: SendAudioParams = {
 *   conversationId: 'conv-123',
 *   audio: { blob: Blob, mimeType: 'audio/webm', duration: 30, size: 1024000 },
 *   format: AudioOutputFormatEnum.Raw,
 * };
 *
 * // 发送语音识别文本
 * const params: SendAudioParams = {
 *   conversationId: 'conv-123',
 *   audio: { blob: Blob, mimeType: 'audio/webm', duration: 30, size: 1024000, transcript: '你好' },
 *   format: AudioOutputFormatEnum.Transcript,
 * };
 * ```
 */
export interface SendAudioParams {
  type: MessageTypeEnum.Audio;
  /** 会话 ID */
  conversationId: string;
  /** 音频数据 */
  audio: AudioData;
  /** 输出格式 */
  format: AudioOutputFormatEnum;
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 发送音频消息的结果
 *
 * @description
 * 发送音频消息后的返回结果
 */
export interface SendAudioResult {
  type: MessageTypeEnum.Audio;
  /** 临时消息 ID */
  tempId: string;
  /** 真实消息 ID（服务端返回） */
  messageId?: string;
  /** 发送状态 */
  status: 'sent' | 'failed';
  /** 错误信息（如果失败） */
  error?: string;
  /** 音频文件 URL（服务端返回） */
  audioUrl?: string;
  /** 语音识别文本（如果进行了识别） */
  transcript?: string;
}
