import { Mic, MicOff, Pause, Play, Send, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useAudioRecorder } from '@/hooks/use-audio-recorder.hook';
import type { AudioData } from '@/interfaces/audio.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { formatDuration } from '@/utils/time.util';

export interface AudioRecorderProps {
  /** 发送音频回调 */
  onSendAudio: (audio: AudioData) => void | Promise<void>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大录音时长（秒） */
  maxDuration?: number;
  /** 音频格式（MIME type） */
  mimeType?: string;
  /** 取消回调 */
  onCancel?: () => void;
}

/**
 * AudioRecorder 组件
 *
 * @description
 * 提供音频录音功能，包括：
 * - 录音控制（开始、暂停、恢复、停止）
 * - 时长显示
 * - 录音状态显示
 * - 发送和取消功能
 *
 * @example
 * ```tsx
 * <AudioRecorder
 *   onSendAudio={handleSendAudio}
 *   maxDuration={60}
 *   mimeType="audio/webm"
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const AudioRecorder = memo<AudioRecorderProps>(
  ({
    onSendAudio,
    disabled = false,
    maxDuration = 300,
    mimeType = 'audio/webm',
    onCancel,
  }) => {
    const { t } = useTranslation();
    const {
      status,
      duration,
      audioData,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      clearRecording,
      error,
    } = useAudioRecorder({
      maxDuration,
      mimeType,
    });

    const [isSending, setIsSending] = useState(false);

    // 处理发送音频
    const handleSend = useCallback(async () => {
      if (!audioData || isSending) {
        return;
      }

      setIsSending(true);
      try {
        await onSendAudio(audioData);
        clearRecording();
      } catch (err) {
        console.error('[AudioRecorder] Failed to send audio:', err);
      } finally {
        setIsSending(false);
      }
    }, [audioData, isSending, onSendAudio, clearRecording]);

    // 处理取消
    const handleCancel = useCallback(() => {
      clearRecording();
      onCancel?.();
    }, [clearRecording, onCancel]);

    // 处理错误
    useEffect(() => {
      if (error) {
        console.error('[AudioRecorder] Recording error:', error);
        // TODO: 显示错误提示给用户
      }
    }, [error]);

    // 如果没有在录音且没有音频数据，不显示组件
    if (status === 'idle' && !audioData) {
      return null;
    }

    const isRecording = status === 'recording';
    const isPaused = status === 'paused';
    const isStopped = status === 'stopped';

    return (
      <div
        className={cn(
          'flex items-center gap-2',
          'rounded-lg border border-border bg-muted/50 px-3 py-2',
          'transition-all duration-200',
          'animate-in fade-in slide-in-from-bottom-2',
        )}
      >
        {/* 录音状态指示器 */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <span className="text-xs font-medium text-destructive">
              {t('composer.audio.recording', { defaultValue: '录音中' })}
            </span>
          </div>
        )}

        {/* 时长显示 */}
        <span
          className={cn(
            'text-sm font-mono font-medium',
            isRecording && 'text-destructive',
          )}
        >
          {formatDuration(duration)}
        </span>

        {/* 最大时长提示 */}
        {maxDuration && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            / {formatDuration(maxDuration)}
          </span>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center gap-1">
          {isRecording && (
            <>
              {/* 暂停按钮 */}
              <IconButton
                icon={<Pause className="h-4 w-4" />}
                // variant="ghost"
                // size="sm"
                onClick={pauseRecording}
                disabled={disabled}
                className="h-8 w-8"
                aria-label={t('composer.audio.pause', { defaultValue: '暂停' })}
              />

              {/* 停止按钮 */}
              <IconButton
                icon={<MicOff className="h-4 w-4" />}
                // variant="ghost"
                // size="sm"
                onClick={stopRecording}
                disabled={disabled}
                className="h-8 w-8"
                aria-label={t('composer.audio.stop', { defaultValue: '停止' })}
              />
            </>
          )}

          {isPaused && (
            <>
              {/* 恢复按钮 */}
              <Button
                type="button"
                // variant="ghost"
                // size="sm"
                onClick={resumeRecording}
                disabled={disabled}
                className="h-8 w-8 p-0"
                aria-label={t('composer.audio.resume', {
                  defaultValue: '继续',
                })}
              >
                <Play className="h-4 w-4" />
              </Button>

              {/* 停止按钮 */}
              <Button
                type="button"
                // variant="ghost"
                // size="sm"
                onClick={stopRecording}
                disabled={disabled}
                className="h-8 w-8 p-0"
                aria-label={t('composer.audio.stop', { defaultValue: '停止' })}
              >
                <MicOff className="h-4 w-4" />
              </Button>
            </>
          )}

          {isStopped && audioData && (
            <>
              {/* 发送按钮 */}
              <Button
                type="button"
                // variant="primary"
                // size="sm"
                onClick={handleSend}
                disabled={disabled || isSending}
                // loading={isSending}
                className="h-8 px-3"
                aria-label={t('composer.audio.send', { defaultValue: '发送' })}
              >
                <Send className="h-4 w-4" />
                <span className="ml-1">
                  {t('composer.audio.send', { defaultValue: '发送' })}
                </span>
              </Button>

              {/* 删除按钮 */}
              <Button
                type="button"
                // variant="ghost"
                // size="sm"
                onClick={handleCancel}
                disabled={disabled || isSending}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                aria-label={t('composer.audio.delete', {
                  defaultValue: '删除',
                })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  },
);

AudioRecorder.displayName = 'AudioRecorder';
