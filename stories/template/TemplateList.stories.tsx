import type { Meta, StoryObj } from '@storybook/react';
import { TemplateList } from '@/components/template/TemplateList';
import type { MessageTemplate } from '@/interfaces/template.interface';

const meta: Meta<typeof TemplateList> = {
  title: 'Templates/TemplateList',
  component: TemplateList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onTemplateClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateList>;

const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    title: '问候',
    content: '您好，有什么可以帮助您的吗？',
    category: '常用',
    tags: ['问候', '开场'],
    isQuickReply: true,
    usageCount: 42,
  },
  {
    id: '2',
    title: '感谢',
    content: '非常感谢您的支持！',
    category: '常用',
    tags: ['感谢', '礼貌'],
    isQuickReply: true,
    usageCount: 28,
  },
  {
    id: '3',
    title: '跟进',
    content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
    category: '销售',
    tags: ['跟进', '销售'],
    isQuickReply: false,
    usageCount: 15,
  },
  {
    id: '4',
    title: '预约',
    content: '您好，请问您方便安排一个时间进行详细沟通吗？',
    category: '业务',
    tags: ['预约', '沟通'],
    isQuickReply: false,
    usageCount: 8,
  },
  {
    id: '5',
    title: '结束语',
    content: '祝您生活愉快！',
    category: '常用',
    tags: ['结束语', '礼貌'],
    isQuickReply: true,
    usageCount: 35,
  },
];

export const Default: Story = {
  args: {
    templates: mockTemplates,
    showCategory: true,
    showUsageCount: false,
  },
};

export const Empty: Story = {
  args: {
    templates: [],
  },
};

export const WithSelected: Story = {
  args: {
    templates: mockTemplates,
    selectedId: '2',
    showCategory: true,
    showUsageCount: false,
  },
};

export const WithUsageCount: Story = {
  args: {
    templates: mockTemplates,
    showCategory: true,
    showUsageCount: true,
  },
};

export const WithoutCategory: Story = {
  args: {
    templates: mockTemplates.map((t) => ({ ...t, category: undefined })),
    showCategory: false,
    showUsageCount: false,
  },
};

export const LongContent: Story = {
  args: {
    templates: [
      {
        id: '1',
        title: '长内容模板',
        content:
          '这是一个非常长的模板内容，用于测试当模板内容很长时，组件的显示效果。它应该能够正确地截断并显示省略号。',
        category: '测试',
        tags: ['长内容'],
      },
    ],
  },
};
