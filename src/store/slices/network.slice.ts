import type { StateCreator } from 'zustand';
import {
  NetworkQualityEnum,
  NetworkReachabilityEnum,
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
    replaceNetwork: (payload: NetworkState) => void;
  };
}

export const DEFAULT_NETWORK_STATE: NetworkState = {
  status: NetworkStatusEnum.Unknown,
  reachability: NetworkReachabilityEnum.Unknown,
  quality: NetworkQualityEnum.Unknown,
  enableStatusIndicator: false,
};

export const createNetworkSlice: StateCreator<
  NetworkSlice,
  [],
  [],
  NetworkSlice
> = (set) => ({
  network: DEFAULT_NETWORK_STATE,
  actions: {
    setNetwork: (payload: Partial<NetworkState>) =>
      set((state) => ({
        network: { ...state.network, ...payload },
      })),
    replaceNetwork: (payload: NetworkState) =>
      set(() => ({
        network: payload,
      })),
  },
});
