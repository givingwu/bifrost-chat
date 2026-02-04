import type { Meta, StoryObj } from '@storybook/react';
import { ProfileTemplates } from '@/components/profile/ProfileTemplates';
import '@/styles/theme.css';

/**
 * ProfileTemplates 组件 Story 文档
 */

const meta: Meta<typeof ProfileTemplates> = {
  title: 'Profile/ProfileTemplates',
  component: ProfileTemplates,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileTemplates>;

export const Default = () => {
  const templates = [
    { id: '1', title: '问候模板', content: '您好，感谢您的咨询！' },
    { id: '2', title: '确认模板', content: '已收到您的消息，我们会尽快处理。' },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <ProfileTemplates
        templates={templates}
        onTemplateClick={(template) => console.log('Selected:', template)}
      />
    </div>
  );
};
