# MD Cat

一个将 Markdown 转换为微信公众号文章或小红书卡片风格的工具，支持实时预览和多种主题风格。

## 功能特点

- 📝 **左右分屏编辑**：左侧编辑 Markdown 源码，右侧实时预览渲染效果
- 🎨 **多种主题风格**：支持微信公众号、小红书卡片等多种风格
- 🔄 **实时预览**：编辑时即时查看渲染效果
- 📊 **Mermaid 图表支持**：支持流程图、序列图、甘特图、类图、状态图等
- 🧮 **KaTeX 数学公式**：支持行内和块级数学公式渲染
- 🛡️ **XSS 保护**：使用 DOMPurify 确保内容安全
- 🛠️ **工具栏功能**：快速插入常用 Markdown 语法
- 📈 **实时统计**：显示字数、行数、阅读时间
- 💾 **自动保存**：每 30 秒自动保存到本地存储
- ⌨️ **快捷键支持**：Ctrl+B/I/K/S 等常用快捷键
- 🎯 **易于扩展**：主题系统设计灵活，方便添加新主题
- ⚡ **纯前端实现**：基于 Vue3 + Vite，无需后端

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Marked** - Markdown 解析器
- **Highlight.js** - 代码高亮
- **Mermaid** - 图表渲染引擎
- **KaTeX** - 数学公式渲染引擎
- **DOMPurify** - XSS 防护库

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
md-cat/
├── src/
│   ├── components/
│   │   ├── MarkdownEditor.vue    # Markdown 编辑器组件
│   │   ├── MarkdownPreview.vue   # Markdown 预览组件
│   │   ├── Toolbar.vue           # 工具栏组件
│   │   └── StatsBar.vue           # 统计信息组件
│   ├── themes/
│   │   └── index.js              # 主题配置文件
│   ├── App.vue                    # 主应用组件
│   ├── main.js                    # 应用入口
│   └── style.css                  # 全局样式
├── index.html                     # HTML 模板
├── vite.config.js                 # Vite 配置
├── package.json                   # 项目配置
└── README.md                      # 项目文档
```

## 添加新主题

1. 在 `src/themes/index.js` 中添加新主题配置：

```javascript
export const themes = {
  // ... 现有主题
  newTheme: {
    label: '新主题名称',
    value: 'newTheme',
    styles: {
      // 主题样式配置
    }
  }
}
```

2. 在 `src/components/MarkdownPreview.vue` 中添加对应的 CSS 样式：

```css
.theme-newTheme :deep(h1) {
  /* 新主题的样式 */
}
```

## 使用说明

### 基本操作

1. 在左侧编辑器中输入 Markdown 内容
2. 右侧会实时显示渲染效果
3. 通过顶部下拉菜单切换不同的主题风格
4. 使用工具栏快速插入常用格式

### 支持的 Markdown 语法

- **基础语法**：标题、粗体、斜体、删除线
- **列表**：有序列表、无序列表、任务列表
- **代码**：行内代码、代码块（带语法高亮）
- **引用**：引用块
- **链接和图片**：链接、图片
- **表格**：Markdown 表格
- **分割线**：水平分割线

### Mermaid 图表

支持以下类型的 Mermaid 图表：

\`\`\`mermaid
graph TD
    A[流程图] --> B[序列图]
    A --> C[甘特图]
    A --> D[类图]
    A --> E[状态图]
\`\`\`

### 数学公式

**行内公式**：使用单个 `$` 包裹，例如：$E = mc^2$

**块级公式**：使用双 `$$` 包裹，例如：

$$
\\int_0^\\infty e^{-x} dx = 1
$$

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + B | 插入粗体 |
| Ctrl + I | 插入斜体 |
| Ctrl + K | 插入链接 |
| Ctrl + S | 保存内容 |

### 自动保存

- 内容每 30 秒自动保存到浏览器本地存储
- 刷新页面后自动恢复上次编辑的内容
- 可手动点击"保存"按钮立即保存

## 主题风格

### 微信公众号风格
- 适合微信公众号文章排版
- 居中标题，清晰的层次结构
- 舒适的阅读体验

### 小红书卡片风格
- 卡片式设计
- 渐变色标题
- 圆角、阴影等现代设计元素

## 许可证

MIT

