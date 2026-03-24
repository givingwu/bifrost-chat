import type { ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface ChatLayoutProps {
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  /** 左侧会话列表 */
  conversationPanel?: ReactNode;
  /** 顶部栏 */
  topbar?: ReactNode;
  /** 消息区域 */
  children: ReactNode;
  /** 中间输入区域 */
  composer?: ReactNode;
  /** 右侧上下文面板 */
  profilePanel?: ReactNode;
}

/**
 * ChatLayout：三栏布局容器，复刻 DEMO UI 结构。
 */
export const ChatLayout = ({
  className,
  containerClassName,
  style,
  topbar,
  children,
  conversationPanel,
  composer,
  profilePanel,
}: ChatLayoutProps) => {
  return (
    <div
      data-component="chat-layout"
      className={cn(
        'flex w-full h-full overflow-hidden rounded-3xl shadow-2xl',
        'border border-border bg-card/80 backdrop-blur-2xl',
        className,
      )}
      style={style}
    >
      {conversationPanel}

      <section className={cn(containerClassName, 'flex flex-col flex-1')}>
        {topbar}

        <main className="flex flex-1 overflow-hidden">
          <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-card/40">
            {children}
            {composer}
          </section>

          {profilePanel}
        </main>
      </section>
    </div>
  );
};
