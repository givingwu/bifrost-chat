import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  Mail,
  MessageSquare,
  Moon,
  Paperclip,
  Phone,
  Smartphone,
  Smile,
  Sun,
  WifiOff,
} from 'lucide-react';
import React from 'react';
import { cn } from '@/utils/class.util';
import '@/styles/theme.css';

const SECTION_TITLES = {
  Foundations: '1. Foundations: Colors & Typography',
  Atoms: '2. Atoms: Iconography & Avatars',
  AgentStatus: '3. enum AgentStatus (坐席状态)',
  MessageStatus: '4. enum MessageStatus (消息流转状态)',
  ChannelType: '5. enum ChannelType (渠道标识)',
  NetworkStatus: '6. enum NetworkStatus (网络连接)',
};

const COLORS = [
  {
    name: 'Brand/Primary',
    token: 'bg-primary',
    hex: '#3B82F6',
    darkToken: 'bg-primary',
    usage: 'Sent messages, Active states',
  },
  {
    name: 'Success/Online',
    token: 'bg-success',
    hex: '#22C55E',
    darkToken: 'bg-success',
    usage: 'Online status, Connected',
  },
  {
    name: 'Warning/Busy',
    token: 'bg-warning',
    hex: '#F97316',
    darkToken: 'bg-warning',
    usage: 'Busy status',
  },
  {
    name: 'Error/Failed',
    token: 'bg-error',
    hex: '#EF4444',
    darkToken: 'bg-error',
    usage: 'Failed messages, Disconnected',
  },
  {
    name: 'Special/InCall',
    token: 'bg-in-call',
    hex: '#A855F7',
    darkToken: 'bg-in-call',
    usage: 'In Call status',
  },
];

const meta: Meta = {
  title: 'Design/DesignSystem',
};

export default meta;

export const DesignSystem: StoryObj = {
  render: () => <DesignSystemBoard />,
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-8 mt-16 border-b border-gray-200 pb-4 dark:border-gray-700">
    <h2 className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
      {title}
    </h2>
  </div>
);

const SplitView = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">{children}</div>
);

const ModeContainer = ({
  mode,
  children,
  className,
}: {
  mode: 'light' | 'dark';
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-3xl border p-8 transition-all duration-300',
      mode === 'light'
        ? 'border-gray-200 bg-gray-50 text-gray-900'
        : 'border-gray-800 bg-gray-900 text-white',
      className,
    )}
  >
    <div className="absolute right-4 top-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30">
      {mode === 'light' ? (
        <Sun className="h-3 w-3" />
      ) : (
        <Moon className="h-3 w-3" />
      )}
      {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
    </div>
    {children}
  </div>
);

const ColorPalette = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.Foundations} />
    <SplitView>
      <ModeContainer mode="light">
        <div className="space-y-3">
          {COLORS.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full shadow-inner ring-1 ring-black/5',
                    c.token,
                  )}
                />
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.usage}</p>
                </div>
              </div>
              <code className="text-xs font-mono text-gray-400">{c.token}</code>
            </div>
          ))}
        </div>
      </ModeContainer>
      <ModeContainer mode="dark">
        <div className="space-y-3">
          {COLORS.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full shadow-lg ring-1 ring-white/10',
                    c.darkToken,
                  )}
                />
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.usage}</p>
                </div>
              </div>
              <code className="text-xs font-mono text-gray-500">
                {c.darkToken}
              </code>
            </div>
          ))}
        </div>
      </ModeContainer>
    </SplitView>
  </div>
);

const IconGrid = ({ mode }: { mode: 'light' | 'dark' }) => {
  const icons = [
    { icon: <Smartphone />, label: 'SMS' },
    { icon: <MessageSquare />, label: 'WhatsApp' },
    { icon: <Mail />, label: 'Email' },
    { icon: <Paperclip />, label: 'Attach' },
    { icon: <Smile />, label: 'Emoji' },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {icons.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex h-20 w-20 flex-col items-center justify-center rounded-2xl border backdrop-blur-md transition-all',
            mode === 'dark'
              ? 'border-white/10 bg-white/5 hover:bg-white/10'
              : 'border-gray-200/50 bg-white/60 shadow-sm hover:bg-white',
          )}
        >
          <div
            className={cn(
              'mb-2',
              mode === 'dark' ? 'text-gray-200' : 'text-gray-700',
            )}
          >
            {React.cloneElement(
              item.icon as React.ReactElement,
              {
                className: 'h-6 w-6',
              } as React.HTMLAttributes<HTMLElement>,
            )}
          </div>
          <span className="text-[10px] font-medium opacity-60">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const AtomsSection = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.Atoms} />
    <SplitView>
      <ModeContainer mode="light">
        <IconGrid mode="light" />
      </ModeContainer>
      <ModeContainer mode="dark">
        <IconGrid mode="dark" />
      </ModeContainer>
    </SplitView>
  </div>
);

const AgentAvatar = ({
  status,
  mode,
}: {
  status: 'Online' | 'Offline' | 'Busy' | 'InCall';
  mode: 'light' | 'dark';
}) => {
  const baseClasses = cn(
    'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2',
    mode === 'light' ? 'border-white' : 'border-gray-800',
  );

  const badgeMap = {
    Online: <div className={cn(baseClasses, 'bg-success')} />,
    Offline: <div className={cn(baseClasses, 'bg-muted-foreground/60')} />,
    Busy: <div className={cn(baseClasses, 'bg-warning')} />,
    InCall: (
      <div
        className={cn(
          baseClasses,
          'flex items-center justify-center bg-in-call',
        )}
      >
        <Phone className="h-1.5 w-1.5 text-white" fill="currentColor" />
      </div>
    ),
  } satisfies Record<string, React.ReactNode>;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1683342599486-761e6afce7e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100"
          alt="Avatar"
          className="h-14 w-14 rounded-full bg-gray-200 object-cover shadow-sm"
        />
        {badgeMap[status]}
      </div>
      <code className="text-xs font-mono opacity-60">{status}</code>
    </div>
  );
};

const AgentStatusSection = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.AgentStatus} />
    <SplitView>
      <ModeContainer mode="light">
        <div className="flex justify-around">
          <AgentAvatar status="Online" mode="light" />
          <AgentAvatar status="Offline" mode="light" />
          <AgentAvatar status="Busy" mode="light" />
          <AgentAvatar status="InCall" mode="light" />
        </div>
      </ModeContainer>
      <ModeContainer mode="dark">
        <div className="flex justify-around">
          <AgentAvatar status="Online" mode="dark" />
          <AgentAvatar status="Offline" mode="dark" />
          <AgentAvatar status="Busy" mode="dark" />
          <AgentAvatar status="InCall" mode="dark" />
        </div>
      </ModeContainer>
    </SplitView>
  </div>
);

const MessageBubble = ({
  status,
}: {
  status: 'Sending' | 'Sent' | 'Delivered' | 'Read' | 'Failed';
}) => {
  const bubbleClass =
    'max-w-[200px] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-md shadow-primary/20';

  const getIndicator = () => {
    switch (status) {
      case 'Sending':
        return (
          <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin text-gray-400" />
        );
      case 'Sent':
        return <Check className="h-3.5 w-3.5 text-primary-foreground" />;
      case 'Delivered':
        return (
          <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
        );
      case 'Read':
        return <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />;
      case 'Failed':
        return (
          <button
            type="button"
            className="ml-2 rounded-full p-1 transition-colors hover:bg-error/10"
          >
            <AlertCircle className="h-5 w-5 text-error" />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-4 flex w-full items-center justify-end gap-1">
      {status === 'Sending' && getIndicator()}
      {status === 'Failed' && getIndicator()}

      <div className={bubbleClass}>
        <p className="text-sm">Hello World</p>
        {status !== 'Sending' && status !== 'Failed' && (
          <div className="mt-1 flex justify-end">{getIndicator()}</div>
        )}
      </div>

      <div className="ml-4 w-24 text-right text-xs font-mono opacity-40">
        {status}
      </div>
    </div>
  );
};

const MessageStatusSection = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.MessageStatus} />
    <SplitView>
      <ModeContainer mode="light">
        <div className="flex flex-col">
          <MessageBubble status="Sending" />
          <MessageBubble status="Sent" />
          <MessageBubble status="Delivered" />
          <MessageBubble status="Read" />
          <MessageBubble status="Failed" />
        </div>
      </ModeContainer>
      <ModeContainer mode="dark">
        <div className="flex flex-col">
          <MessageBubble status="Sending" />
          <MessageBubble status="Sent" />
          <MessageBubble status="Delivered" />
          <MessageBubble status="Read" />
          <MessageBubble status="Failed" />
        </div>
      </ModeContainer>
    </SplitView>
  </div>
);

const ChannelBadge = ({
  type,
  mode,
}: {
  type: 'SMS' | 'WhatsApp' | 'Email';
  mode: 'light' | 'dark';
}) => {
  let icon: React.ReactNode;
  let bgClass = '';
  let textClass = '';
  let label = '';

  switch (type) {
    case 'SMS':
      icon = <Smartphone className="h-4 w-4" />;
      bgClass = mode === 'light' ? 'bg-muted' : 'bg-muted/60';
      textClass = mode === 'light' ? 'text-text-muted' : 'text-text-muted';
      label = 'SMS';
      break;
    case 'WhatsApp':
      icon = <MessageSquare className="h-4 w-4" />;
      bgClass = 'bg-success/10';
      textClass = 'text-success';
      label = 'WhatsApp';
      break;
    case 'Email':
      icon = <Mail className="h-4 w-4" />;
      bgClass = 'bg-primary/10';
      textClass = 'text-primary';
      label = 'Email';
      break;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border border-transparent px-4 py-2 backdrop-blur-md',
          bgClass,
          textClass,
        )}
      >
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <code className="text-xs font-mono opacity-50">{type}</code>
    </div>
  );
};

const ChannelTypeSection = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.ChannelType} />
    <SplitView>
      <ModeContainer mode="light">
        <div className="flex h-24 items-center justify-around">
          <ChannelBadge type="SMS" mode="light" />
          <ChannelBadge type="WhatsApp" mode="light" />
          <ChannelBadge type="Email" mode="light" />
        </div>
      </ModeContainer>
      <ModeContainer mode="dark">
        <div className="flex h-24 items-center justify-around">
          <ChannelBadge type="SMS" mode="dark" />
          <ChannelBadge type="WhatsApp" mode="dark" />
          <ChannelBadge type="Email" mode="dark" />
        </div>
      </ModeContainer>
    </SplitView>
  </div>
);

const NetworkBar = ({
  status,
  mode,
}: {
  status: 'Connected' | 'Connecting' | 'Disconnected';
  mode: 'light' | 'dark';
}) => {
  let containerClass = '';
  let dotClass = '';
  let text = '';
  let icon: React.ReactNode = null;

  switch (status) {
    case 'Connected':
      containerClass =
        mode === 'light'
          ? 'border-gray-200 bg-white/60'
          : 'border-gray-700 bg-gray-800/60';
      dotClass = 'bg-success';
      text = 'Connected';
      break;
    case 'Connecting':
      containerClass = 'border-warning/20 bg-warning/10';
      dotClass = 'animate-pulse bg-warning';
      text = 'Connecting...';
      icon = <Loader2 className="mr-2 h-3 w-3 animate-spin text-warning" />;
      break;
    case 'Disconnected':
      containerClass = 'bg-error text-white border-error';
      dotClass = 'hidden';
      text = 'Disconnected';
      icon = <WifiOff className="mr-2 h-3 w-3 text-white" />;
      break;
  }

  return (
    <div className="mb-4">
      <div
        className={cn(
          'flex h-10 w-full items-center justify-center rounded-lg border px-4 backdrop-blur-md transition-all',
          containerClass,
        )}
      >
        {icon}
        <div className={cn('mr-2 h-2 w-2 rounded-full', dotClass)} />
        <span
          className={cn(
            'text-xs font-semibold',
            status === 'Disconnected'
              ? 'text-white'
              : mode === 'light'
                ? 'text-gray-700'
                : 'text-gray-200',
          )}
        >
          {text}
        </span>
      </div>
      <code className="block text-center text-[10px] font-mono opacity-40">
        {status}
      </code>
    </div>
  );
};

const NetworkStatusSection = () => (
  <div>
    <SectionHeader title={SECTION_TITLES.NetworkStatus} />
    <SplitView>
      <ModeContainer mode="light">
        <div className="space-y-4">
          <NetworkBar status="Connected" mode="light" />
          <NetworkBar status="Connecting" mode="light" />
          <NetworkBar status="Disconnected" mode="light" />
        </div>
      </ModeContainer>
      <ModeContainer mode="dark">
        <div className="space-y-4">
          <NetworkBar status="Connected" mode="dark" />
          <NetworkBar status="Connecting" mode="dark" />
          <NetworkBar status="Disconnected" mode="dark" />
        </div>
      </ModeContainer>
    </SplitView>
  </div>
);

const DesignSystemBoard = () => (
  <div className="min-h-screen overflow-y-auto bg-gray-100 p-6 font-sans antialiased dark:bg-black md:p-12">
    <div className="mx-auto max-w-7xl pb-20">
      <header className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl">
          Design System Spec v2.0
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Omnichannel Chat SDK • Consolidated UI Dictionary
        </p>
      </header>

      <div className="space-y-4">
        <ColorPalette />
        <AtomsSection />
        <AgentStatusSection />
        <MessageStatusSection />
        <ChannelTypeSection />
        <NetworkStatusSection />
      </div>
    </div>
  </div>
);
