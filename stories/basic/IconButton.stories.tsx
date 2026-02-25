import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import {
  Check,
  Edit,
  Mic,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/IconButton';
import '@/styles/theme.css';

/**
 * IconButton 组件 Story 文档
 *
 * 展示图标按钮组件的各种用法：
 * - 不同变体（primary, secondary, ghost, muted）
 * - 不同尺寸（sm, md, lg）
 * - 加载状态
 * - 禁用状态
 */

const meta: Meta<typeof IconButton> = {
  title: 'Basic/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'object',
      description: '图标内容',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'muted'],
      description: '按钮变体',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '按钮尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    loading: {
      control: 'boolean',
      description: '是否加载中',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

/**
 * 基础示例 - 默认图标按钮
 */
export const Default: Story = {
  args: {
    icon: <Send className="w-5 h-5" />,
    variant: 'ghost',
    size: 'md',
  },
};

/**
 * 变体示例 - 展示所有变体
 */
export const Variants = () => (
  <div className="flex gap-2">
    <IconButton
      icon={<Send className="w-5 h-5" />}
      variant="primary"
      onClick={() => console.log('Primary clicked')}
    />
    <IconButton
      icon={<Mic className="w-5 h-5" />}
      variant="secondary"
      onClick={() => console.log('Secondary clicked')}
    />
    <IconButton
      icon={<Plus className="w-5 h-5" />}
      variant="ghost"
      onClick={() => console.log('Ghost clicked')}
    />
    <IconButton
      icon={<Edit className="w-5 h-5" />}
      variant="muted"
      onClick={() => console.log('Muted clicked')}
    />
  </div>
);

/**
 * 尺寸示例 - 展示所有尺寸
 */
export const Sizes = () => (
  <div className="flex items-center gap-2">
    <IconButton
      icon={<Send className="w-4 h-4" />}
      variant="primary"
      size="sm"
    />
    <IconButton
      icon={<Send className="w-5 h-5" />}
      variant="primary"
      size="md"
    />
    <IconButton
      icon={<Send className="w-6 h-6" />}
      variant="primary"
      size="lg"
    />
  </div>
);

/**
 * 加载状态 - 展示加载中的按钮
 */
export const Loading = () => (
  <div className="flex gap-2">
    <IconButton icon={<Send className="w-5 h-5" />} variant="primary" loading />
    <IconButton
      icon={<Mic className="w-5 h-5" />}
      variant="secondary"
      loading
    />
    <IconButton icon={<Plus className="w-5 h-5" />} variant="ghost" loading />
  </div>
);

/**
 * 禁用状态
 */
export const Disabled = () => (
  <div className="flex gap-2">
    <IconButton
      icon={<Send className="w-5 h-5" />}
      variant="primary"
      disabled
    />
    <IconButton
      icon={<Mic className="w-5 h-5" />}
      variant="secondary"
      disabled
    />
    <IconButton icon={<Plus className="w-5 h-5" />} variant="ghost" disabled />
  </div>
);

/**
 * 常用图标按钮 - 展示实际应用场景
 */
export const CommonIcons = () => (
  <div className="flex gap-2">
    <IconButton
      icon={<Send className="w-5 h-5" />}
      variant="primary"
      onClick={() => console.log('Send')}
    />
    <IconButton
      icon={<Mic className="w-5 h-5" />}
      variant="muted"
      onClick={() => console.log('Voice')}
    />
    <IconButton
      icon={<Plus className="w-5 h-5" />}
      variant="ghost"
      onClick={() => console.log('Add')}
    />
    <IconButton
      icon={<Edit className="w-5 h-5" />}
      variant="ghost"
      onClick={() => console.log('Edit')}
    />
    <IconButton
      icon={<Trash2 className="w-5 h-5" />}
      variant="ghost"
      onClick={() => console.log('Delete')}
    />
    <IconButton
      icon={<MoreVertical className="w-5 h-5" />}
      variant="ghost"
      onClick={() => console.log('More')}
    />
  </div>
);

/**
 * 操作按钮组 - 确认/取消示例
 */
export const ActionButtons = () => (
  <div className="flex gap-2">
    <IconButton
      icon={<Check className="w-5 h-5" />}
      variant="primary"
      onClick={() => console.log('Confirm')}
    />
    <IconButton
      icon={<X className="w-5 h-5" />}
      variant="secondary"
      onClick={() => console.log('Cancel')}
    />
  </div>
);

/**
 * 交互示例 - 点击计数
 */
export const Interactive = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <IconButton
        icon={<Plus className="w-5 h-5" />}
        variant="primary"
        onClick={() => setCount((c) => c + 1)}
      />
      <span className="text-lg font-semibold">计数: {count}</span>
    </div>
  );
};

/**
 * 工具栏按钮组 - 模拟工具栏
 */
export const Toolbar = () => (
  <div className="flex items-center gap-1 p-2 bg-muted rounded-lg">
    <IconButton icon={<Edit className="w-4 h-4" />} variant="ghost" size="sm" />
    <IconButton
      icon={<Trash2 className="w-4 h-4" />}
      variant="ghost"
      size="sm"
    />
    <div className="w-px h-4 bg-border mx-1" />
    <IconButton
      icon={<MoreVertical className="w-4 h-4" />}
      variant="ghost"
      size="sm"
    />
  </div>
);
