import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioData } from '@/interfaces/audio.interface';

/**
 * 录音状态
 */
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

/**
 * useAudioRecorder Hook 的返回值
 */
export interface UseAudioRecorderReturn {
  /** 录音状态 */
  status: RecordingStatus;
  /** 录音时长（秒） */
  duration: number;
  /** 音频数据 */
  audioData: AudioData | null;
  /** 开始录音 */
  startRecording: () => Promise<void>;
  /** 暂停录音 */
  pauseRecording: () => void;
  /** 恢复录音 */
  resumeRecording: () => void;
  /** 停止录音 */
  stopRecording: () => void;
  /** 清除录音 */
  clearRecording: () => void;
  /** 错误信息 */
  error: Error | null;
}

/**
 * useAudioRecorder Hook 的参数
 */
export interface UseAudioRecorderParams {
  /** 最大录音时长（秒） */
  maxDuration?: number;
  /** 音频格式（MIME type） */
  mimeType?: string;
  /** 采样率 */
  sampleRate?: number;
}

/**
 * 音频录音 Hook
 *
 * @description
 * 管理音频录音的完整流程，包括：
 * - 录音控制（开始、暂停、恢复、停止）
 * - 时长计算
 * - 音频数据生成
 * - 错误处理
 *
 * @example
 * ```tsx
 * const { status, duration, audioData, startRecording, stopRecording } = useAudioRecorder({
 *   maxDuration: 60,
 *   mimeType: 'audio/webm',
 * });
 *
 * <button onClick={startRecording} disabled={status === 'recording'}>
 *   开始录音
 * </button>
 * <button onClick={stopRecording} disabled={status !== 'recording'}>
 *   停止录音
 * </button>
 * <span>时长: {duration}秒</span>
 * ```
 */
export function useAudioRecorder({
  maxDuration = 300,
  mimeType = 'audio/webm',
  sampleRate = 44100,
}: UseAudioRecorderParams = {}): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理资源
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // 更新录音时长
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 0.1;
          // 检查是否达到最大时长
          if (maxDuration && newDuration >= maxDuration) {
            setStatus('stopped');
            // 停止录音
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => {
                track.stop();
              });
              streamRef.current = null;
            }
            return maxDuration;
          }
          return newDuration;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, maxDuration]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio recording');
      }

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // 创建 MediaRecorder
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // 处理数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 处理录音停止事件
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const audioData: AudioData = {
          blob,
          mimeType: blob.type || mimeType,
          duration,
          size: blob.size,
        };
        setAudioData(audioData);
        chunksRef.current = [];
      };

      // 开始录音
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setStatus('recording');
      setDuration(0);
      setAudioData(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      console.error('[useAudioRecorder] Failed to start recording:', error);
    }
  }, [mimeType, sampleRate, duration]);

  // 暂停录音
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  }, [status]);

  // 恢复录音
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  }, [status]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      (status === 'recording' || status === 'paused')
    ) {
      mediaRecorderRef.current.stop();
      setStatus('stopped');

      // 停止所有轨道
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    }
  }, [status]);

  // 清除录音
  const clearRecording = useCallback(() => {
    setAudioData(null);
    setDuration(0);
    setStatus('idle');
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    status,
    duration,
    audioData,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    error,
  };
}
