/**
 * Profile 面板用户资料接口
 */
export interface ProfileData {
  /** 用户唯一标识 */
  id?: string;
  /** 用户名称 */
  name?: string;
  /** 用户头像 URL */
  avatarUrl?: string;
  /** 用户角色 */
  role?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户电话 */
  phone?: string;
  /** 用户本地时间 */
  localTime?: string;
  /** 用户时区 */
  timezone?: string;
  /** 用户位置 */
  location?: string;
  /** 用户公司 */
  company?: string;
  /** 用户职位 */
  title?: string;
  /** 用户标签 */
  tags?: string[];
  /** 用户备注 */
  notes?: string;
  /** 用户创建时间 */
  createdAt?: string;
  /** 用户最后活跃时间 */
  lastActiveAt?: string;
  /** 用户自定义字段 */
  customFields?: Record<string, string | number | boolean>;
}

/**
 * Profile 模板项接口
 */
export interface ProfileTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 模板显示名称 */
  title?: string;
  /** 模板内容 */
  content: string;
  /** 模板分类 */
  category?: string;
  /** 模板标签 */
  tags?: string[];
  /** 是否为快捷回复 */
  isQuickReply?: boolean;
  /** 使用次数 */
  usageCount?: number;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * Profile 模板分类
 */
export interface ProfileTemplateCategory {
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
 * Profile 搜索选项
 */
export interface ProfileSearchOptions {
  /** 搜索关键词 */
  keyword?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 分类筛选 */
  category?: string;
  /** 排序方式 */
  sortBy?: 'name' | 'usageCount' | 'createdAt';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
}
