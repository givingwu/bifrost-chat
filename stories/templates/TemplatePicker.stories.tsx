import type { Meta, StoryObj } from '@storybook/react';
import {
  DEFAULT_TEMPLATES,
  TemplatePicker,
} from '@/components/template/TemplatePicker';
import '@/styles/theme.css';
import { useState } from 'react';
import { Button } from '@/components';

const meta: Meta<typeof TemplatePicker> = {
  title: 'Template/TemplatePicker',
  component: TemplatePicker,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex h-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof TemplatePicker>;

export const Default: Story = {
  args: {
    open: true,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
    position: { x: 0, y: 0 },
  },
};

export const WithCustomTemplates: Story = {
  args: {
    open: true,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
};

export const WithPosition: Story = {
  args: {
    open: true,
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
    position: { x: 100, y: 200 },
  },
};

export const Empty: Story = {
  args: {
    open: true,
    templates: [],
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
};

export const Closed: Story = {
  args: {
    templates: DEFAULT_TEMPLATES,
    onTemplateSelect: (template) => console.log('Selected:', template),
    onClose: () => console.log('Close'),
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);

    return (
      <div className="flex flex-col">
        <Button onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Open'}
        </Button>
        <TemplatePicker {...args} open={open} />
      </div>
    );
  },
};
