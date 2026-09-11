# Composer Toolbar 布局设计

## 整体布局结构

```mermaid
graph TB
    subgraph ComposerToolbar["ComposerToolbar 容器"]
        subgraph Form["表单容器"]
            AP[AttachmentPreview<br/>附件预览]
            AR[AudioRecorder<br/>音频录音器]
            ERR[ErrorMessage<br/>错误提示]
            
            subgraph InputWrapper["输入框包裹容器"]
                CI[ComposerInput<br/>纯输入框]
            end
            
            subgraph BottomBar["底部工具栏"]
                subgraph LeftSection["左侧：渠道相关"]
                    CS[ChannelSwitcher<br/>渠道切换器]
                    CH[ComposerHint<br/>渠道提示]
                    CC[ComposerCharCount<br/>字符计数]
                end
                
                subgraph RightSection["右侧：操作按钮"]
                    CA[ComposerAttachments<br/>附件按钮]
                    ACT[ComposerActions<br/>操作按钮组]
                end
            end
        end
    end
    
    AP --> InputWrapper
    AR --> InputWrapper
    ERR --> InputWrapper
    InputWrapper --> BottomBar
    LeftSection --> RightSection
```

## 组件层级关系

```mermaid
graph LR
    A[ComposerToolbar] --> B[AttachmentPreview]
    A --> C[AudioRecorder]
    A --> D[ErrorMessage]
    A --> E[InputWrapper]
    A --> F[BottomBar]
    
    E --> G[ComposerInput]
    
    F --> H[LeftSection]
    F --> I[RightSection]
    
    H --> J[ChannelSwitcher]
    H --> K[ComposerHint]
    H --> L[ComposerCharCount]
    
    I --> M[ComposerAttachments]
    I --> N[ComposerActions]
```

## 底部工具栏详细布局

```mermaid
graph TB
    subgraph BottomBar["底部工具栏 (flex items-center justify-between)"]
        subgraph Left["左侧区域 (flex items-center gap-2)"]
            L1[ChannelSwitcher<br/>compact模式]
            L2[ComposerHint<br/>渠道提示]
            L3[ComposerCharCount<br/>字符计数]
        end
        
        subgraph Right["右侧区域 (flex items-center gap-1)"]
            R1[ComposerAttachments<br/>附件按钮 📎]
            R2[ComposerActions<br/>语音按钮 🎤]
            R3[ComposerActions<br/>发送按钮 📤]
        end
    end
    
    L1 --> L2 --> L3
    R1 --> R2 --> R3
```

## 输入框包裹样式

```mermaid
graph TB
    subgraph InputWrapper["输入框包裹容器"]
        Style1["rounded-lg<br/>圆角"]
        Style2["border<br/>边框"]
        Style3["bg-gray-100/50<br/>浅色背景"]
        Style4["overflow-hidden<br/>内容不溢出"]
        
        Input["ComposerInput<br/>纯净输入框"]
    end
    
    Style1 --> Input
    Style2 --> Input
    Style3 --> Input
    Style4 --> Input
```

## 按钮尺寸规范

```mermaid
graph TB
    subgraph ButtonSizes["按钮尺寸规范"]
        XS["ICON_XS: h-3.5 w-3.5<br/>超小图标"]
        XS_P["XS_PADDING: p-1.5<br/>超小内边距"]
        
        Small["ICON_SMALL: h-4 w-4<br/>小图标"]
        Small_P["SMALL_PADDING: p-2<br/>小内边距"]
        
        Medium["ICON_MEDIUM: h-5 w-5<br/>中图标"]
        Medium_P["CIRCULAR_PADDING: p-3<br/>圆形内边距"]
    end
    
    XS --> XS_P
    Small --> Small_P
    Medium --> Medium_P
    
    XS_P --> Used["底部工具栏按钮"]
    Small_P --> Used
    Medium_P --> Used
```

## 数据流向

```mermaid
graph TB
    subgraph ComposerToolbar["ComposerToolbar"]
        State[状态管理<br/>value, attachments, isRecording]
        
        Input[ComposerInput<br/>输入框]
        
        LeftBar[左侧工具栏<br/>ChannelSwitcher, ComposerHint, ComposerCharCount]
        RightBar[右侧工具栏<br/>ComposerAttachments, ComposerActions]
        
        Handlers[事件处理器<br/>handleChange, handleSend, handleAttachmentSelect]
    end
    
    State --> Input
    State --> LeftBar
    State --> RightBar
    
    Input --> Handlers
    LeftBar --> Handlers
    RightBar --> Handlers
```

## 响应式布局

```mermaid
graph TB
    subgraph Responsive["响应式布局策略"]
        Desktop["桌面端<br/>flex items-center justify-between"]
        
        Tablet["平板端<br/>flex flex-col gap-2"]
        
        Mobile["移动端<br/>flex flex-col gap-2<br/>按钮堆叠显示"]
    end
    
    Desktop --> Tablet
    Tablet --> Mobile
```

## 视觉层次

```mermaid
graph TB
    subgraph VisualHierarchy["视觉层次"]
        Level1["Level 1: 输入框包裹容器<br/>rounded-lg border bg-gray-100/50"]
        
        Level2["Level 2: 底部工具栏<br/>flex items-center justify-between mt-2"]
        
        Level3["Level 3: 左侧/右侧区域<br/>flex items-center gap-1/2"]
        
        Level4["Level 4: 各个按钮组件<br/>使用 ICON_XS 和 XS_PADDING"]
    end
    
    Level1 --> Level2
    Level2 --> Level3
    Level3 --> Level4
```
