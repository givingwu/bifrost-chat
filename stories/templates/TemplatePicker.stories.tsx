import type { Meta, StoryObj } from '@storybook/react';
import {
  DEFAULT_TEMPLATES,
  TemplatePicker,
} from '@/components/templates/TemplatePicker';
import '@/styles/theme.css';

const meta: Meta<typeof TemplatePicker> = {
  title: 'Templates/TemplatePicker',
  component: TemplatePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof TemplatePicker>;

export const Default: Story = {
  args: {
    open: true,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
    position: { x: 0, y: 0 },
  },
};

export const WithCustomTemplates: Story = {
  args: {
    open: true,
    templates: [
      {
        id: '1',
        title: '问候模板',
        content: '您好，感谢您的咨询！',
        category: '常用',
        tags: ['问候', '开场'],
      },
      {
        id: '2',
        title: '确认模板',
        content: '已收到您的消息，我们会尽快处理。',
        category: '常用',
        tags: ['确认', '处理'],
      },
      {
        id: '3',
        title: '结束语',
        content: '祝您生活愉快！',
        category: '常用',
        tags: ['结束语'],
      },
    ],
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
};

export const WithPosition: Story = {
  args: {
    open: true,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
    position: { x: 100, y: 200 },
  },
};

export const Empty: Story = {
  args: {
    open: true,
    templates: [],
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
};
