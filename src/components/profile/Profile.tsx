import type { ReactNode } from 'react';
import type {
  ProfileData,
  ProfileTemplate,
} from '@/interfaces/profile.interface';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoList } from './ProfileInfoList';
import { ProfileSearch } from './ProfileSearch';
import { ProfileTemplates } from './ProfileTemplates';

export interface ProfileProps {
  /** 默认模板列表 */
  templates?: ProfileTemplate[];
  /** 自定义渲染（优先级最高） */
  renderCustom?: () => ReactNode;
  /** 点击模板回调 */
  onTemplateClick?: (template: ProfileTemplate) => void;
  /** 用户信息 */
  profile?: ProfileData;
}

/**
 * Profile：右侧上下文面板。
 * - 支持默认模板 + 自定义渲染。
 */
export const Profile = ({
  templates = [],
  renderCustom,
  onTemplateClick,
  profile,
}: ProfileProps) => {
  const custom = renderCustom?.();
  if (custom) {
    return <>{custom}</>;
  }

  if (templates.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <ProfileHeader profile={profile} />
        <ProfileInfoList profile={profile} />
        <ProfileSearch />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ProfileHeader profile={profile} />
      <ProfileInfoList profile={profile} />
      <ProfileTemplates
        templates={templates}
        onTemplateClick={onTemplateClick}
      />
      <ProfileSearch />
    </div>
  );
};
