import { AlertCircle, Pause, Play } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import type { MessageContent } from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { formatDuration } from '@/utils/time.util';
import { isValidHttpUrl } from '@/utils/url.util';
import { InvalidUrlMessage } from './InvalidUrlMessage';

export interface AudioMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * 音频播放器状态枚举
 */
export enum AudioPlayerStatus {
  Idle = 'idle',
  Loading = 'loading',
  Playing = 'playing',
  Paused = 'paused',
  Error = 'error',
}

/**
 * 音频播放器错误类型
 */
export interface AudioPlayerError {
  type: 'network' | 'format' | 'unknown';
  message: string;
}

/**
 * 音频播放器状态接口
 */
interface AudioPlayerState {
  status: AudioPlayerStatus;
  duration: number;
  currentTime: number;
  progress: number;
  error?: AudioPlayerError;
}

/**
 * 音频播放器 Hook
 * 封装音频播放逻辑，提供状态管理和控制方法
 */
export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    status: AudioPlayerStatus.Loading,
    duration: 0,
    currentTime: 0,
    progress: 0,
  });

  /**
   * 更新播放进度
   */
  const updateProgress = useCallback(
    (currentTime: number, duration: number) => {
      const progress =
        duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
      setState((prev) => ({ ...prev, currentTime, progress }));
    },
    [],
  );

  /**
   * 重置播放器状态
   */
  const resetPlayer = useCallback(() => {
    setState({
      status: AudioPlayerStatus.Loading,
      duration: 0,
      currentTime: 0,
      progress: 0,
    });
  }, []);

  /**
   * 切换播放/暂停
   */
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (
      !audio ||
      state.status === AudioPlayerStatus.Loading ||
      state.status === AudioPlayerStatus.Error
    ) {
      return;
    }

    try {
      if (state.status === AudioPlayerStatus.Playing) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      // 播放失败，可能是网络问题或格式不支持
      const audioError: AudioPlayerError = {
        type: 'unknown',
        message: error instanceof Error ? error.message : '播放失败',
      };

      // 尝试判断错误类型
      if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        audioError.type = 'network';
        audioError.message = '网络错误，无法加载音频';
      } else if (audio.error) {
        audioError.type = 'format';
        audioError.message = '音频格式不支持';
      }

      setState((prev) => ({
        ...prev,
        status: AudioPlayerStatus.Error,
        error: audioError,
      }));
      console.error('[AudioMessage] 播放失败:', error);
    }
  }, [state.status]);

  /**
   * 加载元数据完成
   */
  const handleLoadedMetadata = useCallback(
    (event: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = event.currentTarget;
      const duration = audio.duration || 0;

      setState((prev) => ({
        ...prev,
        duration,
        status: AudioPlayerStatus.Paused,
      }));
    },
    [],
  );

  /**
   * 时间更新
   */
  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = event.currentTarget;
      updateProgress(audio.currentTime || 0, state.duration);
    },
    [state.duration, updateProgress],
  );

  /**
   * 播放开始
   */
  const handlePlay = useCallback(() => {
    setState((prev) => ({ ...prev, status: AudioPlayerStatus.Playing }));
  }, []);

  /**
   * 暂停
   */
  const handlePause = useCallback(() => {
    setState((prev) => ({ ...prev, status: AudioPlayerStatus.Paused }));
  }, []);

  /**
   * 播放结束
   */
  const handleEnded = useCallback(() => {
    setState({
      status: AudioPlayerStatus.Paused,
      duration: state.duration,
      currentTime: 0,
      progress: 0,
    });
  }, [state.duration]);

  /**
   * 错误处理
   */
  const handleError = useCallback(() => {
    const audio = audioRef.current;
    const error: AudioPlayerError = {
      type: 'unknown',
      message: 'Loading Failed',
    };

    if (audio) {
      if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        error.type = 'network';
        error.message = 'Network error, Unable to load audio';
      } else if (audio.error) {
        error.type = 'format';
        error.message = 'Audio format is not supported';
      }
    }

    setState((prev) => ({ ...prev, status: AudioPlayerStatus.Error, error }));
  }, []);

  /**
   * URL 变化时重新加载
   */
  useEffect(() => {
    resetPlayer();
    audioRef.current?.load();
  }, [resetPlayer]);

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    audioRef,
    state,
    togglePlay,
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleEnded,
    handleError,
  };
};

/**
 * 音频播放器按钮组件
 * - 使用 React.memo 优化渲染性能
 * - 仅在 props 变化时重新渲染
 */
interface AudioPlayerButtonProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 点击回调 */
  onClick: () => void;
  /** ARIA 标签 */
  ariaLabel: string;
}

const AudioPlayerButton = memo(
  ({ isPlaying, disabled, onClick, ariaLabel }: AudioPlayerButtonProps) => {
    const disabledClass = useMemo(
      () => (disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : ''),
      [disabled],
    );

    return (
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={isPlaying}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary/80 transition-colors hover:bg-primary/20 ${disabledClass}`}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    );
  },
);

AudioPlayerButton.displayName = 'AudioPlayerButton';

/**
 * 音频播放器进度条组件
 * - 使用 React.memo 优化渲染性能
 * - 使用 useMemo 缓存样式计算
 */
interface AudioPlayerProgressProps {
  /** 进度百分比 */
  progress: number;
  /** ARIA 标签 */
  ariaLabel: string;
}

const AudioPlayerProgress = memo(
  ({ progress, ariaLabel }: AudioPlayerProgressProps) => {
    const progressStyle = useMemo(
      () => ({ width: `${progress}%` }),
      [progress],
    );

    return (
      <div
        className="flex-1"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-primary transition-[width] duration-150"
            style={progressStyle}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  },
);

AudioPlayerProgress.displayName = 'AudioPlayerProgress';

/**
 * 音频播放器状态标签组件
 * - 使用 React.memo 优化渲染性能
 * - 使用 useMemo 缓存文本和样式计算
 */
interface AudioPlayerStatusTextProps {
  /** 状态 */
  status: AudioPlayerStatus;
  /** 时长（秒） */
  duration: number;
  /** 错误状态文本 */
  errorText: string;
  /** 加载状态文本 */
  loadingText: string;
  /** 错误信息 */
  error?: AudioPlayerError;
}

const AudioPlayerStatusText = memo(
  ({
    status,
    duration,
    errorText,
    loadingText,
    error,
  }: AudioPlayerStatusTextProps) => {
    const text = useMemo(() => {
      switch (status) {
        case AudioPlayerStatus.Error:
          return error?.message || errorText;
        case AudioPlayerStatus.Loading:
          return loadingText;
        default:
          return formatDuration(duration);
      }
    }, [status, duration, errorText, loadingText, error]);

    const className = useMemo(
      () =>
        status === AudioPlayerStatus.Error
          ? 'text-xs text-destructive'
          : 'text-xs text-gray-400 dark:text-gray-500',
      [status],
    );

    return <span className={className}>{text}</span>;
  },
);

AudioPlayerStatusText.displayName = 'AudioPlayerStatusText';

/**
 * AudioMessage：语音消息组件。
 * - 渲染语音消息，支持播放控制。
 * - 使用自定义 Hook 封装音频播放逻辑。
 * - 使用 React.memo 优化渲染性能。
 * - 验证 URL 有效性，无效时显示错误状态。
 */
export const AudioMessage = memo(({ content }: AudioMessageProps) => {
  const { t } = useTranslation();

  const {
    audioRef,
    state,
    togglePlay,
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleEnded,
    handleError,
  } = useAudioPlayer();

  // 使用 useMemo 缓存计算值（必须在条件检查之前）
  const isDisabled = useMemo(
    () =>
      state.status === AudioPlayerStatus.Loading ||
      state.status === AudioPlayerStatus.Error,
    [state.status],
  );

  const isPlaying = useMemo(
    () => state.status === AudioPlayerStatus.Playing,
    [state.status],
  );

  const buttonAriaLabel = useMemo(
    () => (isPlaying ? t('message.audio.pause') : t('message.audio.play')),
    [isPlaying, t],
  );

  // 类型守卫：确保 content 有 url 字段
  if (!('url' in content) || typeof content.url !== 'string') {
    return <InvalidUrlMessage icon={AlertCircle} type="audio" />;
  }

  // 验证 URL 有效性
  if (!isValidHttpUrl(content.url)) {
    return <InvalidUrlMessage icon={AlertCircle} type="audio" />;
  }

  return (
    <section
      className="flex items-center gap-2"
      aria-label={t('message.type.audio')}
    >
      <AudioPlayerButton
        isPlaying={isPlaying}
        disabled={isDisabled}
        onClick={togglePlay}
        ariaLabel={buttonAriaLabel}
      />
      <AudioPlayerProgress
        progress={state.progress}
        ariaLabel={t('message.audio.progress')}
      />
      <AudioPlayerStatusText
        status={state.status}
        duration={state.duration}
        errorText={t('message.audio.error')}
        loadingText={t('message.audio.loading')}
        error={state.error}
      />

      {/* biome-ignore lint: 语音消息由宿主提供音频资源 */}
      <audio
        ref={audioRef}
        src={content.url}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
      />
    </section>
  );
});

AudioMessage.displayName = 'AudioMessage';
