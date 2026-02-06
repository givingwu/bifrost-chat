import type { StateCreator } from 'zustand';
import type { ProfileData } from '@/interfaces/profile.interface';

/**
 * Profile Slice：宿主上下文（客户画像）。
 *
 * @description
 * 只保留客户画像数据，模板数据由 React Query 管理。
 */
export interface ProfileState extends Record<string, unknown> {
  /** 客户画像或业务上下文 */
  profile?: ProfileData;
}

/**
 * Profile 客户画像
 */
export interface ProfileSlice {
  profile: ProfileState;
  actions: {
    setProfile: (payload: Partial<ProfileState>) => void;
  };
}

export const createProfileSlice: StateCreator<
  ProfileSlice,
  [],
  [],
  ProfileSlice
> = (set) => ({
  profile: {
    profile: undefined,
  },
  actions: {
    setProfile: (payload: Partial<ProfileState>) =>
      set((state) => ({
        profile: { ...state.profile, ...payload },
      })),
  },
});
