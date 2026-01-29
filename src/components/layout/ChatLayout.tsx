import type { ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface ChatLayoutProps {
  /** 左侧会话列表 */
  conversation?: ReactNode;
  /** 中间消息区域 */
  messages: ReactNode;
  /** 输入区域 */
  composer: ReactNode;
  /** 右侧上下文面板 */
  contextPanel?: ReactNode;
}

/**
 * ChatLayout：三栏布局容器，复刻 DEMO UI 结构。
 */
export const ChatLayout = ({
  conversation,
  messages,
  composer,
  contextPanel,
}: ChatLayoutProps) => {
  return (
    <div
      data-component="chat-layout"
      className={cn(
        'flex h-[85vh] w-full max-w-[1400px] overflow-hidden rounded-3xl',
        'border border-border bg-card/80 shadow-2xl backdrop-blur-2xl',
      )}
    >
      <aside className="flex w-[320px] flex-col border-r border-border bg-muted/40">
        {conversation}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-card/40">
        <div className="flex-1 overflow-hidden px-6 py-4">{messages}</div>
        <div className="px-6 pb-6">{composer}</div>
      </section>

      <aside className="hidden w-[300px] flex-col border-l border-border bg-muted/40 xl:flex">
        {contextPanel}
      </aside>
    </div>
  );
};
