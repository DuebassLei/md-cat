<template>
  <div class="preview-container">
    <div class="preview-header">
      <span>预览效果</span>
    </div>
    <div class="preview-content-wrapper">
      <div 
        class="preview-content"
        :class="[`theme-${theme}`]"
        v-html="renderedContent"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import katex from 'katex'
import 'highlight.js/styles/atom-one-dark.css'
import 'katex/dist/katex.css'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'wechat'
  }
})

// 配置 marked (v11 API)
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        return hljs.highlightAuto(code).value
      }
    }
    return hljs.highlightAuto(code).value
  }
})

// 初始化 Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose'
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  
  // 先处理数学公式（KaTeX）
  let processedContent = props.content
  
  // 处理块级公式 $$...$$
  processedContent = processedContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true })
    } catch (e) {
      return match
    }
  })
  
  // 处理行内公式 $...$
  processedContent = processedContent.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false })
    } catch (e) {
      return match
    }
  })
  
  // 使用 marked 解析 Markdown
  const html = marked(processedContent)
  
  // 使用 DOMPurify 清理 HTML（XSS 保护）
  let sanitizedHtml = DOMPurify.sanitize(html)
  
  // 美化代码块：添加语言标签和复制按钮
  // 处理带语言标签的代码块
  sanitizedHtml = sanitizedHtml.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
    // 提取纯文本用于复制（移除 HTML 标签和实体）
    const codeText = code
      .replace(/<[^>]+>/g, '') // 移除 HTML 标签
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
    const escapedCodeText = codeText.replace(/"/g, '&quot;').replace(/\n/g, '\\n')
    return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${lang}</span><button class="code-copy-btn" data-copy-text="${escapedCodeText}">复制</button></div><pre><code class="language-${lang}">${code}</code></pre></div>`
  })
  
  // 处理没有语言标签的代码块
  sanitizedHtml = sanitizedHtml.replace(/<pre><code(?! class="language-)([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
    const codeText = code
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
    const escapedCodeText = codeText.replace(/"/g, '&quot;').replace(/\n/g, '\\n')
    return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">代码</span><button class="code-copy-btn" data-copy-text="${escapedCodeText}">复制</button></div><pre><code${attrs}>${code}</code></pre></div>`
  })
  
  return sanitizedHtml
})

// 渲染 Mermaid 图表
const renderMermaid = async () => {
  await nextTick()
  const previewContent = document.querySelector('.preview-content')
  if (!previewContent) return
  
  const mermaidElements = previewContent.querySelectorAll('pre code.language-mermaid')
  
  for (let index = 0; index < mermaidElements.length; index++) {
    const element = mermaidElements[index]
    const code = element.textContent || element.innerText
    if (!code.trim()) continue
    
    // 检查是否已经渲染过
    const preElement = element.closest('pre')
    if (preElement && preElement.dataset.mermaidRendered === 'true') continue
    
    const id = `mermaid-${Date.now()}-${index}`
    
    try {
      // 标记为已渲染
      if (preElement) {
        preElement.dataset.mermaidRendered = 'true'
      }
      
      // 渲染 Mermaid
      const { svg } = await mermaid.render(id, code)
      
      // 创建容器并替换
      const container = document.createElement('div')
      container.className = 'mermaid-container'
      container.innerHTML = svg
      
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(container, preElement)
      }
    } catch (error) {
      console.error('Mermaid render error:', error)
      if (preElement) {
        preElement.dataset.mermaidRendered = 'false'
      }
    }
  }
}

// 渲染 KaTeX（如果还有未处理的）
const renderKaTeX = () => {
  nextTick(() => {
    // KaTeX 已经在 marked 之前处理了
  })
}

// 初始化代码块复制功能
const initCodeCopyButtons = () => {
  nextTick(() => {
    const previewContent = document.querySelector('.preview-content')
    if (!previewContent) return
    
    const copyButtons = previewContent.querySelectorAll('.code-copy-btn')
    copyButtons.forEach(btn => {
      // 如果已经绑定过事件，跳过
      if (btn.dataset.bound === 'true') return
      
      btn.dataset.bound = 'true'
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        e.preventDefault()
        
        // 优先使用 data-copy-text，否则从 code 元素获取
        let codeText = btn.getAttribute('data-copy-text')
        if (!codeText) {
          const codeElement = btn.closest('.code-block-wrapper')?.querySelector('code')
          if (codeElement) {
            codeText = codeElement.textContent || codeElement.innerText || ''
          }
        }
        
        // 解码 HTML 实体
        if (codeText) {
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = codeText
          codeText = tempDiv.textContent || tempDiv.innerText || codeText
        }
        
        if (!codeText) return
        
        try {
          await navigator.clipboard.writeText(codeText)
          const originalText = btn.textContent
          btn.textContent = '✓ 已复制'
          btn.style.background = '#52c41a'
          btn.style.borderColor = '#52c41a'
          btn.style.color = '#fff'
          setTimeout(() => {
            btn.textContent = originalText
            btn.style.background = ''
            btn.style.borderColor = ''
            btn.style.color = ''
          }, 2000)
        } catch (err) {
          console.error('复制失败:', err)
          btn.textContent = '复制失败'
          setTimeout(() => {
            btn.textContent = '复制'
          }, 2000)
        }
      })
    })
  })
}

watch(() => props.content, async () => {
  await nextTick()
  renderMermaid()
  renderKaTeX()
  initCodeCopyButtons()
})

onMounted(() => {
  renderMermaid()
  renderKaTeX()
  initCodeCopyButtons()
})
</script>

<style scoped>
.preview-container {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #fffef9;
  overflow: hidden;
  transition: background-color 0.3s ease;
  box-shadow: inset 2px 0 8px rgba(0, 0, 0, 0.015);
}

body[data-theme-type="dark"] .preview-container {
  background: #1e1e1e;
}

.preview-header {
  padding: 12px 16px;
  background: #faf5eb;
  border-bottom: 2px solid #f0e8d8;
  font-size: 14px;
  font-weight: 600;
  color: #5c4a3a;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

body[data-theme-type="dark"] .preview-header {
  background: #252526;
  border-bottom-color: #3e3e42;
  color: #858585;
}

.preview-content-wrapper {
  flex: 1;
  overflow-y: auto;
  background: #fffef9;
  padding: 20px;
  transition: background-color 0.3s ease;
}

body[data-theme-type="dark"] .preview-content-wrapper {
  background: #1e1e1e;
}

.preview-content {
  min-height: 100%;
}

/* 通用列表样式优化 */
.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
  line-height: 1.8;
}

.preview-content :deep(li) {
  margin: 10px 0;
  line-height: 1.9;
  padding-left: 8px;
  position: relative;
}

/* 无序列表美化 */
.preview-content :deep(ul) {
  list-style: none;
}

.preview-content :deep(ul > li::before) {
  content: '•';
  color: #3498db;
  font-weight: bold;
  font-size: 1.2em;
  position: absolute;
  left: -20px;
  line-height: 1.9;
}

.preview-content :deep(ul ul > li::before) {
  content: '◦';
  color: #5dade2;
}

.preview-content :deep(ul ul ul > li::before) {
  content: '▪';
  color: #85c1e9;
}

/* 有序列表美化 */
.preview-content :deep(ol) {
  counter-reset: list-counter;
  list-style: none;
}

.preview-content :deep(ol > li) {
  counter-increment: list-counter;
  position: relative;
}

.preview-content :deep(ol > li::before) {
  content: counter(list-counter) '.';
  color: #3498db;
  font-weight: 600;
  position: absolute;
  left: -28px;
  min-width: 24px;
  text-align: right;
  line-height: 1.9;
}

/* 嵌套列表优化 */
.preview-content :deep(li > ul),
.preview-content :deep(li > ol) {
  margin-top: 8px;
  margin-bottom: 8px;
}

.preview-content :deep(li > p) {
  margin: 0;
  display: inline;
}

.preview-content :deep(li > p + p) {
  margin-top: 8px;
  display: block;
}

/* 微信公众号主题 */
.preview-content.theme-wechat {
  background: #fff;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.theme-wechat :deep(h1) {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #1a1a1a;
  text-align: center;
}

.theme-wechat :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  margin: 25px 0 15px;
  color: #1a1a1a;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.theme-wechat :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.6;
  margin: 20px 0 12px;
  color: #333;
}

.theme-wechat :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 15px 0;
  color: #3e3e3e;
  text-align: justify;
}

.theme-wechat :deep(strong) {
  font-weight: 700;
  color: #1a1a1a;
}

.theme-wechat :deep(em) {
  font-style: italic;
  color: #666;
}

.theme-wechat :deep(ul),
.theme-wechat :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-wechat :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #3e3e3e;
  padding-left: 8px;
}

.theme-wechat :deep(ul > li::before) {
  color: #576b95;
}

.theme-wechat :deep(ol > li::before) {
  color: #576b95;
}

.theme-wechat :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background: #f8f8f8;
  border-left: 4px solid #576b95;
  color: #666;
  font-size: 15px;
  line-height: 1.8;
}

.theme-wechat :deep(hr) {
  margin: 30px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}

.theme-wechat :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #e83e8c;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 通用代码块样式 */
.preview-content :deep(.code-block-wrapper) {
  position: relative;
  margin: 28px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05);
  background: #282c34;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: box-shadow 0.3s ease;
}

.preview-content :deep(.code-block-wrapper:hover) {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.preview-content :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: linear-gradient(135deg, #21252b 0%, #1e222a 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.preview-content :deep(.code-lang) {
  font-size: 12px;
  color: #61afef;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 10px;
  background: rgba(97, 175, 239, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(97, 175, 239, 0.2);
}

.preview-content :deep(.code-copy-btn) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #abb2bf;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-content :deep(.code-copy-btn:hover) {
  background: rgba(97, 175, 239, 0.2);
  border-color: rgba(97, 175, 239, 0.4);
  color: #61afef;
  transform: translateY(-1px);
}

.preview-content :deep(.code-copy-btn:active) {
  transform: translateY(0);
}

.preview-content :deep(.code-block-wrapper pre) {
  background: #282c34;
  padding: 24px;
  margin: 0;
  border-radius: 0;
  overflow-x: auto;
  line-height: 1.75;
  font-size: 14px;
  position: relative;
}

.preview-content :deep(.code-block-wrapper pre code) {
  background: transparent;
  padding: 0;
  color: #abb2bf;
  font-size: 14px;
  font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.75;
  display: block;
  font-weight: 400;
  tab-size: 2;
  -moz-tab-size: 2;
}

/* 优化代码高亮颜色 */
.preview-content :deep(.code-block-wrapper pre code .hljs-keyword),
.preview-content :deep(.code-block-wrapper pre code .hljs-selector-tag),
.preview-content :deep(.code-block-wrapper pre code .hljs-built_in) {
  color: #c678dd;
  font-weight: 500;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-string),
.preview-content :deep(.code-block-wrapper pre code .hljs-attr) {
  color: #98c379;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-comment),
.preview-content :deep(.code-block-wrapper pre code .hljs-quote) {
  color: #5c6370;
  font-style: italic;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-number),
.preview-content :deep(.code-block-wrapper pre code .hljs-literal) {
  color: #d19a66;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-function),
.preview-content :deep(.code-block-wrapper pre code .hljs-title) {
  color: #61afef;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-variable),
.preview-content :deep(.code-block-wrapper pre code .hljs-params) {
  color: #e06c75;
}

.preview-content :deep(.code-block-wrapper pre code .hljs-type),
.preview-content :deep(.code-block-wrapper pre code .hljs-class) {
  color: #e5c07b;
}

.theme-wechat :deep(pre) {
  background: #282c34;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-wechat :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #abb2bf;
  font-size: 14px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
}

.theme-wechat :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 20px 0;
  display: block;
}

/* 小红书卡片主题 */
.preview-content.theme-xiaohongshu {
  background: #fff;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.theme-xiaohongshu :deep(h1) {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.5;
  margin: 20px 0 16px;
  color: #333;
}

.theme-xiaohongshu :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
  margin: 18px 0 14px;
  color: #333;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-xiaohongshu :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  margin: 16px 0 12px;
  color: #ff6b6b;
}

.theme-xiaohongshu :deep(p) {
  font-size: 15px;
  line-height: 1.8;
  margin: 12px 0;
  color: #444;
}

.theme-xiaohongshu :deep(strong) {
  font-weight: 700;
  color: #ff6b6b;
}

.theme-xiaohongshu :deep(em) {
  font-style: italic;
  color: #666;
}

.theme-xiaohongshu :deep(ul),
.theme-xiaohongshu :deep(ol) {
  margin: 18px 0;
  padding-left: 28px;
}

.theme-xiaohongshu :deep(li) {
  font-size: 15px;
  line-height: 1.9;
  margin: 10px 0;
  color: #444;
  padding-left: 8px;
}

.theme-xiaohongshu :deep(ul > li::before) {
  color: #ff6b6b;
}

.theme-xiaohongshu :deep(ol > li::before) {
  color: #ff6b6b;
}

.theme-xiaohongshu :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border-left: 4px solid #ff6b6b;
  border-radius: 6px;
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}

.theme-xiaohongshu :deep(hr) {
  margin: 24px 0;
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff6b6b, transparent);
}

.theme-xiaohongshu :deep(code) {
  background: #fff5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #ff6b6b;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #ffe8e8;
}

.theme-xiaohongshu :deep(pre) {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
}

.theme-xiaohongshu :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #f8f8f2;
  font-size: 13px;
  border: none;
}

.theme-xiaohongshu :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Mermaid 样式 */
.theme-wechat :deep(.mermaid-container),
.theme-xiaohongshu :deep(.mermaid-container) {
  margin: 20px 0;
  text-align: center;
  overflow-x: auto;
}

.theme-wechat :deep(.mermaid-container svg),
.theme-xiaohongshu :deep(.mermaid-container svg) {
  max-width: 100%;
  height: auto;
}

/* KaTeX 样式 */
.theme-wechat :deep(.katex),
.theme-xiaohongshu :deep(.katex) {
  font-size: 1.1em;
}

.theme-wechat :deep(.katex-display),
.theme-xiaohongshu :deep(.katex-display) {
  margin: 20px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* 通用表格样式 */
.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
}

.preview-content :deep(table th),
.preview-content :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.preview-content :deep(table th) {
  font-weight: 600;
}

/* 通用链接样式 */
.preview-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.2s;
}

.preview-content :deep(a:hover) {
  color: #40a9ff;
  text-decoration: underline;
}

/* 暗色主题链接 */
body[data-theme-type="dark"] .preview-content :deep(a) {
  color: #4ec9b0;
}

body[data-theme-type="dark"] .preview-content :deep(a:hover) {
  color: #6ed4c0;
}

/* 各主题表格样式 */
.theme-wechat :deep(table th),
.theme-xiaohongshu :deep(table th),
.theme-github :deep(table th),
.theme-notion :deep(table th),
.theme-typora :deep(table th),
.theme-material :deep(table th),
.theme-aiarticle :deep(table th),
.theme-doocs :deep(table th),
.theme-doocsTech :deep(table th),
.theme-doocsArt :deep(table th),
.theme-doocsBusiness :deep(table th),
.theme-doocsFresh :deep(table th),
.theme-doocsWarm :deep(table th),
.theme-doocsCool :deep(table th) {
  background: #f5f5f5;
}

body[data-theme-type="dark"] .preview-content :deep(table th),
body[data-theme-type="dark"] .preview-content :deep(table td) {
  border-color: #3e3e42;
}

body[data-theme-type="dark"] .preview-content :deep(table th) {
  background: #252526;
}

/* GitHub 主题 */
.preview-content.theme-github {
  background: #fff;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}

.theme-github :deep(h1) {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.25;
  margin: 24px 0 16px;
  color: #24292f;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 10px;
}

.theme-github :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  margin: 24px 0 16px;
  color: #24292f;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 8px;
}

.theme-github :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
  margin: 24px 0 16px;
  color: #24292f;
}

.theme-github :deep(p) {
  font-size: 16px;
  line-height: 1.5;
  margin: 16px 0;
  color: #24292f;
}

.theme-github :deep(ul),
.theme-github :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-github :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #24292f;
  padding-left: 8px;
}

.theme-github :deep(ul > li::before) {
  color: #0969da;
}

.theme-github :deep(ol > li::before) {
  color: #0969da;
}

.theme-github :deep(code) {
  background: rgba(175, 184, 193, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 85%;
  color: #24292f;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.theme-github :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
  line-height: 1.45;
  border: 1px solid #d0d7de;
}

.theme-github :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #24292f;
}

.theme-github :deep(blockquote) {
  margin: 16px 0;
  padding: 0 16px;
  color: #656d76;
  border-left: 4px solid #d0d7de;
}

/* Notion 主题 */
.preview-content.theme-notion {
  background: #fff;
  max-width: 900px;
  margin: 0 auto;
  padding: 96px;
}

.theme-notion :deep(h1) {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
  margin: 4px 0;
  color: #37352f;
}

.theme-notion :deep(h2) {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.4em 0 1px;
  color: #37352f;
}

.theme-notion :deep(h3) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.2em 0 1px;
  color: #37352f;
}

.theme-notion :deep(p) {
  font-size: 16px;
  line-height: 1.5;
  margin: 1px 0;
  color: #37352f;
}

.theme-notion :deep(ul),
.theme-notion :deep(ol) {
  margin: 4px 0;
  padding-left: 24px;
}

.theme-notion :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 4px 0;
  color: #37352f;
  padding-left: 8px;
}

.theme-notion :deep(ul > li::before) {
  color: rgba(55, 53, 47, 0.8);
}

.theme-notion :deep(ol > li::before) {
  color: rgba(55, 53, 47, 0.8);
}

.theme-notion :deep(code) {
  background: rgba(135, 131, 120, 0.15);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 85%;
  color: #eb5757;
  font-family: 'SFMono-Regular', Consolas, monospace;
}

.theme-notion :deep(pre) {
  background: rgba(135, 131, 120, 0.15);
  padding: 16px;
  border-radius: 3px;
  overflow-x: auto;
  margin: 4px 0;
}

.theme-notion :deep(blockquote) {
  margin: 4px 0;
  padding: 0 14px;
  border-left: 3px solid currentcolor;
  color: rgba(55, 53, 47, 0.65);
}

/* Typora 主题 */
.preview-content.theme-typora {
  background: #fff;
  max-width: 860px;
  margin: 0 auto;
  padding: 20px 40px;
}

.theme-typora :deep(h1) {
  font-size: 2em;
  font-weight: 400;
  line-height: 1.2;
  margin: 1em 0 0.5em;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.theme-typora :deep(h2) {
  font-size: 1.5em;
  font-weight: 400;
  line-height: 1.225;
  margin: 1em 0 0.5em;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.theme-typora :deep(p) {
  font-size: 16px;
  line-height: 1.6;
  margin: 0.8em 0;
  color: #333;
}

.theme-typora :deep(ul),
.theme-typora :deep(ol) {
  margin: 1em 0;
  padding-left: 30px;
}

.theme-typora :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 0.5em 0;
  color: #333;
  padding-left: 8px;
}

.theme-typora :deep(ul > li::before) {
  color: #666;
}

.theme-typora :deep(ol > li::before) {
  color: #666;
}

.theme-typora :deep(code) {
  background: #f8f8f8;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e83e8c;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-typora :deep(pre) {
  background: #f8f8f8;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #ddd;
}

/* 暗色主题 */
.preview-content.theme-dark {
  background: #1e1e1e;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  color: #d4d4d4;
}

.theme-dark :deep(h1) {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #4ec9b0;
}

.theme-dark :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  margin: 25px 0 15px;
  color: #4ec9b0;
}

.theme-dark :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 15px 0;
  color: #d4d4d4;
}

.theme-dark :deep(ul),
.theme-dark :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-dark :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #d4d4d4;
  padding-left: 8px;
}

.theme-dark :deep(ul > li::before) {
  color: #4ec9b0;
}

.theme-dark :deep(ol > li::before) {
  color: #4ec9b0;
}

.theme-dark :deep(code) {
  background: #252526;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #ce9178;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-dark :deep(pre) {
  background: #252526;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
  border: 1px solid #3e3e42;
}

.theme-dark :deep(pre code) {
  background: transparent;
  color: #d4d4d4;
}

.theme-dark :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background: #252526;
  border-left: 4px solid #4ec9b0;
  color: #858585;
}

/* Dracula 主题 */
.preview-content.theme-dracula {
  background: #282a36;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  color: #f8f8f2;
}

.theme-dracula :deep(h1) {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #ff79c6;
}

.theme-dracula :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  margin: 25px 0 15px;
  color: #ff79c6;
}

.theme-dracula :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 15px 0;
  color: #f8f8f2;
}

.theme-dracula :deep(ul),
.theme-dracula :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-dracula :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #f8f8f2;
  padding-left: 8px;
}

.theme-dracula :deep(ul > li::before) {
  color: #bd93f9;
}

.theme-dracula :deep(ol > li::before) {
  color: #bd93f9;
}

.theme-dracula :deep(code) {
  background: #44475a;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #f1fa8c;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-dracula :deep(pre) {
  background: #44475a;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-dracula :deep(pre code) {
  background: transparent;
  color: #f8f8f2;
}

.theme-dracula :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background: #44475a;
  border-left: 4px solid #bd93f9;
  color: #f8f8f2;
}

/* Material 主题 */
.preview-content.theme-material {
  background: #fafafa;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-material :deep(h1) {
  font-size: 34px;
  font-weight: 400;
  line-height: 1.2;
  margin: 24px 0 16px;
  color: rgba(0, 0, 0, 0.87);
}

.theme-material :deep(h2) {
  font-size: 24px;
  font-weight: 400;
  line-height: 1.33;
  margin: 20px 0 16px;
  color: rgba(0, 0, 0, 0.87);
}

.theme-material :deep(p) {
  font-size: 16px;
  line-height: 1.5;
  margin: 16px 0;
  color: rgba(0, 0, 0, 0.87);
}

.theme-material :deep(ul),
.theme-material :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-material :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: rgba(0, 0, 0, 0.87);
  padding-left: 8px;
}

.theme-material :deep(ul > li::before) {
  color: #2196f3;
}

.theme-material :deep(ol > li::before) {
  color: #2196f3;
}

.theme-material :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 14px;
  color: #e91e63;
  font-family: 'Roboto Mono', monospace;
}

.theme-material :deep(pre) {
  background: #263238;
  padding: 20px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-material :deep(pre code) {
  background: transparent;
  color: #aed581;
}

.theme-material :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background: #eceff1;
  border-left: 4px solid #2196f3;
  color: rgba(0, 0, 0, 0.87);
}

/* 滚动条样式 */
.preview-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preview-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* AI文章主题 */
.preview-content.theme-aiarticle {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  background-attachment: fixed;
  padding: 50px 40px;
  min-height: 100%;
}

.theme-aiarticle :deep(> *) {
  background: #ffffff;
  max-width: 700px;
  margin: 0 auto;
  padding: 45px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.theme-aiarticle :deep(h1) {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 28px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}

.theme-aiarticle :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.5;
  margin: 32px 0 18px;
  color: #667eea;
  padding-left: 16px;
  border-left: 4px solid #667eea;
  padding-top: 4px;
  padding-bottom: 4px;
}

.theme-aiarticle :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  margin: 26px 0 14px;
  color: #764ba2;
  padding-left: 12px;
  border-left: 3px solid #764ba2;
}

.theme-aiarticle :deep(p) {
  font-size: 16px;
  line-height: 1.9;
  margin: 18px 0;
  color: #2d3748;
  text-align: justify;
}

.theme-aiarticle :deep(strong) {
  font-weight: 700;
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  padding: 2px 6px;
  border-radius: 4px;
}

.theme-aiarticle :deep(em) {
  font-style: italic;
  color: #764ba2;
  font-weight: 500;
}

.theme-aiarticle :deep(ul),
.theme-aiarticle :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-aiarticle :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #333;
  padding-left: 8px;
}

.theme-aiarticle :deep(ul > li::before) {
  color: #667eea;
}

.theme-aiarticle :deep(ol > li::before) {
  color: #667eea;
}

.theme-aiarticle :deep(blockquote) {
  margin: 24px 0;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
  border-left: 4px solid #667eea;
  border-radius: 8px;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.9;
  position: relative;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
}

.theme-aiarticle :deep(blockquote::before) {
  content: '"';
  font-size: 48px;
  color: #667eea;
  opacity: 0.25;
  position: absolute;
  top: 8px;
  left: 16px;
  font-family: Georgia, serif;
  line-height: 1;
  font-weight: 300;
}

.theme-aiarticle :deep(hr) {
  margin: 24px auto;
  border: none;
  height: 1px;
  max-width: 100%;
  background: #e0e0e0;
  border-radius: 0;
}


.theme-aiarticle :deep(code) {
  background: rgba(102, 126, 234, 0.12);
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 14px;
  color: #764ba2;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  border: 1px solid rgba(102, 126, 234, 0.15);
  font-weight: 500;
}

.theme-aiarticle :deep(pre) {
  background: #1a1a2e;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 24px 0;
  border: 1px solid rgba(102, 126, 234, 0.25);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.theme-aiarticle :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #c4b5fd;
  border: none;
  font-weight: 400;
}

.theme-aiarticle :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 24px 0;
  display: block;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

/* 读书笔记主题 */
.preview-content.theme-readingnotes {
  background: #faf8f3;
  max-width: 720px;
  margin: 0 auto;
  padding: 50px 40px;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.theme-readingnotes :deep(h1) {
  font-size: 36px;
  font-weight: 400;
  line-height: 1.4;
  margin: 0 0 30px;
  color: #2c3e50;
  text-align: center;
  font-family: 'Georgia', serif;
  letter-spacing: 1px;
  border-bottom: 2px solid #d4a574;
  padding-bottom: 20px;
}

.theme-readingnotes :deep(h2) {
  font-size: 28px;
  font-weight: 400;
  line-height: 1.5;
  margin: 40px 0 20px;
  color: #34495e;
  font-family: 'Georgia', serif;
  padding-left: 20px;
  border-left: 3px solid #d4a574;
}

.theme-readingnotes :deep(h3) {
  font-size: 22px;
  font-weight: 400;
  line-height: 1.5;
  margin: 30px 0 15px;
  color: #34495e;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.theme-readingnotes :deep(p) {
  font-size: 18px;
  line-height: 1.9;
  margin: 20px 0;
  color: #2c3e50;
  text-align: justify;
  text-indent: 2em;
}

.theme-readingnotes :deep(p:first-of-type) {
  text-indent: 0;
  font-size: 20px;
  font-weight: 500;
  color: #34495e;
}

.theme-readingnotes :deep(strong) {
  font-weight: 600;
  color: #2c3e50;
  background: rgba(212, 165, 116, 0.1);
  padding: 2px 4px;
}

.theme-readingnotes :deep(em) {
  font-style: italic;
  color: #7f8c8d;
}

.theme-readingnotes :deep(ul),
.theme-readingnotes :deep(ol) {
  margin: 20px 0;
  padding-left: 40px;
}

.theme-readingnotes :deep(li) {
  font-size: 18px;
  line-height: 1.9;
  margin: 12px 0;
  color: #2c3e50;
}

.theme-readingnotes :deep(li::marker) {
  color: #d4a574;
}

.theme-readingnotes :deep(blockquote) {
  margin: 30px 0;
  padding: 25px 30px;
  background: #f5f1e8;
  border-left: 4px solid #d4a574;
  border-radius: 4px;
  color: #555;
  font-size: 17px;
  line-height: 1.9;
  font-style: italic;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.theme-readingnotes :deep(blockquote::before) {
  content: '"';
  font-size: 60px;
  color: #d4a574;
  opacity: 0.3;
  position: absolute;
  top: 10px;
  left: 15px;
  font-family: Georgia, serif;
  line-height: 1;
}                                                                             

.theme-readingnotes :deep(hr) {
  margin: 40px 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d4a574, transparent);
}

.theme-readingnotes :deep(code) {
  background: #f5f1e8;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 16px;
  color: #8b4513;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #e8ddd4;
}

.theme-readingnotes :deep(pre) {
  background: #2c3e50;
  padding: 25px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 25px 0;
  border-left: 4px solid #d4a574;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-readingnotes :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #ecf0f1;
  font-size: 15px;
  border: none;
}

.theme-readingnotes :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 25px 0;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8ddd4;
}

.theme-readingnotes :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 25px 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.theme-readingnotes :deep(table th) {
  background: #f5f1e8;
  color: #2c3e50;
  font-weight: 600;
  border: 1px solid #d4a574;
}

.theme-readingnotes :deep(table td) {
  border: 1px solid #e8ddd4;
  color: #2c3e50;
}

/* Doocs 简约主题 */
.preview-content.theme-doocs {
  background: #ffffff;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.theme-doocs :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.6;
  margin: 32px 0 20px;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #3498db;
}

.theme-doocs :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  margin: 28px 0 16px;
  color: #34495e;
  padding-left: 12px;
  border-left: 4px solid #3498db;
}

.theme-doocs :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.6;
  margin: 24px 0 12px;
  color: #34495e;
}

.theme-doocs :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #2c3e50;
  text-align: justify;
}

.theme-doocs :deep(ul),
.theme-doocs :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocs :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #2c3e50;
  padding-left: 8px;
}

.theme-doocs :deep(ul > li::before) {
  color: #3498db;
}

.theme-doocs :deep(ol > li::before) {
  color: #3498db;
}

.theme-doocs :deep(strong) {
  font-weight: 600;
  color: #2c3e50;
}

.theme-doocs :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: #ecf0f1;
  border-left: 4px solid #3498db;
  color: #555;
  border-radius: 4px;
}

.theme-doocs :deep(code) {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #e74c3c;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocs :deep(pre) {
  background: #2c3e50;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-doocs :deep(pre code) {
  background: transparent;
  color: #ecf0f1;
}

/* Doocs 科技主题 */
.preview-content.theme-doocsTech {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
  padding: 50px 40px;
  min-height: 100%;
}

.theme-doocsTech :deep(> *) {
  background: #ffffff;
  max-width: 700px;
  margin: 0 auto;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.theme-doocsTech :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}

.theme-doocsTech :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.5;
  margin: 28px 0 16px;
  color: #667eea;
  padding-left: 16px;
  border-left: 4px solid #667eea;
}

.theme-doocsTech :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #333;
}

.theme-doocsTech :deep(ul),
.theme-doocsTech :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocsTech :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #333;
  padding-left: 8px;
}

.theme-doocsTech :deep(ul > li::before) {
  color: #667eea;
}

.theme-doocsTech :deep(ol > li::before) {
  color: #667eea;
}

.theme-doocsTech :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 4px solid #667eea;
  border-radius: 6px;
  color: #555;
}

.theme-doocsTech :deep(code) {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #764ba2;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocsTech :deep(pre) {
  background: #1a1a2e;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

/* Doocs 文艺主题 */
.preview-content.theme-doocsArt {
  background: #faf8f3;
  max-width: 720px;
  margin: 0 auto;
  padding: 50px 40px;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.theme-doocsArt :deep(h1) {
  font-size: 32px;
  font-weight: 400;
  line-height: 1.4;
  margin: 0 0 30px;
  color: #8b4513;
  text-align: center;
  font-family: 'Georgia', serif;
  letter-spacing: 2px;
  border-bottom: 3px double #d4a574;
  padding-bottom: 20px;
}

.theme-doocsArt :deep(h2) {
  font-size: 26px;
  font-weight: 400;
  line-height: 1.5;
  margin: 35px 0 20px;
  color: #8b4513;
  font-family: 'Georgia', serif;
  font-style: italic;
  padding-left: 20px;
  border-left: 4px solid #d4a574;
}

.theme-doocsArt :deep(p) {
  font-size: 18px;
  line-height: 2;
  margin: 20px 0;
  color: #5c4a37;
  text-align: justify;
  text-indent: 2em;
}

.theme-doocsArt :deep(p:first-of-type) {
  text-indent: 0;
  font-size: 20px;
  font-weight: 500;
  color: #8b4513;
}

.theme-doocsArt :deep(ul),
.theme-doocsArt :deep(ol) {
  margin: 22px 0;
  padding-left: 40px;
}

.theme-doocsArt :deep(li) {
  font-size: 18px;
  line-height: 2;
  margin: 12px 0;
  color: #5c4a37;
  padding-left: 10px;
}

.theme-doocsArt :deep(ul > li::before) {
  color: #8b4513;
  font-size: 1.1em;
}

.theme-doocsArt :deep(ol > li::before) {
  color: #8b4513;
}

.theme-doocsArt :deep(blockquote) {
  margin: 25px 0;
  padding: 20px 25px;
  background: #f5f1e8;
  border-left: 4px solid #d4a574;
  border-radius: 4px;
  color: #6b5b47;
  font-style: italic;
  font-size: 17px;
  line-height: 1.9;
}

.theme-doocsArt :deep(code) {
  background: #f5f1e8;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 16px;
  color: #8b4513;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocsArt :deep(pre) {
  background: #2c2416;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 25px 0;
  border-left: 4px solid #d4a574;
}

.theme-doocsArt :deep(pre code) {
  background: transparent;
  color: #e8ddd4;
}

/* Doocs 商务主题 */
.preview-content.theme-doocsBusiness {
  background: #ffffff;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.theme-doocsBusiness :deep(h1) {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.5;
  margin: 30px 0 20px;
  color: #1a1a1a;
  text-align: center;
  padding: 15px 0;
  border-top: 2px solid #1a1a1a;
  border-bottom: 2px solid #1a1a1a;
  letter-spacing: 1px;
}

.theme-doocsBusiness :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.5;
  margin: 28px 0 16px;
  color: #2c3e50;
  padding: 10px 0;
  border-bottom: 1px solid #bdc3c7;
}

.theme-doocsBusiness :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #34495e;
  text-align: justify;
}

.theme-doocsBusiness :deep(ul),
.theme-doocsBusiness :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocsBusiness :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #34495e;
  padding-left: 8px;
}

.theme-doocsBusiness :deep(ul > li::before) {
  color: #2c3e50;
}

.theme-doocsBusiness :deep(ol > li::before) {
  color: #2c3e50;
}

.theme-doocsBusiness :deep(strong) {
  font-weight: 700;
  color: #1a1a1a;
}

.theme-doocsBusiness :deep(blockquote) {
  margin: 20px 0;
  padding: 18px 22px;
  background: #f8f9fa;
  border-left: 4px solid #34495e;
  color: #555;
  border-radius: 0;
  font-size: 15px;
}

.theme-doocsBusiness :deep(code) {
  background: #f1f2f6;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 14px;
  color: #2c3e50;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #dfe4ea;
}

.theme-doocsBusiness :deep(pre) {
  background: #2c3e50;
  padding: 18px;
  border-radius: 0;
  overflow-x: auto;
  margin: 20px 0;
  border: 1px solid #1a1a1a;
}

.theme-doocsBusiness :deep(pre code) {
  background: transparent;
  color: #ecf0f1;
  border: none;
}

/* Doocs 清新主题 */
.preview-content.theme-doocsFresh {
  background: linear-gradient(180deg, #e8f5e9 0%, #ffffff 20%);
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
}

.theme-doocsFresh :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #2e7d32;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #66bb6a;
}

.theme-doocsFresh :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  margin: 28px 0 16px;
  color: #388e3c;
  padding-left: 12px;
  border-left: 4px solid #66bb6a;
}

.theme-doocsFresh :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #2e7d32;
  text-align: justify;
}

.theme-doocsFresh :deep(ul),
.theme-doocsFresh :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocsFresh :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #2e7d32;
  padding-left: 8px;
}

.theme-doocsFresh :deep(ul > li::before) {
  color: #66bb6a;
}

.theme-doocsFresh :deep(ol > li::before) {
  color: #66bb6a;
}

.theme-doocsFresh :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: #e8f5e9;
  border-left: 4px solid #66bb6a;
  color: #1b5e20;
  border-radius: 6px;
}

.theme-doocsFresh :deep(code) {
  background: #c8e6c9;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #2e7d32;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocsFresh :deep(pre) {
  background: #1b5e20;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-doocsFresh :deep(pre code) {
  background: transparent;
  color: #c8e6c9;
}

/* Doocs 温暖主题 */
.preview-content.theme-doocsWarm {
  background: #fff8f0;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
}

.theme-doocsWarm :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #d84315;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #ff8a65;
}

.theme-doocsWarm :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  margin: 28px 0 16px;
  color: #e64a19;
  padding-left: 12px;
  border-left: 4px solid #ff8a65;
}

.theme-doocsWarm :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #bf360c;
  text-align: justify;
}

.theme-doocsWarm :deep(ul),
.theme-doocsWarm :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocsWarm :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #bf360c;
  padding-left: 8px;
}

.theme-doocsWarm :deep(ul > li::before) {
  color: #ff8a65;
}

.theme-doocsWarm :deep(ol > li::before) {
  color: #ff8a65;
}

.theme-doocsWarm :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: #ffe0b2;
  border-left: 4px solid #ff8a65;
  color: #bf360c;
  border-radius: 6px;
}

.theme-doocsWarm :deep(code) {
  background: #ffccbc;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #d84315;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocsWarm :deep(pre) {
  background: #bf360c;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-doocsWarm :deep(pre code) {
  background: transparent;
  color: #ffccbc;
}

/* Doocs 冷色主题 */
.preview-content.theme-doocsCool {
  background: #f0f4f8;
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 30px;
}

.theme-doocsCool :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.6;
  margin: 30px 0 20px;
  color: #0277bd;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #64b5f6;
}

.theme-doocsCool :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  margin: 28px 0 16px;
  color: #0288d1;
  padding-left: 12px;
  border-left: 4px solid #64b5f6;
}

.theme-doocsCool :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin: 16px 0;
  color: #01579b;
  text-align: justify;
}

.theme-doocsCool :deep(ul),
.theme-doocsCool :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.theme-doocsCool :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  margin: 10px 0;
  color: #01579b;
  padding-left: 8px;
}

.theme-doocsCool :deep(ul > li::before) {
  color: #64b5f6;
}

.theme-doocsCool :deep(ol > li::before) {
  color: #64b5f6;
}

.theme-doocsCool :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: #e1f5fe;
  border-left: 4px solid #64b5f6;
  color: #01579b;
  border-radius: 6px;
}

.theme-doocsCool :deep(code) {
  background: #b3e5fc;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
  color: #0277bd;
  font-family: 'Consolas', 'Monaco', monospace;
}

.theme-doocsCool :deep(pre) {
  background: #01579b;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.theme-doocsCool :deep(pre code) {
  background: transparent;
  color: #b3e5fc;
}

/* 代码块滚动条样式 */
.preview-content :deep(.code-block-wrapper pre::-webkit-scrollbar) {
  height: 10px;
}

.preview-content :deep(.code-block-wrapper pre::-webkit-scrollbar-track) {
  background: #1e1e1e;
  border-radius: 5px;
  margin: 0 4px;
}

.preview-content :deep(.code-block-wrapper pre::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, #4a5568 0%, #5a6578 100%);
  border-radius: 5px;
  border: 2px solid #1e1e1e;
  transition: background 0.2s;
}

.preview-content :deep(.code-block-wrapper pre::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(90deg, #5a6578 0%, #6a7588 100%);
}

/* 优化行内代码样式 */
.preview-content :deep(code:not(pre code):not(.code-block-wrapper code)) {
  background: rgba(175, 184, 193, 0.15);
  padding: 3px 7px;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 500;
  color: #e83e8c;
  border: 1px solid rgba(175, 184, 193, 0.2);
  transition: all 0.2s;
}

.preview-content :deep(code:not(pre code):not(.code-block-wrapper code):hover) {
  background: rgba(175, 184, 193, 0.25);
  border-color: rgba(175, 184, 193, 0.3);
}

/* 暗色主题滚动条 */
[data-theme-type="dark"] .preview-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

[data-theme-type="dark"] .preview-content::-webkit-scrollbar-thumb {
  background: #555;
}

[data-theme-type="dark"] .preview-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>

