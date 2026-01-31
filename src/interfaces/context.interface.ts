/**
 * 上下文面板用户资料接口
 */
export interface ContextPanelProfile {
  /** 用户唯一标识 */
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
}

/**
 * 上下文模板项接口
 */
export interface ContextTemplateItem {
  /** 模板唯一标识 */
  id: string;
  /** 模板显示名称 */
  content: string;
}
