import type { ReactNode } from 'react';
import type {
  ContextPanelProfile,
  ContextTemplateItem,
} from '@/interfaces/context.interface';
import { ContextPanelHeader } from './ContextPanelHeader';
import { ContextPanelInfoList } from './ContextPanelInfoList';
import { ContextPanelSearch } from './ContextPanelSearch';
import { ContextPanelTemplates } from './ContextPanelTemplates';

export interface ContextPanelProps {
  /** 默认模板列表 */
  templates?: ContextTemplateItem[];
  /** 自定义渲染（优先级最高） */
  renderCustom?: () => ReactNode;
  /** 点击模板回调 */
  onTemplateClick?: (template: ContextTemplateItem) => void;
  /** 用户信息 */
  profile?: ContextPanelProfile;
}

/**
 * ContextPanel：右侧上下文面板。
 * - 支持默认模板 + 自定义渲染。
 */
export const ContextPanel = ({
  templates = [],
  renderCustom,
  onTemplateClick,
  profile,
}: ContextPanelProps) => {
  const custom = renderCustom?.();
  if (custom) {
    return <>{custom}</>;
  }

  if (templates.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <ContextPanelHeader profile={profile} />
        <ContextPanelInfoList profile={profile} />
        <ContextPanelSearch />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ContextPanelHeader profile={profile} />
      <ContextPanelInfoList profile={profile} />
      <ContextPanelTemplates
        templates={templates}
        onTemplateClick={onTemplateClick}
      />
      <ContextPanelSearch />
    </div>
  );
};
