import { Search } from 'lucide-react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { SearchInput } from '@/components/SearchInput';
import '@/styles/theme.css';

/**
 * SearchInput 组件 Story 文档
 */

const meta: Meta<typeof SearchInput> = {
  title: 'Basic/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'text',
      description: '搜索值',
    },
    onChange: {
      action: 'onChange',
      description: '值变化回调',
    },
    placeholder: {
      control: 'text',
      description: '占位符文本',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '输入框大小',
    },
    bordered: {
      control: 'boolean',
      description: '是否显示边框',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

/**
 * 默认状态的搜索输入框
 */
export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <SearchInput {...args} />
    </div>
  ),
  args: {
    placeholder: '搜索...',
  },
};

/**
 * 带图标的搜索输入框
 */
export const WithIcon: Story = {
  render: (args) => (
    <div className="w-80">
      <SearchInput {...args} icon={<Search className="h-4 w-4" />} />
    </div>
  ),
  args: {
    placeholder: '搜索...',
  },
};

/**
 * 带边框的搜索输入框
 */
export const Bordered: Story = {
  render: (args) => (
    <div className="w-80">
      <SearchInput {...args} bordered />
    </div>
  ),
  args: {
    placeholder: '搜索...',
    icon: <Search className="h-4 w-4" />,
  },
};

/**
 * 小尺寸搜索输入框
 */
export const Small: Story = {
  render: (args) => (
    <div className="w-64">
      <SearchInput {...args} size="sm" />
    </div>
  ),
  args: {
    placeholder: '搜索...',
    icon: <Search className="h-3 w-3" />,
  },
};

/**
 * 大尺寸搜索输入框
 */
export const Large: Story = {
  render: (args) => (
    <div className="w-96">
      <SearchInput {...args} size="lg" />
    </div>
  ),
  args: {
    placeholder: '搜索...',
    icon: <Search className="h-5 w-5" />,
  },
};

/**
 * 禁用状态
 */
export const Disabled: Story = {
  render: (args) => (
    <div className="w-80">
      <SearchInput {...args} disabled />
    </div>
  ),
  args: {
    placeholder: '搜索...',
    icon: <Search className="h-4 w-4" />,
  },
};

/**
 * 带初始值的搜索输入框
 */
export const WithValue: Story = {
  render: (args) => (
    <div className="w-80">
      <SearchInput {...args} />
    </div>
  ),
  args: {
    value: '搜索内容',
    placeholder: '搜索...',
    icon: <Search className="h-4 w-4" />,
  },
};

/**
 * 受控组件示例
 */
export const Controlled: Story = {
  render: () => {
    // 这里可以添加受控组件的示例代码
    return (
      <div className="w-80">
        <SearchInput
          placeholder="搜索..."
          icon={<Search className="h-4 w-4" />}
          onChange={(value) => console.log('搜索值:', value)}
        />
      </div>
    );
  },
};
