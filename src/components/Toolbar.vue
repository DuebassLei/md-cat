<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button @click="insertText('**', '**')" title="粗体 (Ctrl+B)">
        <span class="icon">B</span>
      </button>
      <button @click="insertText('*', '*')" title="斜体 (Ctrl+I)">
        <span class="icon">I</span>
      </button>
      <button @click="insertText('~~', '~~')" title="删除线">
        <span class="icon">S</span>
      </button>
    </div>
    <div class="toolbar-group">
      <button @click="insertHeading(1)" title="标题 1">H1</button>
      <button @click="insertHeading(2)" title="标题 2">H2</button>
      <button @click="insertHeading(3)" title="标题 3">H3</button>
    </div>
    <div class="toolbar-group">
      <button @click="insertLink" title="链接 (Ctrl+K)">🔗</button>
      <button @click="insertImage" title="图片">🖼️</button>
      <button @click="insertCodeBlock" title="代码块">💻</button>
    </div>
    <div class="toolbar-group">
      <button @click="insertMermaid" title="Mermaid 图表">📊</button>
      <button @click="insertFormula" title="数学公式">🧮</button>
      <button @click="insertTable" title="表格">📋</button>
    </div>
    <div class="toolbar-group">
      <button @click="insertQuote" title="引用">💬</button>
      <button @click="insertList" title="列表">📝</button>
      <button @click="insertDivider" title="分割线">➖</button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['insert'])

const insertText = (before, after) => {
  emit('insert', { before, after, placeholder: '文本' })
}

const insertHeading = (level) => {
  const prefix = '#'.repeat(level) + ' '
  emit('insert', { before: prefix, after: '', placeholder: '标题' })
}

const insertLink = () => {
  emit('insert', { before: '[', after: '](https://)', placeholder: '链接文本' })
}

const insertImage = () => {
  emit('insert', { before: '![', after: '](图片地址)', placeholder: '图片描述' })
}

const insertCodeBlock = () => {
  emit('insert', { 
    before: '```javascript\n', 
    after: '\n```', 
    placeholder: '代码内容',
    newLine: true 
  })
}

const insertMermaid = () => {
  const mermaidTemplate = `\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[结果1]
    B -->|否| D[结果2]
\`\`\`
`
  emit('insert', { before: mermaidTemplate, after: '', newLine: true })
}

const insertFormula = () => {
  emit('insert', { 
    before: '$$\n', 
    after: '\n$$', 
    placeholder: 'E = mc^2',
    newLine: true 
  })
}

const insertTable = () => {
  const tableTemplate = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`
  emit('insert', { before: tableTemplate, after: '', newLine: true })
}

const insertQuote = () => {
  emit('insert', { before: '> ', after: '', placeholder: '引用内容', newLine: true })
}

const insertList = () => {
  emit('insert', { before: '- ', after: '', placeholder: '列表项', newLine: true })
}

const insertDivider = () => {
  emit('insert', { before: '---', after: '', newLine: true })
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: #faf5eb;
  border-bottom: 2px solid #f0e8d8;
  flex-wrap: wrap;
  align-items: center;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body[data-theme-type="dark"] .toolbar {
  background: #252526;
  border-bottom-color: #3e3e42;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  border-right: 1px solid #f0e8d8;
  transition: border-color 0.3s ease;
}

body[data-theme-type="dark"] .toolbar-group {
  border-right-color: #3e3e42;
}

.toolbar-group:last-child {
  border-right: none;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid #e8ddd0;
  border-radius: 6px;
  background: #fffef9;
  cursor: pointer;
  font-size: 13px;
  color: #5c4a3a;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  font-weight: 500;
}

body[data-theme-type="dark"] .toolbar button {
  background: #3e3e42;
  border-color: #555;
  color: #d4d4d4;
}

.toolbar button:hover {
  background: #f5ede0;
  border-color: #d4c5b0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

body[data-theme-type="dark"] .toolbar button:hover {
  background: #4e4e52;
  border-color: #666;
}

.toolbar button:active {
  background: #f0e8d8;
}

body[data-theme-type="dark"] .toolbar button:active {
  background: #555;
}

.toolbar .icon {
  font-weight: bold;
}
</style>

