import type { Meta, StoryObj } from '@storybook/react';
import { ProfileSearch } from '@/components/profile/ProfileSearch';
import '@/styles/theme.css';

/**
 * ProfileSearch 组件 Story 文档
 */

const meta: Meta<typeof ProfileSearch> = {
  title: 'Profile/ProfileSearch',
  component: ProfileSearch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileSearch>;

export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ProfileSearch />
    </div>
  );
};
