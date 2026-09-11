/**
 * 单个信息条目（支持实业方注入结构化数据）
 */
export interface ProfileInfoItem {
  /** 标签 */
  label: string;
  /** 展示文本 */
  value: string;
  /**
   * 可选跳转 URL（有则渲染为可点击链接）
   * 例：/telecol/task/customer-info/12345
   */
  href?: string;
  /** 图标类型 */
  icon?: 'phone' | 'file' | 'link' | 'user';
  /** 是否支持在会话列表搜索中返回（默认 true） */
  searchable?: boolean;
}

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
  /**
   * 结构化业务信息列表（实业方注入）
   * 例：手机号、资产编号、债务ID（支持一键跳转）
   */
  infoItems?: ProfileInfoItem[];
}
