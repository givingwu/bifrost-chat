# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Bifrost-Chat UI component library
- Layout components (ChatContainer, ChatLayout, ChatTopbar, DefaultChatLayout)
- Composer components (ComposerInput, ComposerActions, ComposerToolbar, etc.)
- Message components (MessageBubble, TextMessage, ImageMessage, etc.)
- Conversation components (ConversationList, ConversationItem, etc.)
- Toolbar components (ChannelButtonFactory, ThemeSwitcher, etc.)
- Profile components (Profile, ProfileHeader, etc.)
- Basic components (Avatar, Button, IconButton, Image)
- Internationalization support (English, Chinese)
- Theme system with 3 theme options
- Zustand-based state management
- TypeScript type definitions
- Comprehensive hooks (useComposerDraft, useComposerShortcuts, etc.)
- Utility functions (cn, formatTimestamp, MessageBuilder)

### Changed
- **组件命名优化**（Breaking Change）：
  - `ProfileSearch` → `TemplateSearch`（移至 `templates/` 目录）
  - `ConversationListContainer` → `ConversationList`（合并数据获取逻辑）
  - `DefaultChatLayoutContainer` → `DefaultChatLayout`（简化命名）
  - `ChatMessageListContainer` → `InfiniteMessageList`（强调无限滚动特性）
  - `ComposerToolbarContainer` → `ComposerWithSend`（明确发送功能）
  - `ChatMessageList` → `MessageList`（去掉冗余前缀，保留别名以向后兼容）

### Removed
- `src/components/profile/ProfileSearch.tsx`（已迁移至 `templates/TemplateSearch.tsx`）
- `src/components/conversation/ConversationListContainer.tsx`（已合并至 `ConversationList.tsx`）
- `src/components/layout/DefaultChatLayoutContainer.tsx`（已合并至 `DefaultChatLayout.tsx`）
- `src/components/messages/ChatMessageListContainer.tsx`（已重命名为 `InfiniteMessageList.tsx`）
- `src/components/composer/ComposerToolbarContainer.tsx`（已重命名为 `ComposerWithSend.tsx`）
- `src/components/messages/ChatMessageList.tsx`（已重命名为 `MessageList.tsx`）

### Fixed
- 修复组件命名与职责不符的问题
- 优化 Container 组件的命名，避免冗余后缀

### Migration Guide
详见 [`design/naming-conventions.md`](design/naming-conventions.md) v4 迁移指南。

## [1.0.0] - 2025-02-04
