<template>
  <div class="copy-button">
    <button class="copy-btn" @click="toggleDropdown" :class="{ active: isOpen }">
      <span>📋 复制</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </button>
    <div class="copy-dropdown" v-if="isOpen" @click.stop>
      <div class="copy-option" @click="copyContent('wechat')">
        <span class="option-icon">📱</span>
        <span class="option-text">公众号格式</span>
      </div>
      <div class="copy-option" @click="copyContent('html')">
        <span class="option-icon">🌐</span>
        <span class="option-text">HTML格式</span>
      </div>
      <div class="copy-option" @click="copyContent('markdown')">
        <span class="option-icon">📝</span>
        <span class="option-text">MD格式</span>
      </div>
      <div class="copy-option" @click="copyContent('notion')">
        <span class="option-icon">📑</span>
        <span class="option-text">Notion笔记格式</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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

const emit = defineEmits(['copy'])

const isOpen = ref(false)

// 暴露方法供外部调用
defineExpose({
  copyWechat: () => copyContent('wechat')
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e) => {
  if (!e.target.closest('.copy-button')) {
    isOpen.value = false
  }
}

const copyToClipboard = async (text, html = null) => {
  try {
    // 如果提供了 HTML 内容，使用富文本复制
    if (html !== null && navigator.clipboard && navigator.clipboard.write) {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })
      await navigator.clipboard.write([clipboardItem])
      return true
    }
    
    // 纯文本复制
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案：尝试使用 execCommand 复制 HTML
      if (html !== null) {
        // 创建一个可编辑的 div 来承载 HTML
        const div = document.createElement('div')
        div.contentEditable = 'true'
        div.innerHTML = html
        div.style.position = 'fixed'
        div.style.left = '-9999px'
        div.style.top = '0'
        div.style.width = '1px'
        div.style.height = '1px'
        div.style.opacity = '0'
        div.style.pointerEvents = 'none'
        document.body.appendChild(div)
        
        // 选中内容
        const range = document.createRange()
        range.selectNodeContents(div)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        
        // 尝试复制
        let success = false
        try {
          success = document.execCommand('copy')
        } catch (e) {
          console.error('execCommand copy failed:', e)
        }
        
        // 清理
        selection.removeAllRanges()
        document.body.removeChild(div)
        return success
      } else {
        // 纯文本降级方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success
      }
    }
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}

const copyContent = async (format) => {
  let contentToCopy = ''
  
  if (format === 'markdown') {
    // 直接复制 Markdown 源码
    contentToCopy = props.content
  } else if (format === 'notion') {
    // Notion笔记格式：优化Markdown以适配Notion导入
    contentToCopy = convertToNotionFormat(props.content)
  } else {
    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const previewContent = document.querySelector('.preview-content')
    if (!previewContent) {
      showToast('无法获取预览内容', 'error')
      return
    }
    
    if (format === 'html') {
      // HTML 格式：直接复制渲染后的 HTML
      contentToCopy = previewContent.innerHTML
    } else if (format === 'wechat') {
      // 公众号格式：获取带样式的 HTML，优化为公众号编辑器兼容格式
      const cloned = previewContent.cloneNode(true)
      
      // 移除主题类名，保留内容
      cloned.className = cloned.className.replace(/theme-\w+/g, '').trim()
      
      // 移除代码块复制按钮和头部
      const codeCopyBtns = cloned.querySelectorAll('.code-copy-btn, .code-block-header')
      codeCopyBtns.forEach(btn => btn.remove())
      
      // 处理代码块：将高亮span标签转换为纯文本，但保留代码结构
      const codeWrappers = cloned.querySelectorAll('.code-block-wrapper, pre')
      codeWrappers.forEach(wrapper => {
        const pre = wrapper.tagName === 'PRE' ? wrapper : wrapper.querySelector('pre')
        const code = pre ? (pre.querySelector('code') || pre) : null
        
        if (code) {
          // 使用 <pre> 标签，这是代码块的标准HTML标签，公众号编辑器更兼容
          const newPre = document.createElement('pre')
          // 使用最基础的样式，移除可能不兼容的属性（如 border-radius）
          const preStyle = 'background-color: #f5f5f5; padding: 18px 20px; margin: 20px 0; border: 1px solid #ddd; overflow-x: auto; color: #333; font-size: 14px; font-family: Consolas, Monaco, "Courier New", Menlo, monospace; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;'
          newPre.setAttribute('style', preStyle)
          
          // 尝试保留语法高亮的HTML结构
          // 检查code元素内部是否有高亮的span标签
          const codeHTML = code.innerHTML
          const hasHighlighting = code.querySelectorAll('span[class*="hljs"], span[class*="token"]').length > 0
          
          if (hasHighlighting && codeHTML) {
            // 如果有语法高亮，尝试保留HTML结构
            // 创建一个code元素来包含高亮的HTML
            const codeElement = document.createElement('code')
            codeElement.innerHTML = codeHTML
            
            // 清理和优化高亮span标签的样式，确保公众号编辑器兼容
            codeElement.querySelectorAll('span').forEach(span => {
              const className = span.className || ''
              // 获取span的原始样式（如果有）
              const originalStyle = span.getAttribute('style') || ''
              
              // 根据highlight.js的类名设置颜色，使用更丰富的颜色映射
              let color = '#333' // 默认颜色
              
              // 关键词（function, return, if, else等）
              if (className.includes('hljs-keyword') || className.includes('token-keyword')) {
                color = '#d73a49' // 红色
              }
              // 字符串
              else if (className.includes('hljs-string') || className.includes('token-string')) {
                color = '#032f62' // 深蓝色
              }
              // 函数名、方法名
              else if (className.includes('hljs-function') || className.includes('hljs-title') || className.includes('hljs-name') || className.includes('token-function')) {
                color = '#6f42c1' // 紫色
              }
              // 注释
              else if (className.includes('hljs-comment') || className.includes('token-comment')) {
                color = '#6a737d' // 灰色
              }
              // 数字
              else if (className.includes('hljs-number') || className.includes('token-number')) {
                color = '#005cc5' // 蓝色
              }
              // 变量
              else if (className.includes('hljs-variable') || className.includes('token-variable')) {
                color = '#e36209' // 橙色
              }
              // 内置函数、常量
              else if (className.includes('hljs-built_in') || className.includes('hljs-builtin-name') || className.includes('hljs-literal')) {
                color = '#005cc5' // 蓝色
              }
              // 属性
              else if (className.includes('hljs-attr') || className.includes('token-attr-name')) {
                color = '#005cc5' // 蓝色
              }
              // 操作符
              else if (className.includes('hljs-operator') || className.includes('token-operator')) {
                color = '#d73a49' // 红色
              }
              // 标点符号
              else if (className.includes('hljs-punctuation') || className.includes('token-punctuation')) {
                color = '#333' // 黑色
              }
              
              // 设置span的样式
              span.setAttribute('style', `color: ${color}; ${originalStyle}`)
              // 移除class属性，只保留内联样式
              span.removeAttribute('class')
            })
            
            newPre.appendChild(codeElement)
          } else {
            // 如果没有语法高亮，使用纯文本
            const codeText = code.textContent || code.innerText || ''
            newPre.textContent = codeText
          }
          
          // 替换整个wrapper
          const parent = wrapper.parentNode
          if (parent) {
            parent.replaceChild(newPre, wrapper)
          }
        }
      })
      
      // 处理行内代码（不在代码块中的code标签）
      // 先标记已处理的代码块
      const processedCodeBlocks = new Set()
      codeWrappers.forEach(wrapper => {
        const allCodes = wrapper.querySelectorAll('code')
        allCodes.forEach(code => processedCodeBlocks.add(code))
      })
      
      // 现在处理所有code标签，排除已处理的代码块中的code
      const allCodes = cloned.querySelectorAll('code')
      allCodes.forEach(code => {
        // 如果不在已处理的代码块中，就是行内代码
        if (!processedCodeBlocks.has(code)) {
          const text = code.textContent || code.innerText || ''
          code.innerHTML = ''
          code.textContent = text
          code.className = ''
          // 优化行内代码样式：更清晰的背景和颜色对比
          code.style.cssText = 'background: #f0f0f0; padding: 3px 7px; border-radius: 4px; font-size: 15px; color: #d73a49; font-family: "Consolas", "Monaco", "Courier New", "Menlo", monospace; display: inline; border: 1px solid #e1e4e8; font-weight: 500;'
        }
      })
      
      // 处理 Mermaid 图表容器（公众号不支持）
      const mermaidContainers = cloned.querySelectorAll('.mermaid-container')
      mermaidContainers.forEach(container => {
        const placeholder = document.createElement('p')
        placeholder.style.cssText = 'padding: 20px; background: #f8f8f8; border-radius: 4px; text-align: center; color: #999; margin: 20px 0; font-size: 15px; border: 1px dashed #ddd;'
        placeholder.textContent = '📊 图表内容，请在公众号编辑器中重新插入'
        container.parentNode?.replaceChild(placeholder, container)
      })
      
      // 处理 KaTeX 数学公式（公众号可能不支持，但保留HTML结构）
      const mathElements = cloned.querySelectorAll('.katex, .katex-display')
      mathElements.forEach(math => {
        // 保留数学公式的HTML，公众号可能支持部分LaTeX渲染
        // 如果不支持，至少会显示为文本
      })
      
      // 优化所有元素的样式，使其适合公众号编辑器
      // 处理标题
      cloned.querySelectorAll('h1').forEach(h1 => {
        h1.style.cssText = 'font-size: 22px; font-weight: 700; line-height: 1.6; margin: 30px 0 20px; color: #1a1a1a; text-align: center;'
        h1.removeAttribute('class')
      })
      
      cloned.querySelectorAll('h2').forEach(h2 => {
        h2.style.cssText = 'font-size: 20px; font-weight: 700; line-height: 1.6; margin: 25px 0 15px; color: #1a1a1a; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;'
        h2.removeAttribute('class')
      })
      
      cloned.querySelectorAll('h3').forEach(h3 => {
        h3.style.cssText = 'font-size: 18px; font-weight: 600; line-height: 1.6; margin: 20px 0 12px; color: #333;'
        h3.removeAttribute('class')
      })
      
      cloned.querySelectorAll('h4, h5, h6').forEach(h => {
        h.style.cssText = 'font-size: 16px; font-weight: 600; line-height: 1.6; margin: 18px 0 10px; color: #333;'
        h.removeAttribute('class')
      })
      
      // 处理段落
      cloned.querySelectorAll('p').forEach(p => {
        // 如果段落已经设置了样式（如代码块占位符），则保留
        if (!p.style.cssText) {
          p.style.cssText = 'font-size: 16px; line-height: 1.8; margin: 15px 0; color: #3e3e3e; text-align: justify;'
        }
        p.removeAttribute('class')
      })
      
      // 处理引用
      cloned.querySelectorAll('blockquote').forEach(blockquote => {
        blockquote.style.cssText = 'margin: 20px 0; padding: 15px 20px; background: #f8f8f8; border-left: 4px solid #576b95; color: #666; font-size: 15px; line-height: 1.8;'
        blockquote.removeAttribute('class')
      })
      
      // 处理列表
      cloned.querySelectorAll('ul').forEach(ul => {
        ul.style.cssText = 'margin: 20px 0; padding-left: 32px; list-style-type: disc;'
        ul.removeAttribute('class')
      })
      
      cloned.querySelectorAll('ol').forEach(ol => {
        ol.style.cssText = 'margin: 20px 0; padding-left: 32px;'
        ol.removeAttribute('class')
      })
      
      cloned.querySelectorAll('li').forEach(li => {
        li.style.cssText = 'margin: 10px 0; line-height: 1.9; font-size: 16px; color: #3e3e3e;'
        li.removeAttribute('class')
      })
      
      // 处理图片
      cloned.querySelectorAll('img').forEach(img => {
        img.style.cssText = 'max-width: 100% !important; height: auto !important; border-radius: 4px; margin: 20px auto; display: block;'
        // 确保图片源是完整的URL
        if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data:')) {
          // 如果是相对路径，尝试转换为完整路径
          if (img.src.startsWith('/')) {
            img.src = window.location.origin + img.src
          }
        }
        img.removeAttribute('class')
      })
      
      // 处理链接：公众号不支持超链接，转换为文本形式 "链接文本 [链接地址]"
      cloned.querySelectorAll('a').forEach(a => {
        const linkText = (a.textContent || a.innerText || '').trim()
        const linkHref = (a.getAttribute('href') || '').trim()
        
        // 创建文本节点或span来替代链接
        const replacement = document.createElement('span')
        
        if (linkHref) {
          // 如果链接文本和链接地址相同，只显示一次
          if (linkText === linkHref) {
            replacement.textContent = linkHref
          } else if (linkText) {
            // 显示为 "链接文本 [链接地址]"
            replacement.textContent = `${linkText} [${linkHref}]`
          } else {
            // 如果没有链接文本，只显示地址
            replacement.textContent = linkHref
          }
        } else {
          // 如果没有href，只显示文本
          replacement.textContent = linkText || ''
        }
        
        replacement.style.cssText = 'color: #576b95; font-size: 16px; line-height: 1.8;'
        
        // 替换链接元素
        if (a.parentNode) {
          a.parentNode.replaceChild(replacement, a)
        }
      })
      
      // 处理表格
      cloned.querySelectorAll('table').forEach(table => {
        table.style.cssText = 'width: 100%; border-collapse: collapse; margin: 20px 0;'
        table.removeAttribute('class')
      })
      
      cloned.querySelectorAll('th, td').forEach(cell => {
        cell.style.cssText = 'border: 1px solid #ddd; padding: 8px 12px; text-align: left;'
        cell.removeAttribute('class')
      })
      
      cloned.querySelectorAll('th').forEach(th => {
        th.style.cssText += 'background: #f5f5f5; font-weight: 600;'
      })
      
      // 处理水平线
      cloned.querySelectorAll('hr').forEach(hr => {
        hr.style.cssText = 'border: none; border-top: 1px solid #e8e8e8; margin: 30px 0;'
        hr.removeAttribute('class')
      })
      
      // 处理加粗和斜体
      cloned.querySelectorAll('strong, b').forEach(strong => {
        strong.style.cssText = 'font-weight: 700;'
        strong.removeAttribute('class')
      })
      
      cloned.querySelectorAll('em, i').forEach(em => {
        em.style.cssText = 'font-style: italic;'
        em.removeAttribute('class')
      })
      
      // 统一的代码块样式（移除可能不兼容的属性）
      const codeBlockStyle = 'background-color: #f5f5f5; padding: 18px 20px; margin: 20px 0; border: 1px solid #ddd; overflow-x: auto; color: #333; font-size: 14px; font-family: Consolas, Monaco, "Courier New", Menlo, monospace; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;'
      
      // 确保代码块样式正确（公众号编辑器兼容性检查）
      // 先处理代码块中的语法高亮span标签，将class转换为内联样式
      cloned.querySelectorAll('pre code span, pre span').forEach(span => {
        const className = span.className || ''
        if (className) {
          const originalStyle = span.getAttribute('style') || ''
          let color = '#333' // 默认颜色
          
          // 根据highlight.js的类名设置颜色，使用与代码块处理相同的颜色映射
          if (className.includes('hljs-keyword') || className.includes('token-keyword')) {
            color = '#d73a49' // 红色 - 关键词
          } else if (className.includes('hljs-string') || className.includes('token-string')) {
            color = '#032f62' // 深蓝色 - 字符串
          } else if (className.includes('hljs-function') || className.includes('hljs-title') || className.includes('hljs-name') || className.includes('token-function')) {
            color = '#6f42c1' // 紫色 - 函数名
          } else if (className.includes('hljs-comment') || className.includes('token-comment')) {
            color = '#6a737d' // 灰色 - 注释
          } else if (className.includes('hljs-number') || className.includes('token-number')) {
            color = '#005cc5' // 蓝色 - 数字
          } else if (className.includes('hljs-variable') || className.includes('token-variable')) {
            color = '#e36209' // 橙色 - 变量
          } else if (className.includes('hljs-built_in') || className.includes('hljs-builtin-name') || className.includes('hljs-literal')) {
            color = '#005cc5' // 蓝色 - 内置函数
          } else if (className.includes('hljs-attr') || className.includes('token-attr-name')) {
            color = '#005cc5' // 蓝色 - 属性
          } else if (className.includes('hljs-operator') || className.includes('token-operator')) {
            color = '#d73a49' // 红色 - 操作符
          } else if (className.includes('hljs-punctuation') || className.includes('token-punctuation')) {
            color = '#333' // 黑色 - 标点符号
          }
          
          // 设置span的内联样式
          span.setAttribute('style', `color: ${color}; ${originalStyle}`)
        }
      })
      
      // 先处理 pre 标签，确保样式完整
      cloned.querySelectorAll('pre').forEach(pre => {
        pre.setAttribute('style', codeBlockStyle)
      })
      
      // 将 div 代码块转换为 pre 标签
      cloned.querySelectorAll('div').forEach(div => {
        const style = div.getAttribute('style') || ''
        // 检查是否是代码块（通过背景色判断）
        if (style.includes('background-color') && (style.includes('#f5f5f5') || style.includes('#2d2d2d'))) {
          // 获取代码内容（可能是HTML或纯文本）
          let codeContent = div.innerHTML || div.textContent || ''
          const innerDiv = div.querySelector('div')
          if (innerDiv) {
            codeContent = innerDiv.innerHTML || innerDiv.textContent || codeContent
          }
          
          // 创建 pre 标签替代 div
          const newPre = document.createElement('pre')
          newPre.setAttribute('style', codeBlockStyle)
          
          // 检查是否有HTML内容（语法高亮）
          if (codeContent.includes('<span') || codeContent.includes('<code')) {
            // 如果有HTML，创建code元素包含它
            const codeElement = document.createElement('code')
            codeElement.innerHTML = codeContent
            newPre.appendChild(codeElement)
          } else {
            // 纯文本
            newPre.textContent = codeContent
          }
          
          // 替换 div
          if (div.parentNode) {
            div.parentNode.replaceChild(newPre, div)
          }
        }
      })
      
      // 移除所有剩余的 class 和 id 属性（代码块中的span样式已经转换为内联样式）
      cloned.querySelectorAll('*').forEach(el => {
        el.removeAttribute('class')
        el.removeAttribute('id')
      })
      
      // 获取最终的 HTML 和纯文本
      const htmlContent = cloned.innerHTML
      const textContent = cloned.textContent || cloned.innerText || ''
      
      // 创建一个包装的 HTML 文档片段（公众号编辑器可能需要）
      const wrappedHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;">${htmlContent}</div>`
      
      contentToCopy = { html: wrappedHtml, text: textContent }
    }
  }
  
  // 处理公众号格式的特殊情况（contentToCopy 是对象）
  let success = false
  if (format === 'wechat' && typeof contentToCopy === 'object' && contentToCopy.html) {
    // 公众号格式：使用富文本复制
    success = await copyToClipboard(contentToCopy.text, contentToCopy.html)
  } else {
    // 其他格式：纯文本复制
    success = await copyToClipboard(contentToCopy)
  }
  
  if (success) {
    emit('copy', format)
    isOpen.value = false
    
    // 显示成功提示
    const formatNames = {
      'wechat': '公众号',
      'html': 'HTML',
      'markdown': 'Markdown',
      'notion': 'Notion笔记'
    }
    showToast(`已复制${formatNames[format]}格式`)
  } else {
    showToast('复制失败，请手动复制', 'error')
  }
}

// 转换为Notion兼容格式
const convertToNotionFormat = (markdown) => {
  let content = markdown
  
  // Notion对Markdown的支持很好，但需要做一些优化：
  // 1. 处理Mermaid图表（Notion不支持，转换为文本说明）
  // 2. 确保代码块格式正确
  // 3. 优化数学公式格式（Notion支持LaTeX）
  
  // 处理Mermaid图表，转换为Notion可读的文本说明
  content = content.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, diagram) => {
    const cleanDiagram = diagram.trim()
    return `> **📊 图表说明**\n> \n> 以下为Mermaid图表代码，Notion不支持直接渲染Mermaid图表，请手动在Notion中重新创建图表。\n> \n> **图表代码：**\n> \n> \`\`\`\n> ${cleanDiagram}\n> \`\`\``
  })
  
  // 处理没有语言标识的代码块（Notion支持，但建议保留原样）
  // Notion会自动识别代码块，无需强制添加语言标识
  
  // 确保代码块前后有空行（提高Notion导入的稳定性）
  content = content.replace(/([^\n])\n```/g, '$1\n\n```')
  content = content.replace(/```([^\n]*)\n([^\n])/g, '```$1\n\n$2')
  
  // 优化标题格式，确保标题前后有空行
  content = content.replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, '$1\n\n$2')
  content = content.replace(/(#{1,6}\s+[^\n]+)\n([^\n])/g, '$1\n\n$2')
  
  // Notion对Markdown的支持很好，其他格式保持原样即可
  // - 列表：完全支持
  // - 表格：完全支持
  // - 数学公式：支持LaTeX格式（$...$ 和 $$...$$）
  // - 引用：完全支持
  // - 链接和图片：完全支持
  
  return content.trim()
}

const showToast = (message, type = 'success') => {
  // 创建提示元素
  const toast = document.createElement('div')
  toast.className = `copy-toast ${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 24px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#52c41a' : '#ff4d4f'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-size: 14px;
    animation: slideInRight 0.3s ease-out;
  `
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 2000)
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
  
  // 添加动画样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.copy-button {
  position: relative;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e8e5df;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #2c2c2c;
  transition: all 0.2s;
}

body[data-theme-type="dark"] .copy-btn {
  background: #3e3e42;
  border-color: #555;
  color: #d4d4d4;
}

.copy-btn:hover {
  background: #faf9f6;
  border-color: #d4c5b0;
}

body[data-theme-type="dark"] .copy-btn:hover {
  background: #4e4e52;
  border-color: #666;
}

.copy-btn.active {
  background: #e6f7ff;
  border-color: #91d5ff;
}

body[data-theme-type="dark"] .copy-btn.active {
  background: #1e3a5f;
  border-color: #4a9eff;
}

.dropdown-arrow {
  font-size: 10px;
  color: #666;
  transition: transform 0.2s;
}

body[data-theme-type="dark"] .dropdown-arrow {
  color: #858585;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.copy-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: #fff;
  border: 1px solid #f0ede5;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  overflow: hidden;
}

body[data-theme-type="dark"] .copy-dropdown {
  background: #252526;
  border-color: #3e3e42;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.copy-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f5f3f0;
}

body[data-theme-type="dark"] .copy-option {
  border-bottom-color: #3e3e42;
}

.copy-option:last-child {
  border-bottom: none;
}

.copy-option:hover {
  background: #faf9f6;
}

body[data-theme-type="dark"] .copy-option:hover {
  background: #2d2d30;
}

.option-icon {
  font-size: 16px;
}

.option-text {
  font-size: 14px;
  color: #2c2c2c;
}

body[data-theme-type="dark"] .option-text {
  color: #d4d4d4;
}
</style>

