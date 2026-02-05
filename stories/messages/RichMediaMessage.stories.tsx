import type { Meta, StoryObj } from '@storybook/react';
import { RichMediaMessage } from '@/components/messages/RichMediaMessage';
import '@/styles/theme.css';

/**
 * RichMediaMessage 组件 Story 文档
 *
 * 展示富媒体消息的各种用法：
 * - 卡片式消息
 * - 带按钮的卡片
 * - 多卡片布局
 */

const meta: Meta<typeof RichMediaMessage> = {
  title: 'Messages/RichMediaMessage',
  component: RichMediaMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: false,
      description: '富媒体消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RichMediaMessage>;

/**
 * 基础示例 - 卡片消息
 */
export const CardMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <RichMediaMessage
        content={{
          text: JSON.stringify({
            title: '产品推荐',
            description: 'iPhone 15 Pro Max - 钛金属边框',
            image: 'https://picsum.photos/400/300',
            url: 'https://example.com/product/123',
          }),
        }}
      />
    </div>
  );
};

/**
 * 带按钮的卡片
 */
export const WithButtons = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <RichMediaMessage
        content={{
          text: JSON.stringify({
            title: '限时优惠',
            description: '全场商品 8 折起，活动截止到本周末',
            image: 'https://picsum.photos/400/300',
            buttons: [
              { text: '立即购买', url: 'https://example.com/buy' },
              { text: '查看详情', url: 'https://example.com/details' },
            ],
          }),
        }}
      />
    </div>
  );
};

/**
 * 无图片卡片
 */
export const WithoutImage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <RichMediaMessage
        content={{
          text: JSON.stringify({
            title: '纯文本卡片',
            description: '这是一个没有图片的富媒体消息',
            url: 'https://example.com',
          }),
        }}
      />
    </div>
  );
};

/**
 * 多卡片消息
 */
export const MultipleCards = () => {
  const cards = [
    {
      title: '产品 1',
      description: '这是第一个产品',
      image: 'https://picsum.photos/200/150',
      url: 'https://example.com/1',
    },
    {
      title: '产品 2',
      description: '这是第二个产品',
      image: 'https://picsum.photos/200/150',
      url: 'https://example.com/2',
    },
    {
      title: '产品 3',
      description: '这是第三个产品',
      image: 'https://picsum.photos/200/150',
      url: 'https://example.com/3',
    },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex flex-col gap-3">
        {cards.map((card, index) => (
          <RichMediaMessage
            key={`card-${index}`}
            content={{ text: JSON.stringify(card) }}
          />
        ))}
      </div>
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
        <RichMediaMessage
          content={{
            text: JSON.stringify({
              title: '限时优惠',
              description: '全场商品 8 折起',
              image: 'https://picsum.photos/400/300',
              url: 'https://example.com/sale',
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
      <RichMediaMessage
        content={{
          text: 'invalid json data',
        }}
      />
    </div>
  );
};
