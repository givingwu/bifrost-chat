---
name: react-hooks-rules
description: >
  编写或审查 React 组件时强制遵守 Hooks 规则。
  防止条件调用、early-return 顺序错误、循环内调用等常见违规。
---

# React Hooks 规则 — Skill

## 核心规则（绝不违反）

### 1. Hooks 必须在每次渲染时以相同顺序调用

React 依赖调用顺序将 hook 状态与调用位置对应。
**任何"条件可达"的 hook 都会在生产环境产生「Rendered fewer hooks than expected」错误。**

### 2. Early return 之后不得调用 Hook

```tsx
// ❌ 错误 — hook 在 early return 之后
function Comp({ show }) {
  const x = useSomething();
  if (!show) return null;   // early return
  const y = useOther();     // ← BUG：show=false 时 React 不会执行到这里
}

// ✅ 正确 — 所有 hook 在任何 return 之前
function Comp({ show }) {
  const x = useSomething();
  const y = useOther();     // 始终调用
  if (!show) return null;
  // 在此使用 x, y
}
```

### 3. 不在条件语句中调用 Hook

```tsx
// ❌ 错误
if (condition) {
  const [v, setV] = useState(0);
}

// ✅ 正确
const [v, setV] = useState(0);
if (condition) { /* 使用 v */ }
```

### 4. 不在循环中调用 Hook

```tsx
// ❌ 错误 — 每次渲染调用次数不固定
items.forEach(item => {
  const ref = useRef(null);
});

// ✅ 正确 — 提取为子组件
function Item({ item }) {
  const ref = useRef(null);
  return <div ref={ref}>{item}</div>;
}
```

### 5. 只在函数组件或自定义 Hook 中调用 Hook

```tsx
// ❌ 错误 — 普通工具函数
function formatData(data) {
  const { t } = useTranslation(); // 不是组件也不是自定义 hook
}

// ✅ 正确 — 自定义 hook（以 use 开头）
function useFormattedData(data) {
  const { t } = useTranslation();
  return t(data);
}
```

---

## 编写前自查清单

写任何带 hook 的组件时，先逐项确认：

- [ ] 所有 hook 是否都在函数体**顶层**？
- [ ] early `return` 是否出现在**任何** hook 调用**之前**？如果是 → 把 hook 移到 return 上面
- [ ] 是否有 hook 在 `if` / `switch` / `for` / `while` / `?.` / `&&` 里？
- [ ] 是否有 hook 在回调函数、嵌套函数、class 方法内？

---

## 最容易踩坑的写法

### Guard clause + hook 在其下方

```tsx
// ❌ 看起来无害，实际违规
function ConversationPanel({ id }) {
  const data = useQuery(id);
  if (!data) return <Spinner />;   // early return
  const label = useLabel(data);    // ← BUG：data 为 null 时不调用
}

// ✅
function ConversationPanel({ id }) {
  const data = useQuery(id);
  const label = useLabel(data);    // 始终调用；内部自行处理 null
  if (!data) return <Spinner />;
  return <div>{label}</div>;
}
```

### `memo()` 包裹 + 内部 early return

```tsx
// ❌ memo 不豁免 Rules of Hooks
export const Comp = memo(({ visible }) => {
  if (!visible) return null;
  const x = useX();   // ← BUG
});

// ✅
export const Comp = memo(({ visible }) => {
  const x = useX();   // 始终调用
  if (!visible) return null;
  return <div>{x}</div>;
});
```

### `forwardRef` + 条件渲染

```tsx
// ❌
export const Comp = forwardRef((props, ref) => {
  if (!props.data) return null;
  const value = useValue(); // ← BUG
});

// ✅
export const Comp = forwardRef((props, ref) => {
  const value = useValue(); // 始终先调用
  if (!props.data) return null;
  return <span ref={ref}>{value}</span>;
});
```

---

## 审查代码时的检查步骤

1. 扫描组件体内所有 `return null` / `return <Fallback />`
2. 检查：**该行之后还有任何 hook 调用吗？**
3. 如有 → 把那些 hook 移到 early return 之前
4. `memo()`、`forwardRef()`、懒加载组件同样适用上述规则

---

## ESLint 强制配置

项目应启用 `eslint-plugin-react-hooks`：

```json
"rules": {
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn"
}
```

当 lint 不可用时，以本 Skill 作为心智替代。
