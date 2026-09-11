import { Plus, Send, Trash2 } from 'lucide-react';
import type { Meta } from 'storybook-react-rsbuild';
import { Button, CircularButton } from '@/components/Button';
import '@/styles/theme.css';

/**
 * Button 组件 Story 文档
 *
 * 展示基础按钮组件的各种用法：
 * - 基础按钮
 * - 圆形按钮
 * - 不同状态（禁用、加载等）
 * - 自定义样式
 */

const meta: Meta<typeof Button> = {
  title: 'Basic/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: '按钮内容',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    className: {
      control: 'text',
      description: '自定义类名',
    },
  },
};

export default meta;

/**
 * 基础示例 - 默认按钮
 */
export const Default= {
  args: {
    children: '点击我',
    className:
      'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity',
  },
};

/**
 * 主要按钮 - 使用主题色
 */
export const Primary = () => (
  <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
    主要按钮
  </Button>
);

/**
 * 次要按钮 - 使用次要色
 */
export const Secondary = () => (
  <Button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
    次要按钮
  </Button>
);

/**
 * 幽灵按钮 - 透明背景
 */
export const Ghost = () => (
  <Button className="px-4 py-2 bg-transparent hover:bg-muted/50 text-text rounded-lg transition-colors">
    幽灵按钮
  </Button>
);

/**
 * 禁用状态
 */
export const Disabled = () => (
  <div className="flex gap-2">
    <Button
      disabled
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg opacity-50 cursor-not-allowed"
    >
      禁用按钮
    </Button>
    <Button className="px-4 py-2 bg-muted text-text-muted rounded-lg hover:bg-muted/80 transition-colors">
      正常按钮
    </Button>
  </div>
);

/**
 * 圆形按钮 - 图标按钮
 */
export const CircularButtons = () => (
  <div className="flex gap-2">
    <CircularButton>
      <Send className="w-4 h-4" />
    </CircularButton>
    <CircularButton>
      <Plus className="w-4 h-4" />
    </CircularButton>
    <CircularButton>
      <Trash2 className="w-4 h-4" />
    </CircularButton>
  </div>
);

/**
 * 带图标的按钮
 */
export const WithIcon = () => (
  <div className="flex gap-2">
    <Button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
      <Send className="w-4 h-4" />
      发送
    </Button>
    <Button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
      <Plus className="w-4 h-4" />
      添加
    </Button>
  </div>
);

/**
 * 不同尺寸
 */
export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Button className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
      小按钮
    </Button>
    <Button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
      中按钮
    </Button>
    <Button className="px-6 py-3 text-base bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
      大按钮
    </Button>
  </div>
);

/**
 * 按钮组 - 展示一组相关按钮
 */
export const ButtonGroup = () => (
  <div className="flex gap-2">
    <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
      确认
    </Button>
    <Button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
      取消
    </Button>
    <Button className="px-4 py-2 bg-transparent hover:bg-muted/50 text-text rounded-lg transition-colors">
      稍后
    </Button>
  </div>
);

/**
 * 危险操作按钮
 */
export const Destructive = () => (
  <Button className="px-4 py-2 bg-error text-error-foreground rounded-lg hover:opacity-90 transition-opacity">
    删除
  </Button>
);

/**
 * 自定义样式按钮
 */
export const CustomStyles = () => (
  <div className="flex gap-2">
    <Button
      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
    >
      渐变按钮
    </Button>
    <Button className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
      边框按钮
    </Button>
  </div>
);
