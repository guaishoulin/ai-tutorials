# 用AI写单元测试代码

## 📌 一句话总结
把函数代码扔给 AI，自动生成完整的单元测试（覆盖正常、边界、异常场景），人工只需审核和微调。

## 🛠️ 用到的工具
- **Claude / ChatGPT**（生成测试代码）
- 可选：**Cursor** / **GitHub Copilot Chat**（IDE 内直接生成）

## ⏱️ 耗时 & 难度
- 预计时间：5分钟（生成）+ 5分钟（审核微调）= 10分钟
- 难度：⭐⭐ 需要读懂测试代码

## 🎯 最终效果
一份完整的单元测试文件，包含：
- 正常场景测试
- 边界条件测试
- 异常处理测试
- Mock 外部依赖（如 API 调用）

## 📝 操作步骤

### Step 1：准备要测试的代码

假设你有以下函数（JavaScript/TypeScript）：

```js
// utils.js
export function formatPrice(price, currency = 'USD') {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Invalid price');
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}
```

### Step 2：输入 Prompt

```
你是一位资深前端工程师，请为以下函数写完整的单元测试（使用 Vitest）。

要求：
1. 覆盖正常场景（正确输入）
2. 覆盖边界场景（0、小数、不同 currency）
3. 覆盖异常场景（负数、非数字、null、undefined）
4. 使用 describe + it 结构
5. 测试代码可直接运行

【待测试代码】
export function formatPrice(price, currency = 'USD') {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Invalid price');
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}
```

### Step 3：获得测试代码

AI 会生成类似这样的测试：

```js
// utils.test.js
import { describe, it, expect } from 'vitest';
import { formatPrice } from './utils.js';

describe('formatPrice', () => {
  // 正常场景
  it('should format price with default USD', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50');
  });

  it('should format price with custom currency', () => {
    expect(formatPrice(1234.5, 'EUR')).toBe('€1,234.50');
  });

  // 边界场景
  it('should handle 0', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should handle decimal prices', () => {
    expect(formatPrice(0.99)).toBe('$0.99');
  });

  // 异常场景
  it('should throw on negative price', () => {
    expect(() => formatPrice(-10)).toThrow('Invalid price');
  });

  it('should throw on non-number price', () => {
    expect(() => formatPrice('123')).toThrow('Invalid price');
  });

  it('should throw on null', () => {
    expect(() => formatPrice(null)).toThrow('Invalid price');
  });

  it('should throw on undefined', () => {
    expect(() => formatPrice(undefined)).toThrow('Invalid price');
  });
});
```

### Step 4：复制到项目，运行测试

```bash
npm test
```

如果有报错，把错误信息扔回给 AI：「这个测试报错了，请修复：\[错误信息\]」

## ⚠️ 注意事项 / 避坑

1. **AI 可能生成无法运行的测试**（API 变化、版本不匹配）→ 一定要实际运行一遍
2. **不要追求 100% 覆盖率**（过度测试反而增加维护成本）→ 重点测核心逻辑和边界条件
3. **Mock 要适度** → AI 可能过度 mock，导致测试脱离真实场景
4. **AI 不了解你的业务规则** → 异常场景可能漏测，人工补充

## 🔗 相关教程
- [用Claude Code帮你debug代码](/tutorials/coding/claude-debug)
- [用AI生成PRD文档](/tutorials/writing/ai-prd)
