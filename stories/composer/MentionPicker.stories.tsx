import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MentionPicker } from '@/components/composer/MentionPicker';
import '@/styles/theme.css';

/**
 * MentionPicker 组件 Story 文档
 */

const meta: Meta<typeof MentionPicker> = {
  title: 'Composer/MentionPicker',
  component: MentionPicker,
  tags: ['autodocs'],
  argTypes: {
    users: {
      control: 'object',
      description: '可提及的用户列表',
    },
    onMentionSelect: {
      control: false,
      description: '用户选择回调函数',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MentionPicker>;

export const Default = () => {
  const users = [
    { id: '1', name: '张三', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', name: '李四', avatar: 'https://i.pravatar.cc/150?u=2' },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <MentionPicker
        users={users}
        onMentionSelect={(user) => console.log('Selected:', user)}
      />
    </div>
  );
};
