import type { Meta } from 'storybook-react-rsbuild';
import { TemplateSearch } from '@/components/template/TemplateSearch';
import '@/styles/theme.css';

/**
 * TemplateSearch 组件 Story 文档
 */

const meta: Meta<typeof TemplateSearch> = {
  title: 'Template/TemplateSearch',
  component: TemplateSearch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

/**
 * 默认状态的模板搜索
 */
export const Default= {
  render: () => (
    <div className="p-4 bg-muted rounded-lg w-80">
      <TemplateSearch />
    </div>
  ),
};

/**
 * 带搜索值的模板搜索
 */
export const WithValue= {
  render: () => (
    <div className="p-4 bg-muted rounded-lg w-80">
      <TemplateSearch value="问候" />
    </div>
  ),
};

/**
 * 带搜索回调的模板搜索
 */
export const WithCallback= {
  render: () => {
    const handleSearch = (query: string) => {
      console.log('搜索查询:', query);
    };
    return (
      <div className="p-4 bg-muted rounded-lg w-80">
        <TemplateSearch onSearch={handleSearch} />
      </div>
    );
  },
};

/**
 * 自定义占位符
 */
export const CustomPlaceholder= {
  render: () => (
    <div className="p-4 bg-muted rounded-lg w-80">
      <TemplateSearch placeholder="搜索消息模板..." />
    </div>
  ),
};

/**
 * 禁用状态
 */
export const Disabled= {
  render: () => (
    <div className="p-4 bg-muted rounded-lg w-80">
      <TemplateSearch disabled />
    </div>
  ),
};
