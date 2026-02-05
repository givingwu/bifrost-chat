import type { StateCreator } from 'zustand';
import type { ProfileData } from '@/interfaces/profile.interface';
import type { MessageTemplate } from '@/interfaces/template.interface';
import { defaultProfile, defaultTemplates } from '../mock/chat.default';

/**
 * Profile Slice：宿主上下文（客户画像、模板等）。
 */
export interface ProfileState extends Record<string, unknown> {
  /** 客户画像或业务上下文 */
  profile?: ProfileData;
  /** 模板列表（可注入 Composer） */
  templates?: MessageTemplate[];
}

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
    profile: defaultProfile,
    templates: defaultTemplates,
  },
  actions: {
    setProfile: (payload: Partial<ProfileState>) =>
      set((state) => ({
        profile: { ...state.profile, ...payload },
      })),
  },
});
