import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { defineConfig } from 'rspress/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // 添加 Rsbuild 插件
  rsbuildConfig: {
    plugins: [pluginNodePolyfill()],
  },
  // 多语言配置
  locales: [
    {
      tag: 'zh-CN',
      label: '简体中文',
      lang: 'zh-CN',
    },
    {
      tag: 'en-US',
      label: 'English',
      lang: 'en-US',
    },
  ],

  // 默认语言
  defaultLocale: 'zh-CN',

  // 文档根目录
  root: join(__dirname, 'docs'),

  // 站点配置
  title: 'Bifrost Chat JS SDK',
  description: '全渠道聊天 JS SDK 组件库',
  icon: '/logo.jpeg',
  logo: {
    text: 'Bifrost Chat',
  },

  // 主题配置
  themeConfig: {
    // 主题色
    primaryColor: '#3b82f6',
    primaryHue: 210,

    // 暗色模式
    darkMode: true,
    defaultDarkMode: false,

    // 导航栏配置
    nav: ({ locale }: { locale: string }) => {
      if (locale === 'en-US') {
        return [
          {
            text: 'Guide',
            items: [
              {
                text: 'Getting Started',
                link: '/en-US/guide/getting-started',
              },
              {
                text: 'Installation',
                link: '/en-US/guide/installation',
              },
            ],
          },
          {
            text: 'Components',
            items: [
              {
                text: 'Basic',
                link: '/en-US/components/basic',
              },
              {
                text: 'Composer',
                link: '/en-US/components/composer',
              },
            ],
          },
          {
            text: 'API',
            link: '/en-US/api/interfaces',
          },
        ];
      }
      return [
        {
          text: '指南',
          items: [
            {
              text: '快速开始',
              link: '/guide/getting-started',
            },
            {
              text: '安装',
              link: '/guide/installation',
            },
          ],
        },
        {
          text: '组件',
          items: [
            {
              text: '基础组件',
              link: '/components/basic',
            },
            {
              text: 'Composer',
              link: '/components/composer',
            },
          ],
        },
        {
          text: 'API',
          link: '/api/interfaces',
        },
      ];
    },

    // 侧边栏配置
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            {
              text: '快速开始',
              link: '/guide/getting-started',
            },
            {
              text: '安装',
              link: '/guide/installation',
            },
          ],
        },
      ],
      '/en-US/guide/': [
        {
          text: 'Getting Started',
          items: [
            {
              text: 'Quick Start',
              link: '/en-US/guide/getting-started',
            },
            {
              text: 'Installation',
              link: '/en-US/guide/installation',
            },
          ],
        },
      ],
      '/components/': [
        {
          text: '基础组件',
          collapsible: true,
          items: [
            {
              text: 'Avatar',
              link: '/components/avatar',
            },
            {
              text: 'Button',
              link: '/components/button',
            },
            {
              text: 'IconButton',
              link: '/components/icon-button',
            },
            {
              text: 'Image',
              link: '/components/image',
            },
            {
              text: 'SearchInput',
              link: '/components/search-input',
            },
          ],
        },
        {
          text: 'Composer',
          collapsible: true,
          items: [
            {
              text: 'ComposerToolbar',
              link: '/components/composer-toolbar',
            },
            {
              text: 'ComposerInput',
              link: '/components/composer-input',
            },
            {
              text: 'ComposerActions',
              link: '/components/composer-actions',
            },
            {
              text: 'EmojiPicker',
              link: '/components/emoji-picker',
            },
          ],
        },
        {
          text: 'Conversation',
          collapsible: true,
          items: [
            {
              text: 'ConversationList',
              link: '/components/conversation-list',
            },
            {
              text: 'ConversationItem',
              link: '/components/conversation-item',
            },
          ],
        },
        {
          text: 'Messages',
          collapsible: true,
          items: [
            {
              text: 'MessageList',
              link: '/components/message-list',
            },
            {
              text: 'MessageBubble',
              link: '/components/message-bubble',
            },
            {
              text: 'TextMessage',
              link: '/components/text-message',
            },
            {
              text: 'ImageMessage',
              link: '/components/image-message',
            },
            {
              text: 'AudioMessage',
              link: '/components/audio-message',
            },
          ],
        },
        {
          text: 'Layout',
          collapsible: true,
          items: [
            {
              text: 'ChatContainer',
              link: '/components/chat-container',
            },
            {
              text: 'DefaultChatLayout',
              link: '/components/default-chat-layout',
            },
          ],
        },
        {
          text: 'Profile',
          collapsible: true,
          items: [
            {
              text: 'Profile',
              link: '/components/profile',
            },
          ],
        },
        {
          text: 'Templates',
          collapsible: true,
          items: [
            {
              text: 'TemplatePanel',
              link: '/components/template-panel',
            },
            {
              text: 'TemplateList',
              link: '/components/template-list',
            },
          ],
        },
        {
          text: 'Toolbar',
          collapsible: true,
          items: [
            {
              text: 'Topbar',
              link: '/components/topbar',
            },
            {
              text: 'ChannelFilter',
              link: '/components/channel-filter',
            },
            {
              text: 'ThemeSwitcher',
              link: '/components/theme-switcher',
            },
            {
              text: 'LanguageSwitcher',
              link: '/components/language-switcher',
            },
          ],
        },
      ],
      '/en-US/components/': [
        {
          text: 'Basic Components',
          collapsible: true,
          items: [
            {
              text: 'Avatar',
              link: '/en-US/components/avatar',
            },
            {
              text: 'Button',
              link: '/en-US/components/button',
            },
            {
              text: 'IconButton',
              link: '/en-US/components/icon-button',
            },
            {
              text: 'Image',
              link: '/en-US/components/image',
            },
            {
              text: 'SearchInput',
              link: '/en-US/components/search-input',
            },
          ],
        },
        {
          text: 'Composer',
          collapsible: true,
          items: [
            {
              text: 'ComposerToolbar',
              link: '/en-US/components/composer-toolbar',
            },
            {
              text: 'ComposerInput',
              link: '/en-US/components/composer-input',
            },
            {
              text: 'ComposerActions',
              link: '/en-US/components/composer-actions',
            },
            {
              text: 'EmojiPicker',
              link: '/en-US/components/emoji-picker',
            },
          ],
        },
        {
          text: 'Conversation',
          collapsible: true,
          items: [
            {
              text: 'ConversationList',
              link: '/en-US/components/conversation-list',
            },
            {
              text: 'ConversationItem',
              link: '/en-US/components/conversation-item',
            },
          ],
        },
        {
          text: 'Messages',
          collapsible: true,
          items: [
            {
              text: 'MessageList',
              link: '/en-US/components/message-list',
            },
            {
              text: 'MessageBubble',
              link: '/en-US/components/message-bubble',
            },
            {
              text: 'TextMessage',
              link: '/en-US/components/text-message',
            },
            {
              text: 'ImageMessage',
              link: '/en-US/components/image-message',
            },
            {
              text: 'AudioMessage',
              link: '/en-US/components/audio-message',
            },
          ],
        },
        {
          text: 'Layout',
          collapsible: true,
          items: [
            {
              text: 'ChatContainer',
              link: '/en-US/components/chat-container',
            },
            {
              text: 'DefaultChatLayout',
              link: '/en-US/components/default-chat-layout',
            },
          ],
        },
        {
          text: 'Profile',
          collapsible: true,
          items: [
            {
              text: 'Profile',
              link: '/en-US/components/profile',
            },
          ],
        },
        {
          text: 'Templates',
          collapsible: true,
          items: [
            {
              text: 'TemplatePanel',
              link: '/en-US/components/template-panel',
            },
            {
              text: 'TemplateList',
              link: '/en-US/components/template-list',
            },
          ],
        },
        {
          text: 'Toolbar',
          collapsible: true,
          items: [
            {
              text: 'Topbar',
              link: '/en-US/components/topbar',
            },
            {
              text: 'ChannelFilter',
              link: '/en-US/components/channel-filter',
            },
            {
              text: 'ThemeSwitcher',
              link: '/en-US/components/theme-switcher',
            },
            {
              text: 'LanguageSwitcher',
              link: '/en-US/components/language-switcher',
            },
          ],
        },
      ],
      '/api/': [
        {
          text: '接口定义',
          items: [
            {
              text: 'Interfaces',
              link: '/api/interfaces',
            },
            {
              text: 'Hooks',
              link: '/api/hooks',
            },
            {
              text: 'Services',
              link: '/api/services',
            },
          ],
        },
      ],
      '/en-US/api/': [
        {
          text: 'API Reference',
          items: [
            {
              text: 'Interfaces',
              link: '/en-US/api/interfaces',
            },
            {
              text: 'Hooks',
              link: '/en-US/api/hooks',
            },
            {
              text: 'Services',
              link: '/en-US/api/services',
            },
          ],
        },
      ],
    },

    // 页脚配置
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present Bifrost Chat',
    },

    // 社交链接
    socialLinks: [
      {
        icon: 'github',
        link: 'https://git.kuainiujinke.com/feoe/bifrost-chat',
      },
    ],

    // 编辑链接
    editLink: {
      pattern:
        'https://git.kuainiujinke.com/feoe/bifrost-chat/edit/main/docs-site/docs/:path',
      text: '在 GitLab 上编辑此页',
    },

    // 最后更新时间
    lastUpdated: true,

    // 外部脚本
    head: [
      // 自定义 meta 标签
      [
        'meta',
        {
          name: 'keywords',
          content: 'Bifrost Chat, JS SDK, React, 全渠道聊天',
        },
      ],
    ],
  },

  // Markdown 配置
  markdown: {
    // 代码块主题
    codeHighlighter: 'shiki',
    shiki: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
    // 支持数学公式
    math: true,
    // 支持 Mermaid 图表
    mermaid: true,
  },

  // 构建配置
  build: {
    // 输出目录
    out: 'dist-docs',
    // 基础路径
    base: '/bifrost-chat/',
    // 资源公共路径
    assetsPath: 'assets',
  },

  // 插件配置
  plugins: [],
});
