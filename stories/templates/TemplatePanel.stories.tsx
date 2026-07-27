import type { Meta } from 'storybook-react-rsbuild';
import type { StoryObj } from 'storybook-react-rsbuild';
type Story = StoryObj<any>;
import { TemplatePanel } from '@/components/template/TemplatePanel';
import type { Template } from '@/interfaces/template.interface';
import '@/styles/theme.css';

/**
 * TemplatePanel 组件 Story 文档
 *
 * 展示完整的模板面板，包含搜索、分类过滤和模板列表
 */

// Mock 模板数据
const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: '问候',
    category: '常用',
    content: '您好，有什么可以帮助您的吗？',
    tags: ['问候', '开场'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-2',
    name: '感谢',
    category: '常用',
    content: '非常感谢您的支持！',
    tags: ['感谢', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-3',
    name: '跟进',
    category: '销售',
    content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
    tags: ['跟进', '销售'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-4',
    name: '预约',
    category: '业务',
    content: '您好，请问您方便安排一个时间进行详细沟通吗？',
    tags: ['预约', '沟通'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-5',
    name: '结束语',
    category: '常用',
    content: '祝您生活愉快！',
    tags: ['结束语', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const meta: Meta<typeof TemplatePanel> = {
  title: 'Template/TemplatePanel',
  component: TemplatePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onTemplateSelect: {
      action: 'onTemplateSelect',
      description: '选择模板的回调',
    },
    selectedId: {
      control: 'text',
      description: '选中的模板 ID',
    },
    showCategory: {
      control: 'boolean',
      description: '是否显示分类标签',
    },
    showUsageCount: {
      control: 'boolean',
      description: '是否显示使用次数',
    },
    templates: {
      control: 'object',
      description: '自定义模板列表（如果提供，则不使用 useTemplates）',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full h-[600px] bg-background rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;

/**
 * 默认状态的模板面板
 */
export const Default= {
  args: {
    templates: mockTemplates,
    showCategory: true,
    showUsageCount: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
默认状态的模板面板，包含搜索框、分类过滤和模板列表。

**特性：**
- 搜索功能：支持按名称、内容、分类、标签搜索
- 分类过滤：点击分类按钮过滤模板
- 模板列表：显示所有模板，支持选择
- 加载状态：显示加载中、加载失败、空状态
        `,
      },
    },
  },
};

/**
 * 带选中状态的模板面板
 */
export const WithSelected= {
  args: {
    templates: mockTemplates,
    selectedId: 'template-1',
    showCategory: true,
  },
  parameters: {
    docs: {
      description: {
        story: '显示选中状态的模板面板。',
      },
    },
  },
};

/**
 * 显示使用次数
 */
export const WithUsageCount= {
  args: {
    templates: mockTemplates.map((t) => ({
      ...t,
      usageCount: Math.floor(Math.random() * 100),
    })),
    showCategory: true,
    showUsageCount: true,
  },
  parameters: {
    docs: {
      description: {
        story: '显示每个模板的使用次数。',
      },
    },
  },
};

/**
 * 不显示分类标签
 */
export const WithoutCategory= {
  args: {
    templates: mockTemplates,
    showCategory: false,
  },
  parameters: {
    docs: {
      description: {
        story: '不显示分类标签的模板面板。',
      },
    },
  },
};

/**
 * 空状态
 */
export const Empty= {
  args: {
    templates: [],
    showCategory: true,
  },
  parameters: {
    docs: {
      description: {
        story: '当没有模板时显示空状态。',
      },
    },
  },
};

/**
 * 带回调的模板面板
 */
export const WithCallback= {
  args: {
    templates: mockTemplates,
    showCategory: true,
  },
  render: (args: any) => {
    const handleSelect = (template: Template) => {
      console.log('Selected template:', template);
    };
    return <TemplatePanel {...args} onTemplateSelect={handleSelect} />;
  },
  parameters: {
    docs: {
      description: {
        story: '带选择回调的模板面板，点击模板时触发回调。',
      },
    },
  },
};

/**
 * 点击即发送（示例）
 */
export const ClickToSend= {
  args: {
    templates: mockTemplates,
    showCategory: true,
  },
  render: (args: any) => {
    const handleSelect = (template: Template) => {
      console.log('Send template content:', template.content);
    };
    return <TemplatePanel {...args} onTemplateSelect={handleSelect} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          '示例：点击模板后直接发送模板内容（此处用 console 代替发送逻辑）。',
      },
    },
  },
};
