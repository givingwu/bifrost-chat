# 代码规范

## TypeScript

- 类型优先，避免 `any`。
- 公共 API 必须定义明确类型。
- 常用类型必须明确声明枚举 `enum`

## React

- 函数组件 + PascalCase 文件名（如 `UserTable.tsx`）。
- JSX 使用双引号。

## 格式化

- Biome 统一格式：空格缩进、80 字符换行、TS/JS 单引号。
- 大改动前建议 `biome check --write`。

## Tailwind

- 变量命名前缀：`@color-`、`@spacing-`。
- 结构清晰，类名可读。

## 质量与一致性

- 避免重复逻辑，优先复用与模块化。
- 遵循现有命名与文件组织方式。
