# SafeVault Design System

暖白 Linear 风格设计规范。实现时以 `design/` 下 HTML 设计稿为准，本文件为统一 Token 与用法说明。

## 设计稿索引

| 文件 | 页面 |
| --- | --- |
| `design/index.html` | 主列表 / 保险库首页 |
| `design/add-edit.html` | 新增 / 编辑条目 |
| `design/generator.html` | 密码生成器 |
| `design/stats.html` | 统计与健康度 |
| `design/settings.html` | 设置 |

## 颜色变量

```css
:root {
  --bg: #FAFAF8;
  --surface: #FFFFFF;
  --fg: #1A1A1A;
  --fg-secondary: #6B7280;
  --accent: #5E6AD2;
  --accent-hover: #4F5BC0;
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --border: #E5E7EB;
  --border-hover: #D1D5DB;
}

html.dark {
  --bg: #0A0A0B;
  --surface: #141416;
  --fg: #E5E5E5;
  --fg-secondary: #9CA3AF;
  --accent: #6B7AE0;
  --border: #2A2A2E;
  --border-hover: #3A3A3E;
}
```

### 语义说明

| Token | 用途 |
| --- | --- |
| `--bg` | 页面背景 |
| `--surface` | 卡片 / 面板表面 |
| `--fg` | 主文字 |
| `--fg-secondary` | 次要文字 / 说明（设计稿中亦作 `--muted`） |
| `--accent` / `--accent-hover` | 主操作、链接、焦点 |
| `--success` | 成功 / 强密码 |
| `--warning` | 警告 / 中等密码 |
| `--danger` | 危险 / 弱密码 / 删除 |
| `--border` / `--border-hover` | 分割线与边框 |

组件样式优先使用 `var(--xxx)`，避免硬编码色值。

## 字体

| 用途 | 字体栈 |
| --- | --- |
| 主字体 | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| 密码 / 代码 | `'JetBrains Mono', 'Fira Code', monospace` |

### 字号与字重

| 层级 | 字号 | 字重 |
| --- | --- | --- |
| 标题 | 20px | 600 |
| 正文 | 14px | 400 |
| 小字 | 12px | 400 |

补充（设计稿常用）：按钮与导航可用 500；密码字段、密钥、哈希等一律使用等宽字体。

## 间距

| 场景 | 值 |
| --- | --- |
| 页面 padding | 24px |
| 卡片 padding | 16px |
| 组件间距 | 12px |
| 紧凑间距 | 8px |

## 圆角

| 元素 | 值 |
| --- | --- |
| 卡片 | 8px |
| 按钮 | 6px |
| 输入框 | 6px |
| 标签 | 999px（药丸形） |

## 阴影

| 场景 | 值 |
| --- | --- |
| 卡片 | `0 1px 3px rgba(0, 0, 0, 0.06)` |
| 浮窗 | `0 4px 16px rgba(0, 0, 0, 0.1)` |
| 下拉菜单 | `0 2px 8px rgba(0, 0, 0, 0.08)` |

焦点环（设计稿）：`0 0 0 3px rgba(94, 106, 210, 0.1)`。

## 实现约定

- 前端使用 Tailwind CSS，颜色映射到上述 CSS 变量
- Vue 组件使用 Composition API（`<script setup>`）+ TypeScript
- 图标使用 Lucide Icons
- 密码强度可视化：弱 `--danger`、中 `--warning`、强 `--success`
- 视觉还原优先对齐 `design/` 中对应页面
