<template>
  <div class="save-button">
    <button class="save-btn" @click="toggleDropdown" :class="{ active: isOpen }">
      <span>💾 保存</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </button>
    <div class="save-dropdown" v-if="isOpen" @click.stop>
      <div class="save-option" @click="saveToLocal">
        <span class="option-icon">💾</span>
        <span class="option-text">保存到本地</span>
      </div>
      <div class="save-option" @click="saveAsPDF">
        <span class="option-icon">📄</span>
        <span class="option-text">另存为PDF</span>
      </div>
      <div class="save-option" @click="saveAsImage">
        <span class="option-icon">🖼️</span>
        <span class="option-text">导出为长图</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

const emit = defineEmits(['save'])

const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e) => {
  if (!e.target.closest('.save-button')) {
    isOpen.value = false
  }
}

// 保存到本地存储
const saveToLocal = () => {
  emit('save')
  isOpen.value = false
  showToast('已保存到本地', 'success')
}

// 另存为PDF
const saveAsPDF = async () => {
  try {
    isOpen.value = false
    showToast('正在生成PDF，请稍候...', 'success')
    
    // 等待DOM更新和内容渲染
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const previewContent = document.querySelector('.preview-content')
    if (!previewContent) {
      showToast('无法获取预览内容', 'error')
      return
    }
    
    // 检查内容是否为空
    if (!previewContent.innerHTML || previewContent.innerHTML.trim() === '') {
      showToast('预览内容为空，请先输入内容', 'error')
      return
    }
    
    // 创建一个临时容器用于PDF生成（隐藏但可访问）
    const tempContainer = document.createElement('div')
    tempContainer.id = 'pdf-temp-container'
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 800px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      box-sizing: border-box;
      visibility: visible;
      opacity: 1;
      padding: 40px;
    `
    
    // 克隆预览内容（深度克隆，包括所有子元素）
    const cloned = previewContent.cloneNode(true)
    
    // 保留preview-content类以确保样式应用
    cloned.className = 'preview-content ' + (cloned.className.replace(/theme-\w+/g, '').trim())
    
    // 设置克隆内容的基础样式，确保内容可见
    cloned.style.cssText = `
      width: 100%;
      max-width: 100%;
      color: #333 !important;
      line-height: 1.6;
      background: white;
      font-size: 14px;
      padding: 0;
      margin: 0;
      visibility: visible;
      opacity: 1;
    `
    
    // 确保所有子元素都有颜色
    const allElements = cloned.querySelectorAll('*')
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el)
      if (computedStyle.color === 'rgb(0, 0, 0)' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
        el.style.color = '#333'
      }
      // 确保元素可见
      el.style.visibility = 'visible'
      el.style.opacity = '1'
    })
    
    // 处理代码块复制按钮等不需要的元素
    const codeCopyBtns = cloned.querySelectorAll('.code-copy-btn, .code-block-header')
    codeCopyBtns.forEach(btn => btn.remove())
    
    // 处理Mermaid图表 - html2canvas对SVG支持较好，尝试保留SVG
    const mermaidContainers = cloned.querySelectorAll('.mermaid-container')
    mermaidContainers.forEach(container => {
      const svg = container.querySelector('svg')
      if (svg) {
        // 尝试保留SVG，但确保样式正确
        svg.style.maxWidth = '100%'
        svg.style.height = 'auto'
        svg.style.visibility = 'visible'
        svg.style.opacity = '1'
        // 如果SVG没有viewBox，尝试设置
        if (!svg.getAttribute('viewBox') && svg.getAttribute('width') && svg.getAttribute('height')) {
          svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`)
          svg.removeAttribute('width')
          svg.removeAttribute('height')
          svg.style.width = '100%'
        }
      } else {
        // 如果没有SVG，替换为文本说明
        const text = container.textContent || '图表内容'
        container.innerHTML = `<div style="padding: 20px; background: #f5f5f5; border-radius: 4px; text-align: center; color: #666; margin: 20px 0;">📊 图表：${text}</div>`
      }
    })
    
    // 确保所有图片加载完成
    const images = cloned.querySelectorAll('img')
    const imagePromises = Array.from(images).map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = resolve // 即使加载失败也继续
        setTimeout(resolve, 5000) // 超时保护，增加到5秒
      })
    })
    await Promise.all(imagePromises)
    
    tempContainer.appendChild(cloned)
    document.body.appendChild(tempContainer)
    
    // 强制重新计算样式
    void tempContainer.offsetHeight
    
    // 等待DOM渲染完成后再处理代码高亮样式
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200)
        })
      })
    })
    
    // 确保代码高亮样式被正确应用（在DOM中添加后再处理）
    // 确保代码块容器的样式
    const codeWrappers = tempContainer.querySelectorAll('.code-block-wrapper')
    const originalWrappers = previewContent.querySelectorAll('.code-block-wrapper')
    codeWrappers.forEach((wrapper, index) => {
      if (originalWrappers[index]) {
        const computedStyle = window.getComputedStyle(originalWrappers[index])
        wrapper.style.backgroundColor = computedStyle.backgroundColor || '#282c34'
        wrapper.style.borderRadius = computedStyle.borderRadius || '12px'
        wrapper.style.overflow = 'hidden'
      }
    })
    
    // 确保pre元素的样式
    const preElements = tempContainer.querySelectorAll('.code-block-wrapper pre')
    const originalPreElements = previewContent.querySelectorAll('.code-block-wrapper pre')
    preElements.forEach((pre, index) => {
      if (originalPreElements[index]) {
        const computedStyle = window.getComputedStyle(originalPreElements[index])
        pre.style.backgroundColor = computedStyle.backgroundColor || '#282c34'
        pre.style.padding = computedStyle.padding || '24px'
        pre.style.margin = '0'
      }
    })
    
    // 确保code元素的样式
    const codeElements = tempContainer.querySelectorAll('.code-block-wrapper pre code')
    const originalCodeElements = previewContent.querySelectorAll('.code-block-wrapper pre code')
    codeElements.forEach((code, index) => {
      if (originalCodeElements[index]) {
        const computedStyle = window.getComputedStyle(originalCodeElements[index])
        code.style.color = computedStyle.color || '#abb2bf'
        code.style.fontFamily = computedStyle.fontFamily || "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace"
        code.style.fontSize = computedStyle.fontSize || '14px'
        code.style.backgroundColor = 'transparent'
      }
    })
    
    // 获取所有代码块中的高亮元素并内联样式
    codeElements.forEach((codeEl, codeIndex) => {
      if (originalCodeElements[codeIndex]) {
        const originalCode = originalCodeElements[codeIndex]
        
        // 获取所有span元素（包括高亮标记）
        const spans = codeEl.querySelectorAll('span')
        const originalSpans = originalCode.querySelectorAll('span')
        
        // 如果数量匹配，逐个复制样式
        if (spans.length === originalSpans.length && spans.length > 0) {
          spans.forEach((span, spanIndex) => {
            const originalSpan = originalSpans[spanIndex]
            if (originalSpan) {
              const computedStyle = window.getComputedStyle(originalSpan)
              
              // 内联颜色样式（强制应用）
              const color = computedStyle.color
              if (color) {
                span.style.color = color
                span.style.setProperty('color', color, 'important')
              }
              
              // 内联字体粗细
              const fontWeight = computedStyle.fontWeight
              if (fontWeight && fontWeight !== 'normal' && fontWeight !== '400') {
                span.style.fontWeight = fontWeight
                span.style.setProperty('font-weight', fontWeight, 'important')
              }
              
              // 内联字体样式
              const fontStyle = computedStyle.fontStyle
              if (fontStyle && fontStyle !== 'normal') {
                span.style.fontStyle = fontStyle
                span.style.setProperty('font-style', fontStyle, 'important')
              }
              
              // 确保背景透明
              span.style.backgroundColor = 'transparent'
            }
          })
        }
      }
    })
    
    // 再次等待样式应用完成
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 300)
        })
      })
    })
    
    // 验证内容是否存在
    if (!tempContainer.innerHTML || tempContainer.innerHTML.trim() === '') {
      document.body.removeChild(tempContainer)
      showToast('PDF内容为空，请检查预览内容', 'error')
      return
    }
    
    // 使用html2canvas将内容转换为canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      letterRendering: true,
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      windowWidth: tempContainer.scrollWidth,
      windowHeight: tempContainer.scrollHeight
    })
    
    // 检查canvas是否有内容
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      document.body.removeChild(tempContainer)
      showToast('PDF内容渲染失败，请重试', 'error')
      return
    }
    
    // 计算PDF尺寸（A4比例）
    const imgWidth = 210 // A4宽度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // 创建PDF（使用A4格式）
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // 如果内容超过一页，需要分页
    const pageHeight = 297 // A4高度（mm）
    const pageWidth = 210 // A4宽度（mm）
    let heightLeft = imgHeight
    let position = 0
    
    // 添加第一页
    pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    // 如果内容超过一页，添加更多页
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // 保存PDF
    pdf.save(`markdown-cat-${new Date().getTime()}.pdf`)
    
    // 清理临时元素
    setTimeout(() => {
      const container = document.getElementById('pdf-temp-container')
      if (container && document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }, 1000)
    
    showToast('PDF已保存', 'success')
  } catch (error) {
    console.error('PDF生成失败:', error)
    showToast('PDF生成失败：' + (error.message || '未知错误'), 'error')
    
    // 确保清理临时元素
    const container = document.getElementById('pdf-temp-container')
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

// 导出为长图
const saveAsImage = async () => {
  try {
    isOpen.value = false
    showToast('正在生成长图，请稍候...', 'success')
    
    // 等待DOM更新和内容渲染
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const previewContent = document.querySelector('.preview-content')
    if (!previewContent) {
      showToast('无法获取预览内容', 'error')
      return
    }
    
    // 检查内容是否为空
    if (!previewContent.innerHTML || previewContent.innerHTML.trim() === '') {
      showToast('预览内容为空，请先输入内容', 'error')
      return
    }
    
    // 创建一个临时容器用于图片生成
    const tempContainer = document.createElement('div')
    tempContainer.id = 'image-temp-container'
    tempContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 800px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      box-sizing: border-box;
      z-index: -1;
      padding: 40px;
    `
    
    // 克隆预览内容（深度克隆，包括所有子元素）
    const cloned = previewContent.cloneNode(true)
    
    // 保留preview-content类以确保样式应用
    cloned.className = 'preview-content ' + (cloned.className.replace(/theme-\w+/g, '').trim())
    
    // 设置克隆内容的基础样式，确保内容可见
    cloned.style.cssText = `
      width: 100%;
      max-width: 100%;
      color: #333 !important;
      line-height: 1.6;
      background: white;
      font-size: 14px;
      padding: 0;
      margin: 0;
    `
    
    // 确保所有子元素都有颜色
    const allElements = cloned.querySelectorAll('*')
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el)
      if (computedStyle.color === 'rgb(0, 0, 0)' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
        el.style.color = '#333'
      }
    })
    
    // 处理代码块复制按钮等不需要的元素
    const codeCopyBtns = cloned.querySelectorAll('.code-copy-btn, .code-block-header')
    codeCopyBtns.forEach(btn => btn.remove())
    
    // 处理Mermaid图表 - 如果存在，保留SVG（html2canvas可以渲染SVG）
    // 如果Mermaid图表渲染失败，可以尝试替换为文本说明
    const mermaidContainers = cloned.querySelectorAll('.mermaid-container')
    mermaidContainers.forEach(container => {
      // 尝试保留SVG，如果SVG不存在则替换为文本
      const svg = container.querySelector('svg')
      if (!svg) {
        const text = container.textContent || '图表内容'
        container.innerHTML = `<div style="padding: 20px; background: #f5f5f5; border-radius: 4px; text-align: center; color: #666; margin: 20px 0;">📊 图表：${text}</div>`
      }
    })
    
    // 确保所有图片加载完成
    const images = cloned.querySelectorAll('img')
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = resolve // 即使加载失败也继续
        setTimeout(resolve, 5000) // 超时保护，增加到5秒
      })
    })
    await Promise.all(imagePromises)
    
    tempContainer.appendChild(cloned)
    document.body.appendChild(tempContainer)
    
    // 等待DOM渲染完成后再处理代码高亮样式
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200)
        })
      })
    })
    
    // 确保代码高亮样式被正确应用（在DOM中添加后再处理）
    // 确保代码块容器的样式
    const codeWrappers = tempContainer.querySelectorAll('.code-block-wrapper')
    const originalWrappers = previewContent.querySelectorAll('.code-block-wrapper')
    codeWrappers.forEach((wrapper, index) => {
      if (originalWrappers[index]) {
        const computedStyle = window.getComputedStyle(originalWrappers[index])
        wrapper.style.backgroundColor = computedStyle.backgroundColor || '#282c34'
        wrapper.style.borderRadius = computedStyle.borderRadius || '12px'
        wrapper.style.overflow = 'hidden'
      }
    })
    
    // 确保pre元素的样式
    const preElements = tempContainer.querySelectorAll('.code-block-wrapper pre')
    const originalPreElements = previewContent.querySelectorAll('.code-block-wrapper pre')
    preElements.forEach((pre, index) => {
      if (originalPreElements[index]) {
        const computedStyle = window.getComputedStyle(originalPreElements[index])
        pre.style.backgroundColor = computedStyle.backgroundColor || '#282c34'
        pre.style.padding = computedStyle.padding || '24px'
        pre.style.margin = '0'
      }
    })
    
    // 确保code元素的样式
    const codeElements = tempContainer.querySelectorAll('.code-block-wrapper pre code')
    const originalCodeElements = previewContent.querySelectorAll('.code-block-wrapper pre code')
    codeElements.forEach((code, index) => {
      if (originalCodeElements[index]) {
        const computedStyle = window.getComputedStyle(originalCodeElements[index])
        code.style.color = computedStyle.color || '#abb2bf'
        code.style.fontFamily = computedStyle.fontFamily || "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace"
        code.style.fontSize = computedStyle.fontSize || '14px'
        code.style.backgroundColor = 'transparent'
      }
    })
    
    // 获取所有代码块中的高亮元素并内联样式
    codeElements.forEach((codeEl, codeIndex) => {
      if (originalCodeElements[codeIndex]) {
        const originalCode = originalCodeElements[codeIndex]
        
        // 获取所有span元素（包括高亮标记）
        const spans = codeEl.querySelectorAll('span')
        const originalSpans = originalCode.querySelectorAll('span')
        
        // 如果数量匹配，逐个复制样式
        if (spans.length === originalSpans.length && spans.length > 0) {
          spans.forEach((span, spanIndex) => {
            const originalSpan = originalSpans[spanIndex]
            if (originalSpan) {
              const computedStyle = window.getComputedStyle(originalSpan)
              
              // 内联颜色样式（强制应用）
              const color = computedStyle.color
              if (color) {
                span.style.color = color
                span.style.setProperty('color', color, 'important')
              }
              
              // 内联字体粗细
              const fontWeight = computedStyle.fontWeight
              if (fontWeight && fontWeight !== 'normal' && fontWeight !== '400') {
                span.style.fontWeight = fontWeight
                span.style.setProperty('font-weight', fontWeight, 'important')
              }
              
              // 内联字体样式
              const fontStyle = computedStyle.fontStyle
              if (fontStyle && fontStyle !== 'normal') {
                span.style.fontStyle = fontStyle
                span.style.setProperty('font-style', fontStyle, 'important')
              }
              
              // 确保背景透明
              span.style.backgroundColor = 'transparent'
            }
          })
        }
      }
    })
    
    // 再次等待样式应用完成
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 300)
        })
      })
    })
    
    // 验证内容是否存在
    if (!tempContainer.innerHTML || tempContainer.innerHTML.trim() === '') {
      document.body.removeChild(tempContainer)
      showToast('图片内容为空，请检查预览内容', 'error')
      return
    }
    
    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // 提高清晰度
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      windowWidth: tempContainer.scrollWidth,
      windowHeight: tempContainer.scrollHeight
    })
    
    // 将canvas转换为blob并下载
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('图片生成失败', 'error')
        document.body.removeChild(tempContainer)
        return
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `markdown-cat-${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // 清理临时元素
      setTimeout(() => {
        const container = document.getElementById('image-temp-container')
        if (container && document.body.contains(container)) {
          document.body.removeChild(container)
        }
      }, 1000)
      
      showToast('长图已保存', 'success')
    }, 'image/png', 0.95)
    
  } catch (error) {
    console.error('图片生成失败:', error)
    showToast('图片生成失败：' + (error.message || '未知错误'), 'error')
    
    // 确保清理临时元素
    const container = document.getElementById('image-temp-container')
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

const showToast = (message, type = 'success') => {
  // 创建提示元素
  const toast = document.createElement('div')
  toast.className = `save-toast ${type}`
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
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
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
.save-button {
  position: relative;
}

.save-btn {
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

body[data-theme-type="dark"] .save-btn {
  background: #3e3e42;
  border-color: #555;
  color: #d4d4d4;
}

.save-btn:hover {
  background: #faf9f6;
  border-color: #d4c5b0;
}

body[data-theme-type="dark"] .save-btn:hover {
  background: #4e4e52;
  border-color: #666;
}

.save-btn.active {
  background: #e6f7ff;
  border-color: #91d5ff;
}

body[data-theme-type="dark"] .save-btn.active {
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

.save-dropdown {
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

body[data-theme-type="dark"] .save-dropdown {
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

.save-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f5f3f0;
}

body[data-theme-type="dark"] .save-option {
  border-bottom-color: #3e3e42;
}

.save-option:last-child {
  border-bottom: none;
}

.save-option:hover {
  background: #faf9f6;
}

body[data-theme-type="dark"] .save-option:hover {
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

