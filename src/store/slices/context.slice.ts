import type { ReactNode } from 'react';
import type { StateCreator } from 'zustand';
import type {
  ContextPanelProfile,
  ContextTemplateItem,
} from '@/interfaces/context.interface';
import { defaultProfile, defaultTemplates } from '../mock/chat.default';

/**
 * Context Slice：宿主上下文（客户画像、模板等）。
 */
export interface ContextState extends Record<string, unknown> {
  /** 客户画像或业务上下文 */
  profile?: ContextPanelProfile;
  /** 模板列表（可注入 Composer） */
  templates?: ContextTemplateItem[];
  /** 自定义上下文面板渲染 */
  renderContextPanel?: () => ReactNode;
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
  context: {
    profile: defaultProfile,
    templates: defaultTemplates,
  },
  actions: {
    setContext: (payload: Partial<ContextState>) =>
      set((state) => ({
        context: { ...state.context, ...payload },
      })),
  },
});
