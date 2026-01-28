import type {
  NetworkState,
  NetworkStatus as NetworkStatusEnum,
} from '@/interfaces/network.interface';

const statusMap: Record<NetworkStatusEnum, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
};

const statusClassMap: Record<NetworkStatusEnum, string> = {
  connected: 'bg-success/15 text-success',
  connecting: 'bg-warning/15 text-warning',
  disconnected: 'bg-danger/15 text-danger',
};

/**
 * Show network connection status.
 */
export const NetworkStatus = ({ status }: NetworkState) => {
  return (
    <div
      data-component="network-status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusClassMap[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{statusMap[status]}</span>
    </div>
  );
};
