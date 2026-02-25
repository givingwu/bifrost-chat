import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ComposerActions } from '@/components/composer/ComposerActions';
import '@/styles/theme.css';

/**
 * ComposerActions 组件 Story 文档
 *
 * 展示发送/语音按钮的各种用法：
 * - 发送按钮（有内容时）
 * - 语音按钮（无内容时）
 * - 加载状态
 * - 禁用状态
 */

const meta: Meta<typeof ComposerActions> = {
  title: 'Composer/ComposerActions',
  component: ComposerActions,
  tags: ['autodocs'],
  argTypes: {
    canSend: {
      control: 'boolean',
      description: '是否可以发送',
    },
    loading: {
      control: 'boolean',
      description: '是否加载中',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerActions>;

/**
 * 基础示例 - 语音按钮（无内容）
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerActions
        canSend={false}
        onSend={() => console.log('Send clicked')}
      />
    </div>
  );
};

/**
 * 发送按钮 - 有内容时显示
 */
export const SendButton = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerActions canSend onSend={() => console.log('Send clicked')} />
    </div>
  );
};

/**
 * 加载状态 - 发送中
 */
export const Loading = () => {
  return (
    <div className="flex gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <ComposerActions
          canSend
          loading
          onSend={() => console.log('Send clicked')}
        />
      </div>
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="flex gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <ComposerActions
          canSend={false}
          disabled
          onSend={() => console.log('Send clicked')}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerActions
          canSend
          disabled
          onSend={() => console.log('Send clicked')}
        />
      </div>
    </div>
  );
};

/**
 * 状态切换 - 展示不同状态
 */
export const StateTransition = () => {
  const [hasContent, setHasContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasContent(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <ComposerActions
          canSend={hasContent}
          loading={isLoading}
          onSend={handleSend}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setHasContent(!hasContent)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
        >
          切换内容状态
        </button>
        <span className="text-sm text-text-muted">
          当前: {hasContent ? '有内容' : '无内容'}
        </span>
      </div>
    </div>
  );
};

/**
 * 不同场景 - 展示实际应用
 */
export const UseCases = () => {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">SMS 渠道 - 无内容</p>
        <div className="p-4 bg-muted rounded-lg">
          <ComposerActions
            canSend={false}
            onSend={() => console.log('SMS send')}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">WhatsApp 渠道 - 有内容</p>
        <div className="p-4 bg-muted rounded-lg">
          <ComposerActions
            canSend
            onSend={() => console.log('WhatsApp send')}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Email 渠道 - 发送中</p>
        <div className="p-4 bg-muted rounded-lg">
          <ComposerActions
            canSend
            loading
            onSend={() => console.log('Email send')}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 完整示例 - 带输入框
 */
export const CompleteExample = () => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (value.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setValue('');
        console.log('Message sent:', value);
      }, 1500);
    }
  };

  return (
    <div className="w-96 space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入消息..."
        className="w-full px-4 py-2 bg-muted rounded-full"
      />
      <div className="flex justify-center">
        <ComposerActions
          canSend={value.trim().length > 0}
          loading={isLoading}
          onSend={handleSend}
        />
      </div>
      <p className="text-xs text-text-muted text-center">
        {isLoading ? '发送中...' : value.trim() ? '点击发送' : '输入内容以发送'}
      </p>
    </div>
  );
};
