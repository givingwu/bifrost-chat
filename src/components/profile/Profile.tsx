import type { ReactNode } from 'react';
import type { ProfileData } from '@/interfaces/profile.interface';
import { type ProfileAction, ProfileHeader } from './ProfileHeader';
import { ProfileInfoList } from './ProfileInfoList';

export type { ProfileAction };

export interface ProfileProps {
  /** 用户信息 */
  profile?: ProfileData;
  /** 头部快捷操作按钮，不传则不渲染按钮栏 */
  actions?: ProfileAction[];
  /** 子元素 */
  children?: ReactNode;
}

/**
 * Profile：右侧上下文面板
 *
 * 展示客户/联系人信息（姓名、头像、标签等）
 *
 * @example
 * ```tsx
 * <Profile
 *   profile={{ id: 'user-123', name: '张三', ... }}
 *   actions={[
 *     { icon: <Phone className="h-4 w-4" />, label: '拨打电话', onClick: () => call(profile.phone) },
 *     { icon: <Mail  className="h-4 w-4" />, label: '发送邮件', onClick: () => mail(profile.email) },
 *   ]}
 * />
 * ```
 */
export const Profile = ({ profile, actions }: ProfileProps) => {
  return (
    <div className="flex flex-col space-y-4 px-4 py-4">
      <ProfileHeader profile={profile} actions={actions} />
      <ProfileInfoList profile={profile} />
    </div>
  );
};

