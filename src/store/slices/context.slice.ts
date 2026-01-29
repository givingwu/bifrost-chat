import type { StateCreator } from 'zustand';

/**
 * Context Slice：宿主上下文（客户画像、模板等）。
 */
export interface ContextState extends Record<string, unknown> {
  /** 客户画像或业务上下文 */
  profile?: Record<string, unknown>;
  /** 模板列表（可注入 Composer） */
  templates?: Array<{ id: string; content: string }>;
  /** 自定义上下文面板渲染 */
  renderContextPanel?: () => React.ReactNode;
}

export interface ContextSlice {
  context: ContextState;
  actions: {
    setContext: (payload: Partial<ContextState>) => void;
  };
}

export const createContextSlice: StateCreator<
  ContextSlice,
  [],
  [],
  ContextSlice
> = (set) => ({
  context: {},
  actions: {
    setContext: (payload: Partial<ContextState>) =>
      set((state) => ({
        context: { ...state.context, ...payload },
      })),
  },
});
