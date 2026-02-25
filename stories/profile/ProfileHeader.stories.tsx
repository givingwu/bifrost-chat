import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import '@/styles/theme.css';

/**
 * ProfileHeader 组件 Story 文档
 */

const meta: Meta<typeof ProfileHeader> = {
  title: 'Profile/ProfileHeader',
  component: ProfileHeader,
  tags: ['autodocs'],
  argTypes: {
    profile: {
      control: false,
      description: '个人资料对象',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileHeader>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ProfileHeader />
    </div>
  );
};
