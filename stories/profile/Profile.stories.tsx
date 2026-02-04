import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
export const Default = () => {
  return (
    <div className="w-80 h-96">
      <Profile
        profile={mockProfile}
        onTemplateClick={(template) =>
          console.log('Template clicked:', template)
        }
      />
    </div>
  );
};

/**
 * 简化资料 - 最小信息
 */
export const Minimal = () => {
  const minimalProfile = {
    name: 'John Doe',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    role: 'Guest',
  };

  return (
    <div className="w-80 h-96">
      <Profile
        profile={minimalProfile}
        onTemplateClick={(template) =>
          console.log('Template clicked:', template)
        }
      />
    </div>
  );
};

/**
 * 完整资料 - 包含所有信息
 */
export const FullProfile = () => {
  const fullProfile = {
    name: 'Alice Smith',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    role: 'VIP Customer',
    email: 'alice.smith@example.com',
    phone: '+1 (555) 987-6543',
    localTime: '10:45 AM',
    company: 'Acme Corp',
    location: 'New York, USA',
    tags: ['VIP', 'Repeat Customer'],
  };

  return (
    <div className="w-80 h-96">
      <Profile
        profile={fullProfile}
        onTemplateClick={(template) =>
          console.log('Template clicked:', template)
        }
      />
    </div>
  );
};

/**
 * 交互示例 - 模板点击
 */
export const Interactive = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    { id: '1', title: '问候语', content: '您好，有什么可以帮助您的？' },
    { id: '2', title: '确认订单', content: '您的订单已确认，感谢您的购买。' },
    { id: '3', title: '结束语', content: '感谢您的咨询，祝您生活愉快！' },
  ];

  return (
    <div className="space-y-4">
      <div className="w-80 h-96">
        <Profile
          profile={mockProfile}
          templates={templates}
          onTemplateClick={(template) => setSelectedTemplate(template.content)}
        />
      </div>
      {selectedTemplate && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">已选择模板:</p>
          <p className="text-sm">{selectedTemplate}</p>
        </div>
      )}
    </div>
  );
};

/**
 * 不同角色 - 展示不同用户角色
 */
export const DifferentRoles = () => {
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
            onTemplateClick={(template) =>
              console.log('Template clicked:', template)
            }
          />
        </div>
      ))}
    </div>
  );
};
