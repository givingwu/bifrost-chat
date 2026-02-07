/// <reference types="vitest/globals" />

import '@testing-library/jest-dom/vitest';

// 扩展 Vitest 的 Assertion 类型以支持 jest-dom 的自定义匹配器
// 这解决了 TypeScript 无法识别 toHaveStyle 等匹配器的问题
//
// @testing-library/jest-dom/vitest 已经包含了必要的类型扩展
// 此文件确保这些类型在项目中被正确引用
