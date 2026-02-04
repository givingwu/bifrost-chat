import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  lib: [
    {
      bundle: true,
      dts: true,
      format: 'esm',
    },
  ],
  output: {
    target: 'web',
    copy: [
      {
        from: './src/styles',
        to: './styles',
      },
    ],
  },
  plugins: [pluginReact()],
});
