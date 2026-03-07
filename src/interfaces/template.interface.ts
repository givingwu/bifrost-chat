/**
 * Template 模块接口定义
 *
 * 管理和选择消息模板相关的类型定义
 */

/**
 * 消息模板接口
 */
export interface Template<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 模板唯一标识 */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板 code（新 API 必需） */
  code?: string;
  /** 模板内容 */
  content: string;
  /** 参数替换后的模板内容（新 API 必需） */
  previewContent?: string;
  /** 模板变量 */
  params?: TParams;
  /** 模板分类 */
  category?: string;
  /** 模板语言 */
  language?: string;
  /** 模板标签 */
  tags?: string[];
  /** 是否为快捷回复 */
  isQuickReply?: boolean;
  /** 使用次数 */
  usageCount?: number;
  /** 是否已启用 */
  enabled?: boolean;
  /** 创建时间 */
  createdAt?: number;
  /** 更新时间 */
  updatedAt?: number;
}

/**
 * 模板分类接口
 */
export interface TemplateCategory {
  /** 分类 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类图标 */
  icon?: string;
  /** 排序顺序 */
  order?: number;
}

/**
 * 模板搜索选项
 */
export interface TemplateSearchOptions {
  /** 搜索关键词 */
  keyword?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 分类筛选 */
  category?: string;
  /** 排序方式 */
  sortBy?: 'title' | 'usageCount' | 'createdAt';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 模板选择事件
 */
export interface TemplateSelectEvent {
  /** 选中的模板 */
  template: Template;
  /** 选择时间 */
  timestamp: number;
}

/**
 * 模板使用统计
 */
export interface TemplateUsageStats {
  /** 模板 ID */
  templateId: string;
  /** 使用次数 */
  count: number;
  /** 最后使用时间 */
  lastUsedAt?: string;
}
