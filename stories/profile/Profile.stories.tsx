import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { Profile } from '@/components/profile/Profile';
import '@/styles/theme.css';

/**
 * Profile 组件 Story 文档
 *
 * 展示个人资料面板的各种用法：
 * - 完整资料
 * - 简化资料
 * - 不同状态
 */

const meta: Meta<typeof Profile> = {
  title: 'Profile/Profile',
  component: Profile,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    profile: {
      control: 'object',
      description: '个人资料对象',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Profile>;

const mockProfile = {
  name: 'Liam Walker',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  role: 'Customer',
  email: 'liam.walker@example.com',
  phone: '+1 (555) 123-4567',
  localTime: '10:45 AM',
};

/**
 * 基础示例 - 默认资料
 */
export const Default: Story = {
  args: {
    profile: mockProfile,
  },
};

/**
 * 简化资料 - 最小信息
 */
export const Minimal: Story = {
  args: {
    profile: {
      name: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      role: 'Guest',
    },
  },
};

/**
 * 完整资料 - 包含所有信息
 */
export const FullProfile: Story = {
  args: {
    profile: {
      name: 'Alice Smith',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      role: 'VIP Customer',
      email: 'alice.smith@example.com',
      phone: '+1 (555) 987-6543',
      localTime: '10:45 AM',
      company: 'Acme Corp',
      location: 'New York, USA',
      tags: ['VIP', 'Repeat Customer'],
    },
  },
};

/**
 * 不同角色 - 展示不同用户角色
 */
export const DifferentRoles: Story = {
  render: () => {
    const roles = [
      { name: 'Customer', label: '普通客户' },
      { name: 'VIP Customer', label: 'VIP客户' },
      { name: 'Guest', label: '访客' },
      { name: 'Agent', label: '客服' },
    ];

    return (
      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role.name} className="w-64">
            <p className="text-xs text-text-muted mb-2">{role.label}</p>
            <Profile
              profile={{
                ...mockProfile,
                role: role.name,
              }}
            />
          </div>
        ))}
      </div>
    );
  },
};
