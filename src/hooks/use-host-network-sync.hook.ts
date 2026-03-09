import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { NetworkReachabilityEnum } from '@/interfaces/network.interface';
import type { INetworkService } from '@/services/network.service';
import { useActions } from '@/store';
import { DEFAULT_NETWORK_STATE } from '@/store/slices/network.slice';

function syncOnlineManager(reachability: NetworkReachabilityEnum) {
  onlineManager.setOnline(reachability !== NetworkReachabilityEnum.Offline);
}

/**
 * 同步 Host 注入的网络状态到 SDK Store 与 React Query。
 */
export function useHostNetworkSync(networkService?: INetworkService) {
  const { replaceNetwork } = useActions();

  useEffect(() => {
    if (!networkService) {
      replaceNetwork(DEFAULT_NETWORK_STATE);
      syncOnlineManager(NetworkReachabilityEnum.Online);
      return;
    }

    const applySnapshot = (
      snapshot: ReturnType<INetworkService['getSnapshot']>,
    ) => {
      replaceNetwork(snapshot);
      syncOnlineManager(snapshot.reachability);
    };

    applySnapshot(networkService.getSnapshot());

    return networkService.subscribe((snapshot) => {
      applySnapshot(snapshot);
    });
  }, [networkService, replaceNetwork]);
}
