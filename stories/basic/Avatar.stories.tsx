import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { User } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import '@/styles/theme.css';

/**
 * Avatar 组件 Story 文档
 *
 * 展示头像组件的各种用法：
 * - 不同尺寸（sm, md, lg, xl）
 * - 圆形/圆角样式
 * - 图片加载失败处理
 * - 自定义占位符
 * - 可点击状态
 */

const meta: Meta<typeof Avatar> = {
  title: 'Basic/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '图片 URL',
    },
    alt: {
      control: 'text',
      description: '替代文本',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '头像尺寸',
    },
    rounded: {
      control: 'boolean',
      description: '是否圆形',
    },
    lazy: {
      control: 'boolean',
      description: '是否懒加载',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * 基础示例 - 默认尺寸
 */
export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=12',
    alt: '用户头像',
    size: 'md',
  },
};

/**
 * 尺寸变体 - 展示所有可用尺寸
 */
export const Sizes = () => (
  <div className="flex items-end gap-4">
    <Avatar src="https://i.pravatar.cc/150?img=12" alt="小头像" size="sm" />
    <Avatar src="https://i.pravatar.cc/150?img=12" alt="中头像" size="md" />
    <Avatar src="https://i.pravatar.cc/150?img=12" alt="大头像" size="lg" />
    <Avatar src="https://i.pravatar.cc/150?img=12" alt="超大头像" size="xl" />
  </div>
);

/**
 * 圆角样式 - 展示方形头像
 */
export const Rounded = () => (
  <div className="flex items-center gap-4">
    <Avatar
      src="https://i.pravatar.cc/150?img=12"
      alt="圆形头像"
      size="md"
      rounded
    />
    <Avatar
      src="https://i.pravatar.cc/150?img=12"
      alt="方形头像"
      size="md"
      rounded={false}
    />
  </div>
);

/**
 * 无图片状态 - 展示默认占位符
 */
export const NoImage = () => (
  <div className="flex items-center gap-4">
    <Avatar alt="无图片" size="md" />
    <Avatar alt="无图片" size="lg" />
    <Avatar alt="无图片" size="xl" />
  </div>
);

/**
 * 自定义占位符 - 使用自定义内容作为占位符
 */
export const CustomFallback = () => (
  <div className="flex items-center gap-4">
    <Avatar
      alt="自定义占位符"
      size="md"
      fallback={<User className="w-6 h-6 text-gray-400" />}
    />
    <Avatar
      alt="文字占位符"
      size="lg"
      fallback={<span className="text-2xl">👤</span>}
    />
  </div>
);

/**
 * 可点击状态 - 支持点击交互的头像
 */
export const Clickable: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=12',
    alt: '可点击头像',
    size: 'lg',
    onClick: () => console.log('Avatar clicked'),
  },
};

/**
 * 加载失败处理 - 图片加载失败时显示占位符
 */
export const FailedImage = () => (
  <div className="flex items-center gap-4">
    <Avatar src="https://invalid-url.com/image.jpg" alt="加载失败" size="md" />
    <Avatar
      src="https://invalid-url.com/image.jpg"
      alt="加载失败-自定义占位符"
      size="lg"
      fallback={<span className="text-xl">❌</span>}
    />
  </div>
);

/**
 * 懒加载 - 图片懒加载示例
 */
export const LazyLoad: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=12',
    alt: '懒加载头像',
    size: 'lg',
    lazy: true,
  },
};

/**
 * 用户列表 - 实际应用场景示例
 */
export const UserList = () => {
  const users = [
    { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Diana', avatar: null },
  ];

  return (
    <div className="flex items-center -space-x-2">
      {users.map((user) => (
        <Avatar
          key={user.id}
          src={user.avatar}
          alt={user.name}
          size="md"
          className="ring-2 ring-white"
        />
      ))}
    </div>
  );
};
