import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmojiPickerButton } from '@/components/composer/EmojiPickerButton';
import '@/styles/theme.css';

/**
 * EmojiPickerButton 组件 Story 文档
 *
 * 展示表情按钮和选择器的各种用法：
 * - 基础用法
 * - 带分类
 * - 禁用状态
 * - 自定义样式
 */

const meta: Meta<typeof EmojiPickerButton> = {
  title: 'Composer/EmojiPickerButton',
  component: EmojiPickerButton,
  tags: ['autodocs'],
  argTypes: {
    onEmojiSelect: { action: 'emojiSelect' },
    onButtonClick: { action: 'buttonClick' },
    disabled: { control: 'boolean' },
    showCategories: { control: 'boolean' },
    gridColumns: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof EmojiPickerButton>;

/**
 * 基础示例 - 默认表情按钮
 */
export const Default = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <EmojiPickerButton
        onEmojiSelect={(emoji) => setValue((prev) => prev + emoji)}
      />
      <p className="text-sm text-text-muted">已选择：{value}</p>
    </div>
  );
};

/**
 * 带分类 - 展示带分类的表情选择器
 */
export const WithCategories = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <EmojiPickerButton
        onEmojiSelect={(emoji) => setValue((prev) => prev + emoji)}
        showCategories
      />
      <p className="text-sm text-text-muted">已选择：{value}</p>
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="w-96">
      <EmojiPickerButton
        disabled
        onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
      />
    </div>
  );
};

/**
 * 自定义网格列数
 */
export const CustomGridColumns = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <EmojiPickerButton
        onEmojiSelect={(emoji) => setValue((prev) => prev + emoji)}
        gridColumns={6}
      />
      <p className="text-sm text-text-muted">已选择：{value}</p>
    </div>
  );
};

/**
 * 带回调 - 展示各种事件
 */
export const WithCallbacks = () => {
  const [value, setValue] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="w-96">
        <EmojiPickerButton
          onEmojiSelect={(emoji) => {
            setValue((prev) => prev + emoji);
            addLog(`Emoji selected: ${emoji}`);
          }}
          onButtonClick={() => addLog('Button clicked')}
        />
      </div>
      <p className="text-sm text-text-muted">已选择：{value}</p>
      <div className="w-96 h-32 overflow-y-auto p-2 bg-muted rounded text-xs font-mono">
        {logs.map((log, index) => (
          <div key={`log-${index}`}>{log}</div>
        ))}
      </div>
    </div>
  );
};

/**
 * 完整示例 - 带输入框
 */
export const CompleteExample = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入消息..."
        className="w-full px-4 py-2 border rounded"
      />
      <EmojiPickerButton
        onEmojiSelect={(emoji) => setValue((prev) => prev + emoji)}
        showCategories
      />
      <p className="text-sm text-text-muted">字符数：{value.length}</p>
    </div>
  );
};
