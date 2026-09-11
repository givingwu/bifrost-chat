import type { Meta } from 'storybook-react-rsbuild';
import { TemplateList } from '@/components/template/TemplateList';
import type { Template } from '@/interfaces/template.interface';

const meta: Meta<typeof TemplateList> = {
  title: 'Template/TemplateList',
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

const mockTemplates: Template[] = [
  {
    id: '1',
    name: '问候',
    content: '您好，有什么可以帮助您的吗？',
    category: '常用',
    tags: ['问候', '开场'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: '感谢',
    content: '非常感谢您的支持！',
    category: '常用',
    tags: ['感谢', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: '跟进',
    content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
    category: '销售',
    tags: ['跟进', '销售'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: '预约',
    content: '您好，请问您方便安排一个时间进行详细沟通吗？',
    category: '业务',
    tags: ['预约', '沟通'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '5',
    name: '结束语',
    content: '祝您生活愉快！',
    category: '常用',
    tags: ['结束语', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const Default= {
  args: {
    templates: mockTemplates,
    showCategory: true,
    showUsageCount: false,
  },
};

export const Empty= {
  args: {
    templates: [],
  },
};

export const WithSelected= {
  args: {
    templates: mockTemplates,
    selectedId: '2',
    showCategory: true,
    showUsageCount: false,
  },
};

export const WithUsageCount= {
  args: {
    templates: mockTemplates.map((t) => ({
      ...t,
      usageCount: Math.floor(Math.random() * 100),
    })),
    showCategory: true,
    showUsageCount: true,
  },
};

export const WithoutCategory= {
  args: {
    templates: mockTemplates.map((t) => ({ ...t, category: undefined })),
    showCategory: false,
    showUsageCount: false,
  },
};

export const LongContent= {
  args: {
    templates: [
      {
        id: '1',
        name: '长内容模板',
        content:
          '这是一个非常长的模板内容，用于测试当模板内容很长时，组件的显示效果。它应该默认只展示三行，避免模板列表在右侧面板里把每一项撑得过高。鼠标移上去时，浏览器原生 tooltip 会展示完整内容，方便用户确认模板全文，再决定是否点击发送或回填。',
        category: '测试',
        tags: ['长内容'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '长模板内容默认限制为最多 3 行，hover 时通过原生 tooltip 查看完整内容。',
      },
    },
  },
};
