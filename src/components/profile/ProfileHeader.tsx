import type { ProfileData } from '@/interfaces/profile.interface';

export interface ProfileAction {
  /** 按钮图标 */
  icon: React.ReactNode;
  /** 无障碍标签 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
}

interface ProfileHeaderProps {
  profile?: ProfileData;
  actions?: ProfileAction[];
}

export const ProfileHeader = ({ profile, actions }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 h-20 w-20 rounded-full border-2 border-border p-1">
        <img
          src={profile?.avatarUrl ?? 'https://placehold.co/80x80'}
          alt={profile?.name ?? 'User'}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      <h2 className="text-lg font-semibold text-text">
        {profile?.name ?? 'Customer'}
      </h2>
      <span className="text-sm text-gray-400 dark:text-gray-500">
        {profile?.role ?? 'Customer'}
      </span>

      {actions && actions.length > 0 && (
        <div className="mt-4 flex gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              onClick={action.onClick}
              className="rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

