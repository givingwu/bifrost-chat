# Composer Toolbar 重新设计

## 概述

重新设计 ComposerInput 和 ComposerToolbar 的布局结构，将所有操作按钮整合到输入框底部的工具栏中，实现更紧凑和统一的视觉体验。

## 当前实现（As-Is）

### ComposerToolbar.tsx 结构

```
<div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t">
  <form className="flex flex-col gap-3">
    {/* 附件预览 */}
    {attachments.length > 0 && <AttachmentPreview />}

    {/* 音频录音器 */}
    {isRecording && <AudioRecorder />}

    {/* 错误提示 */}
    {sendError && <div>错误提示</div>}

    {/* 主操作区域 */}
    <div className="flex items-center gap-3">
      <ComposerAttachments />      {/* 附件按钮 */}
      <ComposerInput />               {/* 输入框（带内部表情按钮和字符计数） */}
      <ComposerActions />             {/* 发送/语音/清空按钮 */}
    </div>

    {/* 底部信息栏 */}
    <div className="mt-2 flex items-center justify-between">
      <ChannelSwitcher />            {/* 渠道切换器 */}
      <div className="flex items-center gap-3">
        <ComposerHint />              {/* 渠道提示 */}
        <span>字符计数</span>        {/* 字符计数 */}
      </div>
    </div>
  </form>
</div>
```

### ComposerInput.tsx 结构

```
<fieldset className="relative flex-1 border-0 p-0 m-0">
  <textarea
    rows={3}
    className="w-full rounded-sm border border-transparent bg-gray-200/50 dark:bg-white/10 px-2 py-1.5"
    // 为字符计数和表情按钮留出空间
    showEmojiButton && 'pr-14'
  />

  {/* 字符计数显示在输入框右侧 */}
  {showEmojiButton && (
    <span className="absolute right-14 top-1/2 -translate-y-1/2">
      {value.length}/{maxLength}
    </span>
  )}

  {/* 表情按钮 */}
  {showEmojiButton && (
    <EmojiPickerButton className="absolute inset-y-0 right-3" />
  )}
</fieldset>
```

## 目标架构（To-Be）

### 整体布局结构

```
<div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t">
  <form className="flex flex-col gap-3">
    {/* 附件预览 */}
    {attachments.length > 0 && <AttachmentPreview />}

    {/* 音频录音器 */}
    {isRecording && <AudioRecorder />}

    {/* 错误提示 */}
    {sendError && <div>错误提示</div>}

    {/* 输入框区域（带视觉包裹） */}
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5 overflow-hidden">
      <ComposerInput />              {/* 纯净的输入框，无内部按钮 */}
    </div>

    {/* 底部工具栏 - 所有操作按钮 */}
    <div className="flex items-center justify-between mt-2">
      {/* 左侧：渠道相关 */}
      <div className="flex items-center gap-2">
        <ChannelSwitcher compact />  {/* 左1: 渠道切换器（紧凑模式） */}
        <ComposerHint />              {/* 左2: 渠道提示 */}
        <ComposerCharCount />         {/* 左3: 字符计数 */}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1">
        <ComposerAttachments />      {/* 右1: 附件按钮 */}
        <ComposerActions />          {/* 右2: 语音按钮 */}
        <ComposerActions />          {/* 右3: 发送按钮 */}
      </div>
    </div>
  </form>
</div>
```

### ComposerInput.tsx 简化结构

```
<fieldset className="border-0 p-0 m-0">
  <textarea
    ref={textareaRef}
    rows={3}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    maxLength={maxLength}
    className="w-full bg-transparent px-3 py-2 text-sm outline-none resize-none"
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    onBlur={onBlur}
    onFocus={onFocus}
    aria-label="消息输入框"
  />
</fieldset>
```

## 详细设计

### 1. 创建 ComposerCharCount 组件

**文件**: `src/components/composer/ComposerCharCount.tsx`

```typescript
import { memo } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS, TEXT_SIZES } from './composer.constants';

export interface ComposerCharCountProps {
  /** 当前输入长度 */
  currentLength: number;
  /** 最大长度 */
  maxLength: number;
}

export const ComposerCharCount = memo<ComposerCharCountProps>(
  ({ currentLength, maxLength }) => {
    return (
      <span
        className={cn(
          TEXT_SIZES.HINT,
          'text-gray-400 dark:text-gray-500',
          'transition-colors duration-200',
          currentLength > maxLength && 'text-destructive',
        )}
        data-testid={TEST_IDS.COMPOSER_CHAR_COUNT}
      >
        {currentLength} / {maxLength}
      </span>
    );
  },
);

ComposerCharCount.displayName = 'ComposerCharCount';
```

### 2. 修改 ComposerInput.tsx

**主要改动**:
- 移除内部的字符计数显示
- 移除表情按钮（移到外部或保持独立）
- 移除为按钮预留的 padding（`pr-14`）
- 简化样式，移除绝对定位的按钮

**移除的代码**:
```typescript
// 移除字符计数显示
const charCount = (
  <span className="absolute right-14 top-1/2 -translate-y-1/2">
    {value.length}/{maxLength}
  </span>
);

// 移除表情按钮
{showEmojiButton && (
  <EmojiPickerButton
    disabled={disabled}
    onEmojiSelect={handleEmojiSelect}
    onButtonClick={onEmojiClick}
    containerClassName="absolute inset-y-0 right-3 flex items-center"
  />
)}

// 移除为按钮预留的 padding
showEmojiButton && 'pr-14',
!showEmojiButton && 'pr-4',
```

**简化的样式**:
```typescript
className={cn(
  'w-full bg-transparent px-3 py-2',
  TEXT_SIZES.INPUT,
  'text-text dark:text-white outline-none resize-none',
  'placeholder:text-gray-500/50',
  // 字符数接近或达到最大长度时的视觉反馈
  isNearMaxLength && !isAtMaxLength && 'focus:ring-orange-400/40',
  isAtMaxLength && 'focus:ring-red-400/40',
)}
```

### 3. 重构 ComposerToolbar.tsx

**主要改动**:
- 为输入框添加视觉包裹容器
- 将所有操作按钮整合到底部工具栏
- 调整按钮大小为更小的尺寸
- 优化布局间距

**新的布局结构**:
```typescript
return (
  <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t">
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* 附件预览 */}
      {attachments.length > 0 && (
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          disabled={disabled || isSending}
        />
      )}

      {/* 音频录音器 */}
      {isRecording && composerConfig.enableAudioInput && (
        <AudioRecorder
          onSendAudio={handleSendAudio}
          onCancel={handleCancelRecording}
          disabled={disabled || isSending}
          maxDuration={composerConfig.maxAudioDuration}
        />
      )}

      {/* 错误提示 */}
      {sendError && (
        <div className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg flex items-center justify-between">
          <span>{sendError}</span>
          <button type="button" onClick={() => setSendError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* 输入框区域（带视觉包裹） */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5 overflow-hidden">
        <ComposerInput
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onEnter={handleSend}
          disabled={disabled || isSending || isRecording || isTemplateLocked}
          maxLength={effectiveMaxLength}
          onEmojiClick={onEmojiClick}
          showEmojiButton={composerConfig.showEmojiButton}
        />
      </div>

      {/* 底部工具栏 - 所有操作按钮 */}
      <div className="flex items-center justify-between mt-2">
        {/* 左侧：渠道相关 */}
        <div className="flex items-center gap-2">
          {composerConfig.showChannelSwitcher && (
            <ChannelSwitcher
              activeChannel={channel}
              compact
              data-testid={TEST_IDS.COMPOSER_CHANNEL_SWITCHER}
            />
          )}
          {composerConfig.showHint && (
            <ComposerHint channel={channel} />
          )}
          {composerConfig.showCharCount && (
            <ComposerCharCount
              currentLength={value.length}
              maxLength={effectiveMaxLength}
            />
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          {composerConfig.enableAttachments && (
            <ComposerAttachments
              disabled={
                disabled ||
                isSending ||
                isRecording ||
                isTemplateLocked ||
                !accept
              }
              onAttachmentSelect={handleAttachmentSelect}
              accept={accept}
              multiple
            />
          )}
          <ComposerActions
            canSend={canSend}
            onSend={handleSend}
            enableAudioInput={composerConfig.enableAudioInput}
            onAudioInput={handleAudioInput}
            loading={isSending || loading}
            disabled={disabled || isRecording}
            showClear={isTemplateLocked}
            onClear={handleClear}
          />
        </div>
      </div>
    </form>
  </div>
);
```

### 4. 调整按钮大小

**在 composer.constants.ts 中添加新的按钮尺寸**:
```typescript
/** 按钮尺寸常量 */
export const BUTTON_SIZES = {
  /** 图标按钮尺寸 - 小 */
  ICON_SMALL: 'h-4 w-4',
  /** 图标按钮尺寸 - 中 */
  ICON_MEDIUM: 'h-5 w-5',
  /** 图标按钮尺寸 - 超小（用于底部工具栏） */
  ICON_XS: 'h-3.5 w-3.5',
  /** 圆形按钮内边距 */
  CIRCULAR_PADDING: 'p-3',
  /** 小按钮内边距 */
  SMALL_PADDING: 'p-2',
  /** 超小按钮内边距（用于底部工具栏） */
  XS_PADDING: 'p-1.5',
} as const;
```

**更新各按钮组件使用更小的尺寸**:
- ComposerAttachments: 使用 `ICON_XS` 和 `XS_PADDING`
- ComposerActions: 使用 `ICON_XS` 和 `XS_PADDING`
- ChannelSwitcher: 使用 `compact` 模式（已有）

### 5. 视觉包裹效果

**为输入框添加包裹容器**:
```typescript
<div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5 overflow-hidden">
  <ComposerInput />
</div>
```

**样式说明**:
- `rounded-lg`: 圆角，与底部工具栏形成整体
- `border`: 边框，明确输入区域边界
- `bg-gray-100/50`: 浅色背景，与底部工具栏区分
- `overflow-hidden`: 确保内容不溢出圆角

## 测试更新

### 需要更新的测试文件

1. **ComposerInput.test.tsx**
   - 移除字符计数显示的测试
   - 移除表情按钮的测试
   - 更新快照测试

2. **ComposerToolbar.test.tsx**
   - 更新布局结构的测试
   - 验证底部工具栏的正确渲染
   - 验证按钮尺寸的正确应用

3. **ComposerToolbar.templateId.test.tsx**
   - 更新与模板相关的测试

## 迁移步骤

1. 创建 `ComposerCharCount.tsx` 组件
2. 修改 `ComposerInput.tsx`，移除内部按钮和字符计数
3. 重构 `ComposerToolbar.tsx` 的布局结构
4. 更新 `composer.constants.ts`，添加新的按钮尺寸
5. 更新相关测试文件
6. 运行测试验证修改
7. 运行构建验证修改

## 兼容性

### 破坏性变更

1. **ComposerInput 组件**
   - 移除 `showEmojiButton` prop（表情按钮移到外部）
   - 移除内部的字符计数显示
   - 移除为按钮预留的 padding

2. **ComposerToolbar 组件**
   - 布局结构发生重大变化
   - 底部工具栏现在包含所有操作按钮

### 向后兼容方案

如果需要保持向后兼容，可以：
1. 在 `ComposerInput` 中保留 `showEmojiButton` prop，但不使用
2. 在 `ComposerToolbar` 中添加 `legacyMode` prop，允许使用旧布局

## 视觉效果

### 优点

1. **更紧凑**: 所有操作按钮集中在底部，节省垂直空间
2. **更统一**: 输入框和操作按钮有明显的视觉关联
3. **更清晰**: 输入区域和操作区域分离，层次更清晰
4. **更易用**: 按钮尺寸适中，点击区域明确

### 注意事项

1. 需要确保按钮尺寸不会太小，影响可点击性
2. 需要确保输入框和底部工具栏的视觉关联性
3. 需要确保在不同屏幕尺寸下的响应式表现
