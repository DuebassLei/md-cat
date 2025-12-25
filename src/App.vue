<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-title">
        <h1>Markdown Cat</h1>
        <h6>一个将 Markdown 转换为微信公众号文章或小红书卡片风格的工具，支持实时预览和多种主题风格。</h6>
      </div>
      <div class="header-actions">
        <ThemeSelector v-model="currentTheme" @update:modelValue="handleThemeChange" />
        <CopyButton ref="copyButtonRef" :content="markdownContent" :theme="currentTheme" @copy="handleCopy" />
        <button @click="handleSave" class="save-btn" title="保存 (Ctrl+S)">
          💾 保存
        </button>
        
        <!-- 作者信息 -->
        <div class="author-info" @click="showQRCode = true">
          <span class="author-name-small">🤪关于我</span>
        </div>
        
        <!-- GitHub 图标 -->
        <a href="https://github.com/DuebassLei/md-cat" target="_blank" class="github-link" title="GitHub">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        <a href="https://gaosanshi.dpdns.org/" target="_blank" class="github-link" title="个人博客">
         🌐
        </a>
        
      </div>
    </header>
    <div class="main-content">
      <div class="editor-section">
        <MarkdownEditor 
          v-model="markdownContent" 
          @save="handleSave"
          @quickCopy="handleQuickCopy"
        />
        <StatsBar :content="markdownContent" :last-saved="lastSaved" />
      </div>
      <MarkdownPreview :content="markdownContent" :theme="currentTheme" />
    </div>
    
    <!-- 二维码弹窗 -->
    <div v-if="showQRCode" class="qr-modal" @click.self="showQRCode = false">
      <div class="qr-modal-content">
        <button class="qr-close-btn" @click="showQRCode = false">×</button>
        <div class="qr-header">
          <h3>扫码联系我</h3>
          <p>备注来意~</p>
        </div>
        <div class="qr-card">
          <div class="qr-card-title">海边的小溪鱼</div>
          <div class="qr-decorations">
            <span class="qr-cat">🐱</span>
            <span class="qr-cat">🐈</span>
            <span class="qr-cat">🐈‍⬛</span>
          </div>
          <div class="qr-image-wrapper">
            <img src="/qrcodes/wechat-all.png" alt="微信二维码" class="qr-code-img" />
          </div>
          <div class="qr-paws">
            <span class="qr-paw">🐾</span>
            <span class="qr-paw">🐾</span>
            <span class="qr-paw">🐾</span>
            <span class="qr-paw">🐾</span>
            <span class="qr-paw">🐾</span>
            <span class="qr-paw">🐾</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import MarkdownPreview from './components/MarkdownPreview.vue'
import StatsBar from './components/StatsBar.vue'
import ThemeSelector from './components/ThemeSelector.vue'
import CopyButton from './components/CopyButton.vue'
import { getThemeList, getTheme } from './themes/index.js'

const STORAGE_KEY = 'md-cat-content'
const STORAGE_THEME_KEY = 'md-cat-theme'

// 从 localStorage 加载内容
const loadFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    return saved
  }
  return `# 欢迎使用 MD Cat

这是一个**Markdown转微信公众号风格**的工具。

## 功能特点

- 支持多种主题风格
- 实时预览
- 左右对比编辑
- Mermaid 图表支持
- KaTeX 数学公式支持

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, MD Cat!')
}
\`\`\`

### Mermaid 图表示例

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[结果1]
    B -->|否| D[结果2]
\`\`\`

### 数学公式示例

行内公式：$E = mc^2$

块级公式：

$$
\\int_0^\\infty e^{-x} dx = 1
$$

> 这是一个引用块

**粗体文本** 和 *斜体文本*

---

## 列表示例

1. 第一项
2. 第二项
3. 第三项

- 无序列表项
- 另一个列表项`
}

const markdownContent = ref(loadFromStorage())
const currentTheme = ref(localStorage.getItem(STORAGE_THEME_KEY) || 'wechat')
const lastSaved = ref('')
const copyButtonRef = ref(null)
const showQRCode = ref(false)

// 应用主题到 body
const applyTheme = (themeValue) => {
  const theme = getTheme(themeValue)
  document.body.setAttribute('data-theme', themeValue)
  document.body.setAttribute('data-theme-type', theme.type)
}

// 自动保存
let saveTimer = null
const autoSave = () => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, markdownContent.value)
    localStorage.setItem(STORAGE_THEME_KEY, currentTheme.value)
    lastSaved.value = new Date().toLocaleTimeString('zh-CN')
  }, 30000) // 30秒自动保存
}

// 手动保存
const handleSave = () => {
  localStorage.setItem(STORAGE_KEY, markdownContent.value)
  localStorage.setItem(STORAGE_THEME_KEY, currentTheme.value)
  lastSaved.value = new Date().toLocaleTimeString('zh-CN')
  
  // 显示保存提示
  const btn = document.querySelector('.save-btn')
  if (btn) {
    const originalText = btn.textContent
    btn.textContent = '✓ 已保存'
    btn.style.color = '#52c41a'
    setTimeout(() => {
      btn.textContent = originalText
      btn.style.color = ''
    }, 2000)
  }
}

const handleThemeChange = (value) => {
  currentTheme.value = value
  localStorage.setItem(STORAGE_THEME_KEY, value)
  applyTheme(value)
  autoSave()
}

const handleCopy = (format) => {
  // 复制成功后的回调
  console.log(`已复制${format}格式`)
}

// 快速复制（默认公众号格式）
const handleQuickCopy = () => {
  if (copyButtonRef.value) {
    copyButtonRef.value.copyWechat()
  }
}


// 监听内容变化，自动保存
watch(markdownContent, () => {
  autoSave()
})

onMounted(() => {
  // 加载最后保存时间
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    lastSaved.value = '已自动保存'
  }
  // 应用初始主题
  applyTheme(currentTheme.value)
})

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fefbf5;
}

.app-header {
  background: #fffef9;
  padding: 16px 24px;
  border-bottom: 2px solid #f0e8d8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  z-index: 10;
}

body[data-theme-type="dark"] .app-header {
  background: #252526;
  border-bottom-color: #3e3e42;
  color: #d4d4d4;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0;
}

.header-title h1 {
  font-size: 24px;
  color: #2c2c2c;
  font-weight: 600;
  transition: color 0.3s ease;
  margin: 0;
  margin-right: 8px;
}

.header-title h6 {
  font-size: 14px;
  color: #666;
  font-weight: 400;
  margin: 0;
  transition: color 0.3s ease;
}

body[data-theme-type="dark"] .header-title h1 {
  color: #d4d4d4;
}

body[data-theme-type="dark"] .header-title h6 {
  color: #999;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: rgba(255, 215, 0, 0.12);
  border-radius: 24px;
  border: 1px solid rgba(255, 215, 0, 0.25);
  transition: all 0.3s;
  margin-left: 8px;
  cursor: pointer;
}

.author-info:hover {
  background: rgba(255, 215, 0, 0.18);
  border-color: rgba(255, 215, 0, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.15);
}

.author-info:active {
  transform: translateY(0);
}

body[data-theme-type="dark"] .author-info {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.author-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.author-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-name-small {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2c;
}

body[data-theme-type="dark"] .author-name-small {
  color: #d4d4d4;
}

/* GitHub 图标 */
.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #2c2c2c;
  text-decoration: none;
  transition: all 0.2s;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.github-link:hover {
  color: #ffb347;
  background: rgba(255, 215, 0, 0.12);
  border-color: rgba(255, 215, 0, 0.25);
  transform: scale(1.05);
}

body[data-theme-type="dark"] .github-link {
  color: #d4d4d4;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

body[data-theme-type="dark"] .github-link:hover {
  color: #a78bfa;
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.theme-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-selector label {
  font-size: 14px;
  color: #666;
}

.theme-selector select {
  padding: 8px 12px;
  border: 1px solid #e8e5df;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
  outline: none;
  color: #2c2c2c;
  transition: all 0.2s;
}

.theme-selector select:hover {
  border-color: #d4c5b0;
  background: #fefefe;
}

.save-btn {
  padding: 8px 16px;
  border: 1px solid #e8e5df;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #2c2c2c;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #faf9f6;
  border-color: #d4c5b0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #faf9f6;
}

.editor-section {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #f0e8d8;
  background: #fefaf3;
  box-shadow: inset -2px 0 8px rgba(0, 0, 0, 0.015);
}

/* 二维码弹窗 */
.qr-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.qr-modal-content {
  background: #faf9f6;
  border-radius: 20px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

body[data-theme-type="dark"] .qr-modal-content {
  background: #252526;
  color: #d4d4d4;
}

.qr-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.qr-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: rotate(90deg);
}

body[data-theme-type="dark"] .qr-close-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #d4d4d4;
}

body[data-theme-type="dark"] .qr-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.qr-header {
  text-align: center;
  margin-bottom: 24px;
}

.qr-header h3 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
  letter-spacing: 0.5px;
}

body[data-theme-type="dark"] .qr-header h3 {
  color: #d4d4d4;
}

.qr-header p {
  font-size: 15px;
  color: #666;
  margin: 0;
}

body[data-theme-type="dark"] .qr-header p {
  color: #858585;
}

/* 二维码卡片 */
.qr-card {
  background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%);
  border-radius: 20px;
  padding: 32px;
  position: relative;
  border: 3px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

body[data-theme-type="dark"] .qr-card {
  background: linear-gradient(135deg, #3a3a2a 0%, #2d2d20 100%);
  border-color: #4a4a3a;
}

.qr-card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  text-align: left;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

body[data-theme-type="dark"] .qr-card-title {
  color: #d4d4d4;
}

.qr-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  width: 100%;
}

.qr-code-img {
  max-width: 100%;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 8px;
  object-fit: contain;
}

/* 装饰元素 */
.qr-decorations {
  position: absolute;
  top: 16px;
  right: 24px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.qr-cat {
  font-size: 28px;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}

.qr-cat:nth-child(1) {
  animation-delay: 0s;
}

.qr-cat:nth-child(2) {
  animation-delay: 0.5s;
}

.qr-cat:nth-child(3) {
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.qr-paws {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.qr-paw {
  font-size: 20px;
  opacity: 0.7;
  filter: hue-rotate(0deg);
  animation: pawColor 4s ease-in-out infinite;
}

.qr-paw:nth-child(1) { animation-delay: 0s; filter: hue-rotate(0deg); }
.qr-paw:nth-child(2) { animation-delay: 0.3s; filter: hue-rotate(30deg); }
.qr-paw:nth-child(3) { animation-delay: 0.6s; filter: hue-rotate(60deg); }
.qr-paw:nth-child(4) { animation-delay: 0.9s; filter: hue-rotate(90deg); }
.qr-paw:nth-child(5) { animation-delay: 1.2s; filter: hue-rotate(120deg); }
.qr-paw:nth-child(6) { animation-delay: 1.5s; filter: hue-rotate(150deg); }

@keyframes pawColor {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .qr-card {
    padding: 24px;
  }
  
  .qr-image-wrapper {
    margin: 16px 0;
  }
  
  .qr-code-img {
    max-width: 100%;
    padding: 6px;
  }
  
  .qr-decorations {
    position: static;
    justify-content: center;
    margin-top: 12px;
    margin-bottom: 12px;
  }
  
  .qr-card-title {
    text-align: center;
    margin-bottom: 16px;
  }
}
</style>

