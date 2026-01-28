import type { StateCreator } from 'zustand';

/**
 * UI Slice：控制聊天框显隐、加载态等 UI 状态。
 */
export interface UiState {
  /** 是否打开聊天窗口 */
  isOpen: boolean;
  /** 是否最小化 */
  isMinimized: boolean;
  /** 是否处于加载态 */
  loading: boolean;
  /** UI 层错误提示 */
  error?: string;
}

export interface UiSlice {
  ui: UiState;
  actions: {
    setUi: (payload: Partial<UiState>) => void;
  };
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  ui: {
    isOpen: true,
    isMinimized: false,
    loading: false,
  },
  actions: {
    setUi: (payload: Partial<UiState>) =>
      set((state) => ({
        ui: { ...state.ui, ...payload },
      })),
  },
});
