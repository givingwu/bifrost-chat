import type { Meta } from 'storybook-react-rsbuild';
import { StatusIndicator } from '@/components/messages/StatusIndicator';
import { MessageStatusEnum } from '@/interfaces/message.interface';

/**
 * StatusIndicator 组件 Story 文档
 *
 * 展示消息状态指示器的各种用法：
 * - 所有消息状态
 * - 不同尺寸
 */

const meta: Meta<typeof StatusIndicator> = {
  title: 'Messages/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        MessageStatusEnum.Created,
        MessageStatusEnum.Sending,
        MessageStatusEnum.Sent,
        MessageStatusEnum.Delivered,
        MessageStatusEnum.Read,
        MessageStatusEnum.Clicked,
        MessageStatusEnum.Failed,
      ],
      description: '消息状态',
    },
  },
};

export default meta;

/**
 * 基础示例 - 已发送状态
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <StatusIndicator status={MessageStatusEnum.Sent} />
    </div>
  );
};

/**
 * 所有状态 - 展示所有消息状态
 */
export const AllStatuses = () => {
  const statuses: MessageStatusEnum[] = [
    MessageStatusEnum.Created,
    MessageStatusEnum.Sending,
    MessageStatusEnum.Sent,
    MessageStatusEnum.Delivered,
    MessageStatusEnum.Read,
    MessageStatusEnum.Clicked,
    MessageStatusEnum.Failed,
  ];

  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <div
          key={status}
          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
        >
          <StatusIndicator status={status} showLabel />
          <span className="text-sm font-medium">{status}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * 状态说明 - 展示状态含义
 */
export const StatusDescriptions = () => {
  const statusDescriptions = [
    {
      status: MessageStatusEnum.Created,
      label: '已创建',
      desc: '消息已创建，等待发送',
    },
    {
      status: MessageStatusEnum.Sending,
      label: '发送中',
      desc: '消息正在发送',
    },
    {
      status: MessageStatusEnum.Sent,
      label: '已发送',
      desc: '消息已发送到服务器',
    },
    {
      status: MessageStatusEnum.Delivered,
      label: '已送达',
      desc: '消息已送达对方设备',
    },
    { status: MessageStatusEnum.Read, label: '已读', desc: '对方已查看消息' },
    {
      status: MessageStatusEnum.Clicked,
      label: '点击',
      desc: '客户点击了消息内链接或按钮',
    },
    { status: MessageStatusEnum.Failed, label: '失败', desc: '消息发送失败' },
  ];

  return (
    <div className="space-y-3">
      {statusDescriptions.map((item) => (
        <div
          key={item.status}
          className="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-3">
            <StatusIndicator status={item.status} />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 实际应用 - 在消息中使用
 */
export const InMessage = () => {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-sm">Hello!</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs opacity-70">10:30</span>
            <StatusIndicator status={MessageStatusEnum.Read} showLabel />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <p className="text-sm">How are you?</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs opacity-70">10:31</span>
            <StatusIndicator status={MessageStatusEnum.Delivered} showLabel />
          </div>
        </div>
      </div>
    </div>
  );
};
