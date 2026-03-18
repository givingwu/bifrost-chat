import { Profile, type ProfileAction } from '@/components/profile/Profile';
import { TemplatePanel } from '@/components/template/TemplatePanel';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { ProfileData } from '@/interfaces/profile.interface';
import type { Template } from '@/interfaces/template.interface';

/**
 * 右侧面板组件 Props
 */
export interface ProfilePanelProps {
  /** 客户画像数据 */
  profile: ProfileData | undefined;
  /** 画像操作按钮 */
  profileActions?: ProfileAction[];
  /** 当前激活的会话 ID */
  activeConversationId: string | undefined;
  /** 当前激活的渠道 */
  activeChannel: ChannelTypeEnum;
  /** 正在渲染的模板 ID */
  renderingTemplateId: string | number | undefined;
  /** 模板选择回调 */
  onTemplateSelect: (template: Template) => void;
}

/**
 * 右侧面板组件
 *
 * 包含客户画像和模板面板的右侧区域。
 */
export function ProfilePanel({
  profile,
  profileActions,
  activeConversationId,
  activeChannel,
  renderingTemplateId,
  onTemplateSelect,
}: ProfilePanelProps) {
  return (
    <aside className="flex flex-col w-75 shrink-0 border-l border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 divide-y divide-gray-200/50 dark:divide-white/10">
      {profile && <Profile profile={profile} actions={profileActions} />}
      <div className="flex flex-col flex-1 min-h-0">
        <TemplatePanel
          onTemplateSelect={onTemplateSelect}
          conversationId={activeConversationId}
          currentChannel={activeChannel}
          renderingTemplateId={renderingTemplateId}
        />
      </div>
    </aside>
  );
}
