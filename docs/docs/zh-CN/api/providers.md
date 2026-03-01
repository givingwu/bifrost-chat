# Providers API 参考

## 当前已实现（As-Is）

以下 Providers 已从 `@feoe/bifrost-chat` 公开导出。

## 目标架构（To-Be）

- 增强 DI 诊断能力（注入缺失提示、方法未实现提示）。

---

## ConfigProvider

SDK 配置 Provider，初始化 Zustand 客户端状态。

```tsx
import { ConfigProvider, ChannelTypeEnum, LanguageCodeEnum } from '@feoe/bifrost-chat';

<ConfigProvider
  config={{
    // 语言配置
    language: { code: LanguageCodeEnum.ZhCN },
    
    // 渠道策略
    strategy: {
      allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
      activeChannel: ChannelTypeEnum.WhatsApp,
    },
    
    // 输入框配置
    composer: {
      enableDraft: true,        // 启用草稿
      enableAttachments: true,  // 启用附件
      enableAudioInput: true,   // 启用语音输入
      showEmojiButton: true,    // 显示表情按钮
    },
  }}
>
  <App />
</ConfigProvider>
```

**配置项**

| 字段 | 类型 | 说明 |
|---|---|---|
| `language` | `{ code: LanguageCodeEnum }` | 语言配置 |
| `strategy` | `StrategyConfig` | 渠道策略配置 |
| `composer` | `ComposerConfig` | 输入框配置 |

---

## QueryProvider

React Query 配置 Provider。

```tsx
import { QueryProvider } from '@feoe/bifrost-chat';

<QueryProvider>
  <App />
</QueryProvider>
```

**特性**

- 配置 React Query 默认选项
- 提供 QueryClient 实例

---

## ServiceProvider

服务依赖注入 Provider，注入业务服务实现。

```tsx
import { ServiceProvider } from '@feoe/bifrost-chat';
import type { IConversationService, IMessageService, ITemplateService } from '@feoe/bifrost-chat';

<ServiceProvider
  conversationService={myConversationService}
  messageService={myMessageService}
  templateService={myTemplateService}
>
  <App />
</ServiceProvider>
```

**服务接口**

| 服务 | 接口 | 说明 |
|---|---|---|
| `conversationService` | `IConversationService` | 会话服务 |
| `messageService` | `IMessageService` | 消息服务 |
| `templateService` | `ITemplateService` | 模板服务 |

### useServices

获取注入的服务实例。

```tsx
import { useServices } from '@feoe/bifrost-chat';

function MyComponent() {
  const { conversationService, messageService, templateService } = useServices();
  
  // 使用服务...
}
```

---

## I18nProvider

国际化 Provider，支持自定义语言包。

```tsx
import { I18nProvider, zhCNMessages } from '@feoe/bifrost-chat';

<I18nProvider messages={zhCNMessages}>
  <App />
</I18nProvider>
```

**内置语言包**

- `zhCNMessages` - 中文
- `enUSMessages` - 英文

---

## 组合使用

完整的 Provider 嵌套顺序：

```tsx
import {
  ConfigProvider,
  QueryProvider,
  ServiceProvider,
  I18nProvider,
  ChatContainer,
  DefaultChatLayout,
  ChannelTypeEnum,
  LanguageCodeEnum,
  zhCNMessages,
} from '@feoe/bifrost-chat';

export function App() {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.ZhCN },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
        composer: {
          enableDraft: true,
          enableAttachments: true,
          enableAudioInput: false,
          showEmojiButton: true,
        },
      }}
    >
      <QueryProvider>
        <I18nProvider messages={zhCNMessages}>
          <ServiceProvider
            conversationService={conversationService}
            messageService={messageService}
            templateService={templateService}
          >
            <ChatContainer>
              <DefaultChatLayout />
            </ChatContainer>
          </ServiceProvider>
        </I18nProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}