import { ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import type { ChannelType } from '@/interfaces/channel.interface';

export const ComposerHint = ({ channel }: { channel?: ChannelType }) => {
  const hint = useMemo(() => {
    if (channel === 'sms') {
      return 'SMS · 1 segment';
    }
    if (channel === 'whatsapp') {
      return 'Secure Connection';
    }
    return null;
  }, [channel]);

  if (!hint) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-[10px] text-text-muted">
      {channel === 'whatsapp' && (
        <ShieldCheck className="h-3 w-3 text-green-500" />
      )}
      <span>{hint}</span>
    </div>
  );
};
