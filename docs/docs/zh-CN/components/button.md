---
title: Button 按钮
sidebar_position: 2
---

# Button 按钮

按钮组件用于触发操作。

## 基础用法

<StorybookEmbed 
  storyId="basic-button--default" 
  title="默认按钮"
  height="150"
/>

## 主要按钮

<StorybookEmbed 
  storyId="basic-button--primary" 
  title="主要按钮"
  height="150"
/>

## 次要按钮

<StorybookEmbed 
  storyId="basic-button--secondary" 
  title="次要按钮"
  height="150"
/>

## 尺寸

提供 `sm`、`md`、`lg` 三种尺寸。

<StorybookEmbed 
  storyId="basic-button--sizes" 
  title="不同尺寸"
  height="200"
/>

## 禁用状态

<StorybookEmbed 
  storyId="basic-button--disabled" 
  title="禁用按钮"
  height="150"
/>

## API

### ButtonProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | `'default' \| 'primary' \| 'secondary'` | `'default'` | 按钮类型 |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 按钮大小 |
| disabled | `boolean` | `false` | 是否禁用 |
| children | `ReactNode` | - | 按钮内容 |
| onClick | `(event: MouseEvent) => void` | - | 点击事件 |

## 使用示例

```typescript
import { Button } from '@feoe/bifrost-chat';

function Example() {
  return (
    <div>
      <Button variant="default">默认按钮</Button>
      <Button variant="primary">主要按钮</Button>
      <Button variant="secondary">次要按钮</Button>
      <Button size="sm">小按钮</Button>
      <Button size="lg">大按钮</Button>
      <Button disabled>禁用按钮</Button>
    </div>
  );
}
```

## 源码

[Button.tsx](https://git.kuainiujinke.com/feoe/bifrost-chat/-/blob/main/src/components/Button.tsx)
