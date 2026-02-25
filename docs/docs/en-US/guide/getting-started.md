# Getting Started

Welcome to Bifrost Chat JS SDK! This guide will help you get started quickly.

## Installation

Install using npm, yarn, or pnpm:

```bash
# npm
npm install @feoe/bifrost-chat

# yarn
yarn add @feoe/bifrost-chat

# pnpm
pnpm add @feoe/bifrost-chat
```

## Basic Usage

### 1. Import Styles

```typescript
import '@feoe/bifrost-chat/styles';
```

### 2. Create Service Implementations

Bifrost Chat SDK uses dependency injection. You need to implement the following service interfaces:

```typescript
import {
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  ServiceProvider,
} from '@feoe/bifrost-chat';

// Implement service interfaces
class MyConversationService implements IConversationService {
  async getConversations() {
    // Your implementation
  }
  // ... other methods
}

const messageService: IMessageService = {
  async getMessages(conversationId) {
    // Your implementation
  },
  // ... other methods
};

const templateService: ITemplateService = {
  async getTemplates() {
    // Your implementation
  },
  // ... other methods
};
```

### 3. Configure SDK

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
          // Basic configuration
          agentId: 'your-agent-id',
          agentName: 'Agent',
          
          // Channel configuration
          strategy: {
            allowedChannels: ['whatsapp', 'email', 'sms'],
            defaultChannel: 'whatsapp',
          },
          
          // Composer configuration
          composerConfig: {
            enableDraft: true,
            enableAttachments: true,
            enableAudio: true,
            enableEmoji: true,
          },
          
          // i18n configuration
          locale: 'en-US',
        }}
      >
        <YourChatComponent />
      </BifrostChatProvider>
    </ServiceProvider>
  );
}
```

### 4. Use Components

```typescript
import { DefaultChatLayout } from '@feoe/bifrost-chat';

function YourChatComponent() {
  return <DefaultChatLayout />;
}
```

## Next Steps

- Check out [Components](/en-US/components/) to see all available components
- Check out [API Reference](/en-US/api/) to learn about service interfaces
- Check out [Examples](https://github.com/your-org/bifrost-chat/tree/main/examples) for more usage examples

## Getting Help

If you run into any issues:

- Check out [FAQ](/en-US/guide/faq)
- File an issue on [GitHub](https://github.com/your-org/bifrost-chat)
- Join our [Discord community](https://discord.gg/your-server)
