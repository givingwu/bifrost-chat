import {
  ChevronRight,
  FileText,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface ContextTemplateItem {
  id: string;
  content: string;
}

export interface ContextPanelProps {
  /** 默认模板列表 */
  templates?: ContextTemplateItem[];
  /** 自定义渲染（优先级最高） */
  renderCustom?: () => ReactNode;
  /** 点击模板回调 */
  onTemplateClick?: (template: ContextTemplateItem) => void;
  /** 用户信息 */
  profile?: {
    name?: string;
    avatarUrl?: string;
    role?: string;
    email?: string;
    phone?: string;
    localTime?: string;
  };
}

const defaultTemplates: ContextTemplateItem[] = [
  { id: 'tpl-1', content: 'Hi, how can I help you today?' },
  { id: 'tpl-2', content: 'Your order #12345 has been shipped.' },
  { id: 'tpl-3', content: 'Could you please verify your email?' },
  { id: 'tpl-4', content: 'Thank you for contacting support.' },
];

/**
 * ContextPanel：右侧上下文面板。
 * - 支持默认模板 + 自定义渲染。
 */
export const ContextPanel = ({
  templates = defaultTemplates,
  renderCustom,
  onTemplateClick,
  profile,
}: ContextPanelProps) => {
  const custom = renderCustom?.();
  if (custom) {
    return <>{custom}</>;
  }

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

  return (
    <div className="flex h-full flex-col overflow-y-auto">
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

      <div className="space-y-4 px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Information
        </h3>
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

      <div className="flex-1 border-t border-border px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Quick Responses
        </h3>
        <div className="mt-3 space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateClick?.(template)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border border-border',
                'bg-card px-3 py-2 text-left text-sm text-text',
                'transition hover:border-primary/50',
              )}
            >
              <span className="line-clamp-1">{template.content}</span>
              <ChevronRight className="h-3 w-3 text-text-muted" />
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or create template..."
            className={cn(
              'w-full rounded-lg border border-transparent bg-muted px-3 py-2',
              'text-xs text-text outline-none focus:ring-1 focus:ring-primary/30',
            )}
          />
          <FileText className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
        </div>
      </div>
    </div>
  );
};
