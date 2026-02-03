import type { ReactNode } from 'react';
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import {
  useActions,
  useConversation,
  useLanguage,
  useNetwork,
  useProfile,
  useStrategy,
  useTheme,
} from '@/store';
import { ComposerToolbar } from '../composer/ComposerToolbar';
import { ContextPanel } from '../context/ContextPanel';
import { ConversationHeader } from '../conversation/ConversationHeader';
import { ConversationList } from '../conversation/ConversationList';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { NetworkStatus } from '../toolbar/NetworkStatus';
import { ThemeSwitcher } from '../toolbar/ThemeSwitcher';
import { ChatLayout } from './ChatLayout';
import { ChatTopbar } from './ChatTopbar';

export interface DefaultChatLayoutProps {
  /** 消息区域内容（可选） */
  children?: ReactNode;
}

export const DefaultTools = () => {
  const { status } = useNetwork();
  const { mode } = useTheme();
  const { code } = useLanguage();
  const { setTheme, setLanguage } = useActions();

  return (
    <div className="flex items-center gap-4">
      <NetworkStatus status={status} />

      <div className="flex gap-1">
        <LanguageSwitcher value={code} onChange={setLanguage} />
        <ThemeSwitcher value={mode} onChange={setTheme} />
      </div>
    </div>
  );
};

/**
 * DefaultChatLayout：默认布局（All-in-One 模式）。
 *
 * @example
 * <ChatContainer locale="zh-CN">
 *   <DefaultChatLayout />
 * </ChatContainer>
 *
 * @example 自定义消息区域
 * <ChatContainer locale="zh-CN">
 *   <DefaultChatLayout>
 *     <CustomMessageList />
 *   </DefaultChatLayout>
 * </ChatContainer>
 */
export const DefaultChatLayout = ({ children }: DefaultChatLayoutProps) => {
  /* const {
    strategy,
    conversation,
    profile: profileState,
    actions,
  } = useChatStore(); */

  const strategy = useStrategy();
  const conversation = useConversation();
  const profileState = useProfile();
  const actions = useActions();

  const conversationTitle = conversation.activeConversation?.user?.name;
  const conversationSubtitle = conversation.activeConversation?.channel;
  const conversationAvatar = conversation.activeConversation?.user?.avatarUrl;

  return (
    <ChatLayout
      className="max-w-[1400px] max-h-[85vh]"
      topbar={
        <ChatTopbar
          title={conversationTitle}
          subtitle={conversationSubtitle}
          avatarUrl={conversationAvatar}
          extra={<DefaultTools />}
        />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader title={conversationTitle}>
              <ChannelFilter
                channels={AvailableChannelTypes}
                activeChannel={strategy.activeChannel}
                onChannelClick={actions.setActiveChannel}
              />
            </ConversationHeader>
          }
        >
          <ConversationList conversations={conversation.conversations} />
        </ConversationPanel>
      }
      composer={
        <ComposerToolbar
          channel={strategy.activeChannel}
          onSend={actions.sendMessage}
        />
      }
      profilePanel={
        <ContextPanel
          profile={profileState.profile}
          templates={profileState.templates}
        />
      }
    >
      {/* 消息区域由 ChatMessageList 渲染 */}
      {children}
    </ChatLayout>
  );
};
