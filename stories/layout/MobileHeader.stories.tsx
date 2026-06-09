import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { ConfigProvider } from '@/index';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import '@/styles/theme.css';

function Wrapper({
  children,
  dark,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.ZhCN },
        strategy: {
          activeChannel: ChannelTypeEnum.WhatsApp,
          allowedChannels: [ChannelTypeEnum.WhatsApp],
        },
      }}
    >
      <div
        className={dark ? 'dark' : ''}
        style={{ width: 390, margin: '0 auto' }}
      >
        {children}
      </div>
    </ConfigProvider>
  );
}

const meta: Meta<typeof MobileHeader> = {
  title: 'Layout/MobileHeader',
  component: MobileHeader,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof MobileHeader>;

export const WhatsApp: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="叶+义"
        subTitle="WhatsApp 会话"
        avatarUrl="https://i.pravatar.cc/64?u=whatsapp"
        channel={ChannelTypeEnum.WhatsApp}
        showCloseButton
        onClose={() => console.log('close')}
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WhatsApp 渠道：绿色品牌背景 + 用户头像。',
      },
    },
  },
};

export const SMS: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="张三"
        subTitle="SMS 会话"
        avatarUrl="https://i.pravatar.cc/64?u=sms"
        channel={ChannelTypeEnum.SMS}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SMS 渠道：蓝色品牌背景。',
      },
    },
  },
};

export const Email: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="support@example.com"
        subTitle="Email 会话"
        avatarUrl={undefined}
        channel={ChannelTypeEnum.Email}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Email 渠道：橙色品牌背景，无头像时渲染 Email 渠道图标。',
      },
    },
  },
};

export const Viber: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="李四"
        subTitle="Viber 会话"
        avatarUrl={undefined}
        channel={ChannelTypeEnum.Viber}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Viber 渠道：紫色品牌背景，无头像时渲染 Viber 渠道图标。',
      },
    },
  },
};

export const WaAgent: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="王五"
        subTitle="WaAgent 会话"
        avatarUrl="https://i.pravatar.cc/64?u=waagent"
        channel={ChannelTypeEnum.WaAgent}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WaAgent 渠道：深绿品牌背景。',
      },
    },
  },
};

export const RCS: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="赵六"
        subTitle="RCS 会话"
        avatarUrl={undefined}
        channel={ChannelTypeEnum.RCS}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'RCS 渠道：青色品牌背景，无头像时渲染 RCS 渠道图标。',
      },
    },
  },
};

export const AllChannels: Story = {
  render: () => (
    <Wrapper>
      <div className="flex flex-col gap-2">
        {(
          [
            ChannelTypeEnum.SMS,
            ChannelTypeEnum.WhatsApp,
            ChannelTypeEnum.WaAgent,
            ChannelTypeEnum.Email,
            ChannelTypeEnum.Viber,
            ChannelTypeEnum.RCS,
          ] as const
        ).map((channel) => (
          <MobileHeader
            key={channel}
            title={`${channel} 渠道`}
            subTitle={`${channel} 会话`}
            avatarUrl={undefined}
            channel={channel}
            showCloseButton={false}
          />
        ))}
      </div>
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: '全渠道对比：无头像时每个渠道显示对应品牌色背景和渠道图标。',
      },
    },
  },
};

export const WithAvatar: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="叶+义"
        subTitle="WhatsApp 会话"
        avatarUrl="https://i.pravatar.cc/64?u=avatar-demo"
        channel={ChannelTypeEnum.WhatsApp}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: '有头像时渲染用户头像，背景仍为渠道品牌色。',
      },
    },
  },
};

export const WithoutAvatar: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="叶+义"
        subTitle="WhatsApp 会话"
        avatarUrl={undefined}
        channel={ChannelTypeEnum.WhatsApp}
        showCloseButton
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: '无头像时渲染渠道图标作为占位，白色图标在品牌色底上。',
      },
    },
  },
};

export const LoadingSkeleton: Story = {
  render: () => (
    <Wrapper>
      <div className="flex flex-col gap-2">
        <MobileHeader
          title=""
          subTitle=""
          avatarUrl={undefined}
          channel={ChannelTypeEnum.WhatsApp}
          loading
          showCloseButton
        />
        <MobileHeader
          title=""
          subTitle=""
          avatarUrl={undefined}
          channel={ChannelTypeEnum.SMS}
          loading
          showCloseButton
        />
        <MobileHeader
          title=""
          subTitle=""
          avatarUrl={undefined}
          channel={ChannelTypeEnum.Viber}
          loading
          showCloseButton={false}
        />
      </div>
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '初始化加载状态：骨架屏动画，背景色跟随渠道品牌色，内容区用 pulse 占位块。',
      },
    },
  },
};

export const NoCloseButton: Story = {
  render: () => (
    <Wrapper>
      <MobileHeader
        title="嵌入模式"
        subTitle="SMS 会话"
        avatarUrl={undefined}
        channel={ChannelTypeEnum.SMS}
        showCloseButton={false}
      />
    </Wrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: '不显示关闭按钮，适用于全屏嵌入场景。',
      },
    },
  },
};
