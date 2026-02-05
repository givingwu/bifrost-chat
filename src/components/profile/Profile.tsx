import type { ProfileData } from '@/interfaces/profile.interface';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoList } from './ProfileInfoList';

export interface ProfileProps {
  /** 用户信息 */
  profile?: ProfileData;
}

/**
 * Profile：右侧上下文面板
 *
 * 展示客户/联系人信息（姓名、头像、标签等）
 *
 * @example
 * ```tsx
 * <Profile
 *   profile={{
 *     id: 'user-123',
 *     name: '张三',
 *     avatarUrl: 'https://example.com/avatar.jpg',
 *     email: 'zhangsan@example.com',
 *     phone: '+86 138 0000 0000',
 *   }}
 * />
 * ```
 */
export const Profile = ({ profile }: ProfileProps) => {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ProfileHeader profile={profile} />
      <ProfileInfoList profile={profile} />
    </div>
  );
};
