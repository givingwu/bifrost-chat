import * as React from 'react';
import theme from 'rspress/theme';

export default {
  ...theme,
  // 注册全局组件
  components: {
    StorybookEmbed: React.lazy(() => import('./StorybookEmbed')),
  },
};

// 导出样式
import './styles/custom.css';
