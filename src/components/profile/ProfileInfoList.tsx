import { FileText, Link, Mail, Phone, User as UserIcon } from 'lucide-react';
import type { ProfileData, ProfileInfoItem } from '@/interfaces/profile.interface';
import { ProfileSectionTitle } from './ProfileSectionTitle';

interface ProfileInfoListProps {
  profile?: ProfileData;
}

const iconMap: Record<NonNullable<ProfileInfoItem['icon']>, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  file: <FileText className="h-4 w-4" />,
  link: <Link className="h-4 w-4" />,
  user: <UserIcon className="h-4 w-4" />,
};

export const ProfileInfoList = ({ profile }: ProfileInfoListProps) => {
  // 内置固定项（email / phone / localTime）
  const builtInItems = [
    {
      icon: <Mail className="h-4 w-4" />,
      label: 'Email',
      value: profile?.email,
      href: undefined,
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: 'Phone',
      value: profile?.phone,
      href: undefined,
    },
    {
      icon: <UserIcon className="h-4 w-4" />,
      label: 'Local Time',
      value: profile?.localTime,
      href: undefined,
    },
  ].filter(item => !!item.value) as { icon: React.ReactNode; label: string; value: string; href: string | undefined }[];

  // 实业方注入的扩展信息项
  const injectedItems = (profile?.infoItems ?? []).map(item => ({
    icon: item.icon ? iconMap[item.icon] : <FileText className="h-4 w-4" />,
    label: item.label,
    value: item.value,
    href: item.href,
  }));

  const allItems = [...builtInItems, ...injectedItems];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <ProfileSectionTitle title="Information" />
      {allItems.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <div className="text-gray-400 dark:text-gray-500">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 truncate block"
              >
                {item.value}
              </a>
            ) : (
              <p className="font-medium text-text truncate">{item.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
