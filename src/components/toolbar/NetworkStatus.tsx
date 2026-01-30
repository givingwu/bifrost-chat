import type {
  NetworkState,
  NetworkStatus as NetworkStatusEnum,
} from '@/interfaces/network.interface';
import { cn } from '@/utils/class.util';

const statusMap: Record<NetworkStatusEnum, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
};

const statusClassMap: Record<
  NetworkStatusEnum,
  { container: string; dot: string }
> = {
  connected: {
    container: 'bg-success/10 text-success',
    dot: 'bg-success',
  },
  connecting: {
    container: 'bg-warning/10 text-warning',
    dot: 'bg-warning animate-pulse',
  },
  disconnected: {
    container: 'bg-error/10 text-error',
    dot: 'bg-error',
  },
};

/**
 * Show network connection status.
 */
export const NetworkStatus = ({ status }: NetworkState) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center space-x-2 rounded-full px-3 py-1.5 text-xs font-medium',
        statusClassMap[status].container,
      )}
    >
      <div className={cn('h-2 w-2 rounded-full', statusClassMap[status].dot)} />
      <span>{statusMap[status]}</span>
    </div>
  );
};
