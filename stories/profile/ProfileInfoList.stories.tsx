import type { Meta, StoryObj } from '@storybook/react';
import { ProfileInfoList } from '@/components/profile/ProfileInfoList';
import '@/styles/theme.css';

/**
 * ProfileInfoList 组件 Story 文档
 */

const meta: Meta<typeof ProfileInfoList> = {
  title: 'Profile/ProfileInfoList',
  component: ProfileInfoList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileInfoList>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ProfileInfoList />
    </div>
  );
};
