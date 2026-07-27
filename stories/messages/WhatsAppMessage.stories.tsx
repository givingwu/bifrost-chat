import type { Meta } from 'storybook-react-rsbuild';
import { WhatsAppMessage } from '@/components/messages/WhatsAppMessage';
import '@/styles/theme.css';

/**
 * WhatsAppMessage 组件 Story 文档
 *
 * 展示 WhatsApp 模板消息的各种用法：
 * - 不同模板样式
 * - 带图片的模板
 * - 带按钮的模板
 */

const meta: Meta<typeof WhatsAppMessage> = {
  title: 'Messages/WhatsAppMessage',
  component: WhatsAppMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: false,
      description: 'WhatsApp 模板消息内容',
    },
  },
};

export default meta;

/**
 * 基础示例 - 文本模板
 */
export const TextTemplate = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <WhatsAppMessage
        content={{
          text: JSON.stringify({
            title: '问候模板',
            description: '您好，感谢您的咨询！',
          }),
        }}
      />
    </div>
  );
};

/**
 * 带图片的模板
 */
export const WithImage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <WhatsAppMessage
        content={{
          text: JSON.stringify({
            title: '产品展示',
            description: 'iPhone 15 Pro Max - 钛金属边框',
            image: 'https://picsum.photos/400/300',
          }),
        }}
      />
    </div>
  );
};

/**
 * 带按钮的模板
 */
export const WithButtons = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <WhatsAppMessage
        content={{
          text: JSON.stringify({
            title: '订单确认',
            description: '您的订单 ORD-2024-1234 已确认',
            buttons: ['查看订单', '联系客服'],
          }),
        }}
      />
    </div>
  );
};

/**
 * 完整模板（图片+按钮）
 */
export const FullTemplate = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <WhatsAppMessage
        content={{
          text: JSON.stringify({
            title: '限时优惠',
            description: '全场商品 8 折起，活动截止到本周末',
            image: 'https://picsum.photos/400/300',
            buttons: ['立即购买', '查看详情'],
          }),
        }}
      />
    </div>
  );
};

/**
 * 在消息气泡中使用
 */
export const InMessageBubble = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
        <WhatsAppMessage
          content={{
            text: JSON.stringify({
              title: '问候模板',
              description: '您好，感谢您的咨询！',
            }),
          }}
        />
      </div>
    </div>
  );
};

/**
 * 无效数据
 */
export const InvalidData = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <WhatsAppMessage
        content={{
          text: 'invalid json data',
        }}
      />
    </div>
  );
};
