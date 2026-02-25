---
title: Button
sidebar_position: 2
---

# Button

Button component for triggering actions.

## Basic Usage

<StorybookEmbed 
  storyId="basic-button--default" 
  title="Default Button"
  height="150"
/>

## Primary Button

<StorybookEmbed 
  storyId="basic-button--primary" 
  title="Primary Button"
  height="150"
/>

## Secondary Button

<StorybookEmbed 
  storyId="basic-button--secondary" 
  title="Secondary Button"
  height="150"
/>

## Sizes

Available in `sm`, `md`, and `lg` sizes.

<StorybookEmbed 
  storyId="basic-button--sizes" 
  title="Different Sizes"
  height="200"
/>

## Disabled State

<StorybookEmbed 
  storyId="basic-button--disabled" 
  title="Disabled Button"
  height="150"
/>

## API

### ButtonProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| variant | `'default' \| 'primary' \| 'secondary'` | `'default'` | Button variant |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| disabled | `boolean` | `false` | Whether the button is disabled |
| children | `ReactNode` | - | Button content |
| onClick | `(event: MouseEvent) => void` | - | Click event handler |

## Usage Example

```typescript
import { Button } from '@feoe/bifrost-chat';

function Example() {
  return (
    <div>
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
```

## Source Code

[Button.tsx](https://git.kuainiujinke.com/feoe/bifrost-chat/-/blob/main/src/components/Button.tsx)
