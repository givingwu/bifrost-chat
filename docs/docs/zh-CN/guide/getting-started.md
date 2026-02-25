# 快速开始

欢迎使用 Bifrost Chat JS SDK！本指南将帮助你快速上手。

## 安装

使用 npm、yarn 或 pnpm 安装：

```bash
# npm
npm install @feoe/bifrost-chat

# yarn
yarn add @feoe/bifrost-chat

# pnpm
pnpm add @feoe/bifrost-chat
```

## 基础使用

### 1. 导入样式

```typescript
import '@feoe/bifrost-chat/styles';
```

### 2. 创建服务实现

Bifrost Chat SDK 采用依赖注入模式，你需要实现以下服务接口：

```typescript
import {
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  ServiceProvider,
} from '@feoe/bifrost-chat';

// 实现服务接口
class MyConversationService implements IConversationService {
  async getConversations() {
    // 你的实现
  }
  // ... 其他方法
}

const messageService: IMessageService = {
  async getMessages(conversationId) {
    // 你的实现
  },
  // ... 其他方法
};

const templateService: ITemplateService = {
  async getTemplates() {
    // 你的实现
  },
  // ... 其他方法
};
```

### 3. 配置 SDK

```typescript
import { BifrostChatProvider } from '@feoe/bifrost-chat';

function App() {
  return (
    <ServiceProvider
      conversationService={conversationService}
      messageService={messageService}
      templateService={templateService}
    >
      <BifrostChatProvider
        config={{
          // 基础配置
          agentId: 'your-agent-id',
          agentName: '客服',
          
          // 渠道配置
          strategy: {
            allowedChannels: ['whatsapp', 'email', 'sms'],
            defaultChannel: 'whatsapp',
          },
          
          // Composer 配置
          composerConfig: {
            enableDraft: true,
            enableAttachments: true,
            enableAudio: true,
            enableEmoji: true,
          },
          
          // 国际化配置
          locale: 'zh-CN',
        }}
      >
        <YourChatComponent />
      </BifrostChatProvider>
    </ServiceProvider>
  );
}
```

### 4. 使用组件

```typescript
import { DefaultChatLayout } from '@feoe/bifrost-chat';

function YourChatComponent() {
  return <DefaultChatLayout />;
}
```

## 下一步

- 查看 [组件文档](/components/) 了解所有可用组件
- 查看 [API 文档](/api/) 了解服务接口定义
- 查看 [示例](https://github.com/your-org/bifrost-chat/tree/main/examples) 获取更多使用示例

## 获取帮助

如果你在使用过程中遇到问题：

- 查看 [常见问题](/guide/faq)
- 在 [GitHub](https://github.com/your-org/bifrost-chat) 上提 Issue
- 加入我们的 [Discord 社区](https://discord.gg/your-server)
