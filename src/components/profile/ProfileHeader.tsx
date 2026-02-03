import { Mail, Phone, User as UserIcon } from 'lucide-react';
import type { ProfileData } from '@/interfaces/profile.interface';

interface ProfileHeaderProps {
  profile?: ProfileData;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center border-b border-border px-6 py-6">
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
      <span className="text-sm text-text-muted">
        {profile?.role ?? 'Customer'}
      </span>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
        >
          <Mail className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
        >
          <UserIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
