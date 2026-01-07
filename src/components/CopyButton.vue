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

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e) => {
  if (!e.target.closest('.copy-button')) {
    isOpen.value = false
  }
}

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案
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
      
      // 清理和优化 HTML，使其适合公众号编辑器
      let html = cloned.innerHTML
      
      // 移除 Mermaid 容器中的 SVG（公众号不支持）
      html = html.replace(/<div class="mermaid-container[^"]*">[\s\S]*?<\/div>/g, '[图表内容，请在公众号编辑器中重新插入]')
      
      // 优化样式内联（公众号编辑器支持内联样式）
      html = html.replace(/<h1([^>]*)>/g, '<h1$1 style="font-size: 22px; font-weight: 700; line-height: 1.6; margin: 30px 0 20px; color: #1a1a1a; text-align: center;">')
      html = html.replace(/<h2([^>]*)>/g, '<h2$1 style="font-size: 20px; font-weight: 700; line-height: 1.6; margin: 25px 0 15px; color: #1a1a1a; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;">')
      html = html.replace(/<h3([^>]*)>/g, '<h3$1 style="font-size: 18px; font-weight: 600; line-height: 1.6; margin: 20px 0 12px; color: #333;">')
      html = html.replace(/<p([^>]*)>/g, '<p$1 style="font-size: 16px; line-height: 1.8; margin: 15px 0; color: #3e3e3e; text-align: justify;">')
      html = html.replace(/<blockquote([^>]*)>/g, '<blockquote$1 style="margin: 20px 0; padding: 15px 20px; background: #f8f8f8; border-left: 4px solid #576b95; color: #666; font-size: 15px; line-height: 1.8;">')
      html = html.replace(/<code([^>]*)>/g, '<code$1 style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 14px; color: #e83e8c; font-family: Consolas, Monaco, monospace;">')
      html = html.replace(/<pre([^>]*)>/g, '<pre$1 style="background: #282c34; padding: 20px; border-radius: 6px; overflow-x: auto; margin: 20px 0; line-height: 1.6;">')
      html = html.replace(/<img([^>]*)>/g, '<img$1 style="max-width: 100%; height: auto; border-radius: 4px; margin: 20px 0; display: block;">')
      
      contentToCopy = html
    }
  }
  
  const success = await copyToClipboard(contentToCopy)
  
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

