import type { StateCreator } from 'zustand';
import {
  type NetworkState,
  NetworkStatus,
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
    status: NetworkStatus.Disconnected,
  },
  actions: {
    setNetwork: (payload: Partial<NetworkState>) =>
      set((state) => ({
        network: { ...state.network, ...payload },
      })),
  },
});
