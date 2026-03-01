# Installation Guide

## Current Implementation (As-Is)

- Package name: `@feoe/bifrost-chat`
- Build artifacts include components, hooks, types, Providers, and protocol utilities.

## Target Architecture (To-Be)

- Add installation documentation for scenario-based trimming (hooks-only / components-only).

## Install Dependencies

```bash
pnpm add @feoe/bifrost-chat
```

Or:

```bash
npm install @feoe/bifrost-chat
yarn add @feoe/bifrost-chat
```

## Import Styles

```ts
import '@feoe/bifrost-chat/styles';
```

Optionally import theme variables on demand:

```ts
import '@feoe/bifrost-chat/styles/theme';
```

## Requirements

- React 19+
- TypeScript strict mode (recommended)
- Recommended to use with `@tanstack/react-query` Provider