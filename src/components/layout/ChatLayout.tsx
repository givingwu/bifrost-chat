import type { ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface ChatLayoutProps {
  className?: string;
  styles?: React.CSSProperties;
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
  styles,
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
        'flex w-full overflow-hidden rounded-3xl shadow-2xl',
        'border border-border bg-card/80 backdrop-blur-2xl',
        className,
      )}
      style={styles}
    >
      {conversationPanel}

      <section className="flex h-full flex-1 flex-col">
        {topbar}

        <main className="flex flex-1">
          <section className="relative flex min-w-0 flex-1 flex-col bg-card/40">
            {children}

            {composer && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                {composer}
              </div>
            )}
          </section>

          {profilePanel && (
            // <aside className="hidden w-[300px] flex-col border-l border-border bg-muted/40 xl:flex"></aside>
            <aside className="flex w-[300px] shrink-0 flex-col border-l border-border bg-muted/40">
              {profilePanel}
            </aside>
          )}
        </main>
      </section>
    </div>
  );
};
