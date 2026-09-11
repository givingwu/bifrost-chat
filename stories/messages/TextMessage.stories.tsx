import type { Meta } from 'storybook-react-rsbuild';
import { TextMessage } from '@/components/messages/TextMessage';
import '@/styles/theme.css';

/**
 * TextMessage 组件 Story 文档
 *
 * 展示文本消息的各种用法：
 * - 短文本
 * - 长文本
 * - 特殊字符
 * - 空文本
 */

const meta: Meta<typeof TextMessage> = {
  title: 'Messages/TextMessage',
  component: TextMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;

/**
 * 基础示例 - 短文本
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <TextMessage content={{ text: 'Hello! How are you?' }} />
    </div>
  );
};

/**
 * 长文本 - 展示多行文本
 */
export const LongText = () => {
  return (
    <div className="p-4 bg-muted rounded-lg max-w-md">
      <TextMessage
        content={{
          text: 'This is a longer text message that spans multiple lines. It demonstrates how the component handles text content that exceeds the normal width of a message bubble. The text should wrap properly and maintain readability.',
        }}
      />
    </div>
  );
};

/**
 * 特殊字符 - 展示 emoji 和特殊字符
 */
export const SpecialCharacters = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <TextMessage content={{ text: 'Hello! 👋 How are you? 😊' }} />
      </div>
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <TextMessage
          content={{ text: 'Check out this link: https://example.com' }}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <TextMessage content={{ text: 'Email: test@example.com' }} />
      </div>
    </div>
  );
};

/**
 * 不同语言 - 展示多语言支持
 */
export const Multilingual = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <p className="text-xs text-text-muted mb-2">English</p>
        <TextMessage content={{ text: 'Hello! How are you today?' }} />
      </div>
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <p className="text-xs text-text-muted mb-2">中文</p>
        <TextMessage content={{ text: '你好！今天怎么样？' }} />
      </div>
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <p className="text-xs text-text-muted mb-2">日本語</p>
        <TextMessage content={{ text: 'こんにちは！元気ですか？' }} />
      </div>
    </div>
  );
};

/**
 * 在消息气泡中使用 - 展示实际应用场景
 */
export const InMessageBubble = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <TextMessage content={{ text: 'Hi there!' }} />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <TextMessage content={{ text: 'Hello! How can I help you?' }} />
        </div>
      </div>
    </div>
  );
};

/**
 * 代码和格式化文本
 */
export const FormattedText = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <TextMessage content={{ text: 'Error: Failed to connect to server' }} />
      </div>
      <div className="p-4 bg-muted rounded-lg max-w-md">
        <TextMessage
          content={{ text: 'Order #12345 has been shipped successfully.' }}
        />
      </div>
    </div>
  );
};

/**
 * 空消息 - 展示各种空消息场景
 */
export const EmptyMessage = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2.5 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">缺少 text 字段</p>
          <TextMessage content={{ url: 'https://example.com' } as never} />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2.5 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">空字符串</p>
          <TextMessage content={{ text: '' }} />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2.5 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">只有空白字符</p>
          <TextMessage content={{ text: '   ' }} />
        </div>
      </div>
    </div>
  );
};

/**
 * 接收的文本消息（左侧对齐）
 */
export const Received = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2.5 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm">
          <TextMessage content={{ text: 'Hi there! How are you?' }} />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2.5 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm">
          <TextMessage
            content={{
              text: 'This is a longer text message that demonstrates proper text wrapping in the message bubble.',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 发送的文本消息（右侧对齐）
 */
export const Sent = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2.5 bg-blue-500 text-white rounded-2xl rounded-tr-sm">
          <TextMessage content={{ text: 'Hello! How can I help you?' }} />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2.5 bg-blue-500 text-white rounded-2xl rounded-tr-sm">
          <TextMessage
            content={{
              text: 'Thanks for your message! I will get back to you shortly.',
            }}
          />
        </div>
      </div>
    </div>
  );
};
