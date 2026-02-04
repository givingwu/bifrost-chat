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
