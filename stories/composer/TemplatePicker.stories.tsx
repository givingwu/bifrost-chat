import type { Meta, StoryObj } from '@storybook/react';
import { TemplatePicker } from '@/components/composer/TemplatePicker';
import '@/styles/theme.css';

/**
 * TemplatePicker 组件 Story 文档
 */

const meta: Meta<typeof TemplatePicker> = {
  title: 'Composer/TemplatePicker',
  component: TemplatePicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplatePicker>;

export const Default = () => {
  const templates = [
    { id: '1', title: '问候模板', content: '您好，感谢您的咨询！' },
    { id: '2', title: '确认模板', content: '已收到您的消息，我们会尽快处理。' },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg relative">
      <TemplatePicker
        open
        templates={templates}
        onTemplateSelect={(template) => console.log('Selected:', template)}
        onClose={() => console.log('Close')}
      />
    </div>
  );
};
