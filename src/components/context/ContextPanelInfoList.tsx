import { Mail, Phone, User as UserIcon } from 'lucide-react';
import type { ContextPanelProfile } from '@/interfaces/context.interface';
import { ContextPanelSectionTitle } from './ContextPanelSectionTitle';

interface ContextPanelInfoListProps {
  profile?: ContextPanelProfile;
}

export const ContextPanelInfoList = ({
  profile,
}: ContextPanelInfoListProps) => {
  const infoItems = [
    {
      icon: <Mail className="h-4 w-4" />,
      label: 'Email',
      value: profile?.email,
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: 'Phone',
      value: profile?.phone,
    },
    {
      icon: <UserIcon className="h-4 w-4" />,
      label: 'Local Time',
      value: profile?.localTime,
    },
  ].filter((item) => item.value);

  if (infoItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <ContextPanelSectionTitle title="Information" />
      {infoItems.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <div className="text-text-muted">{item.icon}</div>
          <div className="flex-1">
            <p className="text-xs text-text-muted">{item.label}</p>
            <p className="font-medium text-text">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
