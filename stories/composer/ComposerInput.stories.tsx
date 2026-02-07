import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ComposerInput } from '@/components/composer/ComposerInput';
import '@/styles/theme.css';

/**
 * ComposerInput 组件 Story 文档
 *
 * 展示消息输入框的各种用法：
 * - 基础输入
 * - 不同占位符
 * - 最大长度限制
 * - 禁用状态
 * - 自动聚焦
 * - 回车发送
 */

const meta: Meta<typeof ComposerInput> = {
  title: 'Composer/ComposerInput',
  component: ComposerInput,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: '输入框值',
    },
    placeholder: {
      control: 'text',
      description: '占位符文本',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    maxLength: {
      control: 'number',
      description: '最大长度',
    },
    autoFocus: {
      control: 'boolean',
      description: '是否自动聚焦',
    },
    showEmojiButton: {
      control: 'boolean',
      description: '是否显示表情按钮',
    },
    showCharCount: {
      control: 'boolean',
      description: '是否显示字符计数',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerInput>;

/**
 * 基础示例 - 默认输入框
 */
export const Default = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="输入消息..."
        onEnter={() => console.log('Send:', value)}
      />
    </div>
  );
};

/**
 * 不同占位符 - 展示不同场景的占位符
 */
export const Placeholders = () => {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');

  return (
    <div className="space-y-4">
      <div className="w-96">
        <ComposerInput
          value={value1}
          onChange={setValue1}
          placeholder="输入消息..."
        />
      </div>
      <div className="w-96">
        <ComposerInput
          value={value2}
          onChange={setValue2}
          placeholder="发送短信（最多 70 字符）..."
          maxLength={70}
        />
      </div>
      <div className="w-96">
        <ComposerInput
          value={value3}
          onChange={setValue3}
          placeholder="输入邮件内容..."
        />
      </div>
    </div>
  );
};

/**
 * 最大长度限制 - 展示字符限制
 */
export const WithMaxLength = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="最多 200 字符"
        maxLength={200}
      />
      <p className="text-sm text-text-muted">已输入: {value.length} / 200</p>
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  const [value, setValue] = useState('禁用的输入框');

  return (
    <div className="w-96">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="禁用状态"
        disabled
      />
    </div>
  );
};

/**
 * 自动聚焦
 */
export const AutoFocus = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="自动聚焦的输入框"
        autoFocus
      />
    </div>
  );
};

/**
 * 带事件处理 - 展示各种事件
 */
export const WithEventHandlers = () => {
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
        <ComposerInput
          value={value}
          onChange={setValue}
          placeholder="输入消息..."
          onEnter={() => addLog('Enter pressed - Send message')}
          onFocus={() => addLog('Input focused')}
          onBlur={() => addLog('Input blurred')}
          onEmojiClick={() => addLog('Emoji button clicked')}
        />
      </div>
      <div className="w-96 h-32 overflow-y-auto p-2 bg-muted rounded text-xs font-mono">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

/**
 * 不同渠道 - 展示不同渠道的输入框
 */
export const DifferentChannels = () => {
  const [sms, setSms] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-4">
      <div className="w-96">
        <p className="text-sm font-medium mb-2">SMS 渠道</p>
        <ComposerInput
          value={sms}
          onChange={setSms}
          placeholder="输入短信内容..."
          maxLength={70}
        />
      </div>
      <div className="w-96">
        <p className="text-sm font-medium mb-2">WhatsApp 渠道</p>
        <ComposerInput
          value={whatsapp}
          onChange={setWhatsapp}
          placeholder="输入 WhatsApp 消息..."
        />
      </div>
      <div className="w-96">
        <p className="text-sm font-medium mb-2">Email 渠道</p>
        <ComposerInput
          value={email}
          onChange={setEmail}
          placeholder="输入邮件内容..."
        />
      </div>
    </div>
  );
};

/**
 * 带表情按钮 - 展示表情按钮功能
 */
export const WithEmojiButton = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="点击表情按钮选择表情..."
        showEmojiButton
        onEmojiClick={() => console.log('Emoji button clicked')}
      />
      <p className="text-sm text-text-muted">点击右侧表情按钮选择表情</p>
    </div>
  );
};

/**
 * 不带表情按钮 - 展示不带表情按钮的输入框
 */
export const WithoutEmojiButton = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="不显示表情按钮的输入框"
        showEmojiButton={false}
      />
      <p className="text-sm text-text-muted">不显示表情按钮</p>
    </div>
  );
};

/**
 * 带字符计数 - 展示字符计数功能
 */
export const WithCharCount = () => {
  const [value, setValue] = useState('');

  return (
    <div className="w-96 space-y-2">
      <ComposerInput
        value={value}
        onChange={setValue}
        placeholder="带字符计数的输入框"
        maxLength={200}
        showCharCount
      />
      <p className="text-sm text-text-muted">
        显示字符计数：{value.length} / 200
      </p>
    </div>
  );
};

/**
 * 可配置 - 展示所有配置选项的组合
 */
export const Configurable = () => {
  const [value, setValue] = useState('');
  const [showEmojiButton, setShowEmojiButton] = useState(true);
  const [showCharCount, setShowCharCount] = useState(false);
  const [maxLength, setMaxLength] = useState(2000);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showEmojiButton}
            onChange={(e) => setShowEmojiButton(e.target.checked)}
          />
          <span className="text-sm">显示表情按钮</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCharCount}
            onChange={(e) => setShowCharCount(e.target.checked)}
          />
          <span className="text-sm">显示字符计数</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm">最大长度：</span>
          <input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
        </label>
      </div>
      <div className="w-96">
        <ComposerInput
          value={value}
          onChange={setValue}
          placeholder="可配置的输入框"
          maxLength={maxLength}
          showEmojiButton={showEmojiButton}
          showCharCount={showCharCount}
          onEmojiClick={() => console.log('Emoji button clicked')}
        />
      </div>
      <p className="text-sm text-text-muted">
        当前配置：表情按钮 {showEmojiButton ? '显示' : '隐藏'}，字符计数{' '}
        {showCharCount ? '显示' : '隐藏'}，最大长度 {maxLength}
      </p>
    </div>
  );
};

/**
 * 完整示例 - 带发送功能
 */
export const CompleteExample = () => {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = () => {
    if (value.trim()) {
      setMessages((prev) => [...prev, value]);
      setValue('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-96">
        <ComposerInput
          value={value}
          onChange={setValue}
          placeholder="输入消息..."
          onEnter={handleSend}
        />
      </div>
      <div className="w-96 h-48 overflow-y-auto p-2 bg-muted rounded">
        {messages.length === 0 ? (
          <p className="text-text-muted text-sm">暂无消息</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="p-2 mb-2 bg-card rounded text-sm">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
