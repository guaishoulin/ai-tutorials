# 用Claude Code帮你debug代码

## 📌 一句话总结
把报错信息直接扔给 Claude Code，它能定位问题、解释原因、给出修复方案，比人工查 Stack Overflow 快 5 倍。

## 🛠️ 用到的工具
- **Claude Code**（推荐，代码理解最强）
- 可选：**Cursor** / **GitHub Copilot Chat**（IDE 内直接用）

## ⏱️ 耗时 & 难度
- 预计时间：5-15分钟（取决于 bug 复杂度）
- 难度：⭐⭐ 需要基本读懂代码

## 🎯 最终效果
- 快速定位 bug 根因
- 获得可执行的修复方案
- 理解为什么出错（不只是抄答案）

## 📝 操作步骤

### Step 1：准备上下文

Claude Code 需要**足够的上下文**才能准确诊断。别只贴报错信息，要把相关代码也贴上。

**最小可用上下文：**
```
【报错信息】
TypeError: Cannot read properties of undefined (reading 'map')

【相关代码】
function renderList(items) {
  return items.map(item => `<li>${item.name}</li>`);
}

【调用方式】
renderList(data.users);

【数据格式】
data = { users: null }  // ← 问题在这里
```

### Step 2：输入 Prompt

```
你是一位资深 JavaScript 工程师，请帮我 debug。

【报错信息】
TypeError: Cannot read properties of undefined (reading 'map')
    at renderList (app.js:12)
    at main (app.js:45)

【相关代码】
function renderList(items) {
  return items.map(item => `<li>${item.name}</li>`);
}

【调用方式】
renderList(data.users);

【我的猜测】
可能是 data.users 是 undefined？

要求：
1. 解释报错原因（用通俗语言）
2. 给出 2-3 种修复方案（从简单到规范）
3. 说明每种方案的适用场景
```

**Claude Code 的回复示例：**

> **报错原因：**
> `data.users` 是 `undefined`，你对 `undefined` 调用了 `.map()` 方法。
> 根本原因是 `data` 对象里没有 `users` 属性，或者 `data` 本身是空的。
>
> **修复方案：**
>
> **方案1（最快）：加默认值**
> ```js
> function renderList(items = []) {
>   return items.map(item => `<li>${item.name}</li>`);
> }
> ```
> 适用场景：快速修复，不关心为什么 `users` 是空的
>
> **方案2（推荐）：在调用前检查**
> ```js
> if (data.users && Array.isArray(data.users)) {
>   renderList(data.users);
> } else {
>   console.warn('users 数据异常', data.users);
> }
> ```
> 适用场景：需要排查数据流问题
>
> **方案3（最规范）：用 TypeScript + 运行时校验**
> ```ts
> interface Data { users?: User[] }
> function renderList(items: User[]): string { ... }
> ```
> 适用场景：大型项目，长期维护

### Step 3：追问细节

Claude Code 的优势是**可以连续对话**，直到你完全理解：

- "方案2的 `Array.isArray` 检查是否多余？"
- "如果 `data` 是从 API 拿的，应该在哪一层做校验？"
- "用可选链 `data.users?.map()` 可以吗？有什么区别？"

### Step 4（进阶）：直接让 Claude Code 改代码

如果你用 **Cursor** 或 **VS Code + Claude Dev** 插件，可以直接：

1. 选中出错的代码块
2. 按快捷键唤起 AI
3. 输入 "fix this bug"
4. AI 直接在原位置修改代码

## ⚠️ 注意事项 / 避坑

1. **不要贴整个项目**（几千行代码）→ Claude 会漏看重点，只贴相关函数和报错
2. **AI 给的方案不一定最优** → 理解原理，别盲目复制
3. **涉及安全性的 bug**（SQL 注入、XSS）要让 AI 解释攻击原理，确保你理解了
4. **Claude Code 的上下文限制** → 免费版约 4k tokens，超出会截断；付费版或 Cursor 上下文更大

## 🔗 相关教程
- [用ChatGPT 10分钟写完周报](/tutorials/writing/chatgpt-weekly-report)
- [用AI写单元测试代码](/tutorials/coding/ai-unit-test)
