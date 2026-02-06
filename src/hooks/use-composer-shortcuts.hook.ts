import { type KeyboardEvent, useCallback, useEffect, useMemo } from 'react';

/**
 * 修饰键配置
 */
interface ModifierKeys {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

type ModifierKey = keyof ModifierKeys;

/**
 * 解析后的快捷键
 */
interface ParsedShortcut {
  /** 修饰键配置 */
  modifiers: ModifierKeys;
  /** 主键（非修饰键） */
  mainKey: string;
  /** 原始快捷键字符串 */
  original: string;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  /** 快捷键组合（如 'Ctrl+K', 'Cmd+K'） */
  key: string;
  /** 回调函数 */
  handler: (event: KeyboardEvent) => void;
  /** 是否禁用此快捷键 */
  disabled?: boolean;
  /** 快捷键描述（用于调试和帮助提示） */
  description?: string;
  /** 快捷键优先级（数字越大优先级越高，默认 0） */
  priority?: number;
  /** 是否阻止默认行为（默认 true） */
  preventDefault?: boolean;
  /** 是否在输入框中生效（默认 true） */
  workInInput?: boolean;
}

/**
 * 快捷键 Hook 配置选项
 */
interface ShortcutOptions {
  /** 是否启用快捷键（默认 true） */
  enabled?: boolean;
  /** 全局阻止默认行为（默认 true） */
  preventDefault?: boolean;
  /** 是否在输入框中生效（默认 false） */
  workInInput?: boolean;
  /** 快捷键冲突时的回调 */
  onConflict?: (key: string, conflicts: ShortcutConfig[]) => void;
  /** 快捷键解析错误的回调 */
  onParseError?: (key: string, error: Error) => void;
}

/**
 * 修饰键别名映射
 */
const MODIFIER_ALIASES: Record<string, ModifierKey> = {
  cmd: 'ctrl',
  command: 'ctrl',
  option: 'alt',
  windows: 'meta',
};

/**
 * 修饰键列表
 */
const MODIFIER_KEYS: ModifierKey[] = ['ctrl', 'alt', 'shift', 'meta'];

/**
 * 快捷键 Hook
 *
 * 支持键盘快捷键功能，支持优先级、冲突检测、输入框过滤等高级特性
 *
 * @param shortcuts - 快捷键配置数组
 * @param options - 配置选项
 *
 * @example
 * ```tsx
 * useComposerShortcuts([
 *   {
 *     key: 'Ctrl+K',
 *     handler: () => {
 *       setValue('');
 *       console.log('Input cleared');
 *     },
 *     description: 'Clear input',
 *     priority: 10,
 *   },
 *   {
 *     key: 'Ctrl+Enter',
 *     handler: () => {
 *       handleSend();
 *     },
 *     description: 'Send message',
 *     priority: 20,
 *   },
 * ], {
 *   enabled: true,
 *   workInInput: false,
 *   onConflict: (key, conflicts) => {
 *     console.warn(`Shortcut conflict detected: ${key}`, conflicts);
 *   },
 * });
 * ```
 */
export function useComposerShortcuts(
  shortcuts: ShortcutConfig[],
  options: ShortcutOptions = {},
): void {
  const {
    enabled = true,
    preventDefault = true,
    workInInput = false,
    onConflict,
    onParseError,
  } = options;

  // 解析并验证快捷键配置
  const parsedShortcuts = useMemo(() => {
    const result: Array<ShortcutConfig & { parsed: ParsedShortcut }> = [];

    for (const shortcut of shortcuts) {
      if (!shortcut.key || shortcut.key.trim() === '') {
        console.warn(
          '[useComposerShortcuts] Invalid shortcut key: empty string',
        );
        continue;
      }

      try {
        const parsed = parseShortcut(shortcut.key);
        result.push({ ...shortcut, parsed });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[useComposerShortcuts] Failed to parse shortcut "${shortcut.key}":`,
          err.message,
        );
        onParseError?.(shortcut.key, err);
      }
    }

    // 按优先级排序（优先级高的在前）
    return result.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [shortcuts, onParseError]);

  // 检测快捷键冲突
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const keyMap = new Map<string, ShortcutConfig[]>();

    for (const shortcut of parsedShortcuts) {
      const normalizedKey = shortcut.parsed.original.toLowerCase();

      if (!keyMap.has(normalizedKey)) {
        keyMap.set(normalizedKey, []);
      }

      keyMap.get(normalizedKey)?.push(shortcut);
    }

    // 报告冲突
    for (const [key, conflicts] of keyMap.entries()) {
      if (conflicts.length > 1) {
        console.warn(
          `[useComposerShortcuts] Shortcut conflict detected: "${key}"`,
          conflicts.map((c) => c.description || c.key),
        );
        onConflict?.(key, conflicts);
      }
    }
  }, [parsedShortcuts, enabled, onConflict]);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: Event) => {
      if (!enabled) {
        return;
      }

      // 安全的类型转换：确保事件是键盘事件
      if (
        !('key' in event) ||
        !('ctrlKey' in event) ||
        !('altKey' in event) ||
        !('shiftKey' in event) ||
        !('metaKey' in event)
      ) {
        return;
      }

      const keyboardEvent = event as unknown as KeyboardEvent;

      // 检查是否在输入框中
      const target = keyboardEvent.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // 如果配置了不在输入框中生效，且当前在输入框中，则跳过
      if (!workInInput && isInputElement) {
        return;
      }

      // 遍历快捷键配置（已按优先级排序）
      for (const shortcut of parsedShortcuts) {
        if (shortcut.disabled) {
          continue;
        }

        // 检查快捷键是否在输入框中生效
        if (!shortcut.workInInput && isInputElement) {
          continue;
        }

        if (matchShortcut(keyboardEvent, shortcut.parsed)) {
          // 决定是否阻止默认行为
          const shouldPreventDefault =
            shortcut.preventDefault ?? preventDefault;

          if (shouldPreventDefault) {
            try {
              keyboardEvent.preventDefault();
            } catch (error) {
              console.warn(
                '[useComposerShortcuts] Failed to prevent default:',
                error,
              );
            }
          }

          try {
            shortcut.handler(keyboardEvent);
          } catch (error) {
            console.error(
              `[useComposerShortcuts] Error executing shortcut handler for "${shortcut.key}":`,
              error,
            );
          }

          // 只执行第一个匹配的快捷键（优先级最高的）
          return;
        }
      }
    },
    [enabled, parsedShortcuts, preventDefault, workInInput],
  );

  // 注册事件监听器
  useEffect(() => {
    if (!enabled || parsedShortcuts.length === 0) {
      return;
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, parsedShortcuts.length, handleKeyDown]);
}

/**
 * 解析快捷键字符串
 *
 * @param shortcut - 快捷键字符串（如 'Ctrl+Shift+K'）
 * @returns 解析后的快捷键对象
 * @throws 如果快捷键格式无效
 */
function parseShortcut(shortcut: string): ParsedShortcut {
  if (!shortcut || shortcut.trim() === '') {
    throw new Error('Shortcut key cannot be empty');
  }

  const keys = shortcut
    .split('+')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k !== '') as ModifierKey[];

  if (keys.length === 0) {
    throw new Error('Shortcut must contain at least one key');
  }

  const modifiers: ModifierKeys = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  const mainKeys: string[] = [];

  // 解析每个键
  for (const key of keys) {
    // 处理修饰键别名
    const normalizedKey = MODIFIER_ALIASES[key] || key;

    if (MODIFIER_KEYS.includes(normalizedKey)) {
      modifiers[normalizedKey] = true;
    } else {
      mainKeys.push(key);
    }
  }

  // 必须有且仅有一个主键
  if (mainKeys.length === 0) {
    throw new Error(
      'Shortcut must contain exactly one main key (non-modifier)',
    );
  }

  if (mainKeys.length > 1) {
    throw new Error(
      `Shortcut cannot contain multiple main keys: ${mainKeys.join(', ')}`,
    );
  }

  return {
    modifiers,
    mainKey: mainKeys[0],
    original: shortcut,
  };
}

/**
 * 检查事件是否匹配解析后的快捷键
 *
 * @param event - 键盘事件
 * @param parsed - 解析后的快捷键
 * @returns 是否匹配
 */
function matchShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const { modifiers, mainKey } = parsed;
  const eventKey = event.key.toLowerCase();

  // 检查主键是否匹配
  if (eventKey !== mainKey) {
    return false;
  }

  // 检查修饰键是否完全匹配
  // 注意：Ctrl 和 Meta 在 macOS 上可以互换使用
  const ctrlMatch =
    (modifiers.ctrl || modifiers.meta) && (event.ctrlKey || event.metaKey);
  const altMatch = modifiers.alt && event.altKey;
  const shiftMatch = modifiers.shift && event.shiftKey;
  const metaMatch = modifiers.meta && event.metaKey;

  // 验证所有声明的修饰键都按下
  if (modifiers.ctrl && !ctrlMatch) {
    return false;
  }
  if (modifiers.alt && !altMatch) {
    return false;
  }
  if (modifiers.shift && !shiftMatch) {
    return false;
  }
  if (modifiers.meta && !metaMatch) {
    return false;
  }

  // 验证没有按下额外的修饰键（除非在配置中声明）
  const hasExtraModifiers =
    (!modifiers.ctrl && !modifiers.meta && (event.ctrlKey || event.metaKey)) ||
    (!modifiers.alt && event.altKey) ||
    (!modifiers.shift && event.shiftKey) ||
    (!modifiers.meta && event.metaKey);

  if (hasExtraModifiers) {
    return false;
  }

  return true;
}

/**
 * 预定义的快捷键常量
 */
export const PREDEFINED_SHORTCUTS = {
  /** 清空输入框 */
  CLEAR: 'Ctrl+K',
  /** 发送消息 */
  SEND: 'Ctrl+Enter',
  /** 换行 */
  NEW_LINE: 'Shift+Enter',
  /** 粘贴 */
  PASTE: 'Ctrl+V',
  /** 全选 */
  SELECT_ALL: 'Ctrl+A',
  /** 撤销 */
  UNDO: 'Ctrl+Z',
  /** 重做 */
  REDO: 'Ctrl+Shift+Z',
  /** 查找 */
  FIND: 'Ctrl+F',
  /** 替换 */
  REPLACE: 'Ctrl+H',
  /** 保存 */
  SAVE: 'Ctrl+S',
} as const;

/**
 * 快捷键工具函数
 */
export const shortcutUtils = {
  /**
   * 格式化快捷键为显示文本
   */
  format(shortcut: string): string {
    return shortcut
      .split('+')
      .map((key) => {
        const k = key.trim();
        if (k === 'ctrl' || k === 'cmd') {
          return '⌘';
        }
        if (k === 'shift') {
          return '⇧';
        }
        if (k === 'alt' || k === 'option') {
          return '⌥';
        }
        return k.charAt(0).toUpperCase() + k.slice(1);
      })
      .join('');
  },

  /**
   * 检查快捷键是否有效
   */
  isValid(shortcut: string): boolean {
    try {
      parseShortcut(shortcut);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 获取快捷键的描述
   */
  getDescription(config: ShortcutConfig): string {
    return config.description || config.key;
  },
} as const;
