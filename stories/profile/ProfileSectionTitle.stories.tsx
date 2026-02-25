import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ProfileSectionTitle } from '@/components/profile/ProfileSectionTitle';
import '@/styles/theme.css';

/**
 * ProfileSectionTitle 组件 Story 文档
 */

const meta: Meta<typeof ProfileSectionTitle> = {
  title: 'Profile/ProfileSectionTitle',
  component: ProfileSectionTitle,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '章节标题',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileSectionTitle>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ProfileSectionTitle title="基本信息" />
    </div>
  );
};
