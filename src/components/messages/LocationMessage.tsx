import { MapPin } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';

export interface LocationMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * LocationMessage：位置消息组件。
 * - 渲染位置消息，显示地图预览和地址信息。
 */
export const LocationMessage = ({ content }: LocationMessageProps) => {
  if (!('text' in content)) {
    return null;
  }

  let data: {
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
  } | null = null;

  try {
    data = JSON.parse(content.text);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="p-3 text-xs text-gray-400 dark:text-gray-500">
        Invalid location data.
      </div>
    );
  }

  const mapUrl =
    data.latitude && data.longitude
      ? `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`
      : '';

  return (
    <div className="flex max-w-sm flex-col gap-2">
      {mapUrl && (
        <div className="h-40 w-full overflow-hidden rounded-lg">
          <iframe
            src={mapUrl}
            title="Location"
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          {data.name && (
            <p className="text-sm font-medium text-text">{data.name}</p>
          )}
          {data.address && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {data.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
