import type { StateCreator } from 'zustand';
import {
  NetworkQualityEnum,
  type NetworkState,
  NetworkStatusEnum,
} from '@/interfaces/network.interface';

/**
 * Network Slice：网络连接状态。
 */
export interface NetworkSlice {
  network: NetworkState;
  actions: {
    setNetwork: (payload: Partial<NetworkState>) => void;
  };
}

export const createNetworkSlice: StateCreator<
  NetworkSlice,
  [],
  [],
  NetworkSlice
> = (set) => ({
  network: {
    status: NetworkStatusEnum.Disconnected,
    quality: NetworkQualityEnum.Unknown,
  },
  actions: {
    setNetwork: (payload: Partial<NetworkState>) =>
      set((state) => ({
        network: { ...state.network, ...payload },
      })),
  },
});
