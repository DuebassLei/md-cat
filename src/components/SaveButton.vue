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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import html2pdf from 'html2pdf.js'

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
    
    // 创建一个临时容器用于PDF生成
    const tempContainer = document.createElement('div')
    tempContainer.id = 'pdf-temp-container'
    tempContainer.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 210mm;
      min-height: 297mm;
      max-width: 90vw;
      max-height: 90vh;
      padding: 20mm;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      box-sizing: border-box;
      z-index: 99999;
      overflow: auto;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
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
    
    // 处理Mermaid图表 - 如果存在，替换为文本说明
    const mermaidContainers = cloned.querySelectorAll('.mermaid-container')
    mermaidContainers.forEach(container => {
      const text = container.textContent || '图表内容'
      container.innerHTML = `<div style="padding: 20px; background: #f5f5f5; border-radius: 4px; text-align: center; color: #666; margin: 20px 0;">📊 图表：${text}</div>`
    })
    
    // 确保所有图片加载完成
    const images = cloned.querySelectorAll('img')
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = resolve // 即使加载失败也继续
        setTimeout(resolve, 3000) // 超时保护
      })
    })
    await Promise.all(imagePromises)
    
    tempContainer.appendChild(cloned)
    document.body.appendChild(tempContainer)
    
    // 等待渲染完成
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200)
        })
      })
    })
    
    // 验证内容是否存在
    if (!tempContainer.innerHTML || tempContainer.innerHTML.trim() === '') {
      document.body.removeChild(tempContainer)
      showToast('PDF内容为空，请检查预览内容', 'error')
      return
    }
    
    // 配置PDF选项
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `markdown-cat-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        letterRendering: true,
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }
    
    // 生成PDF
    await html2pdf().set(opt).from(tempContainer).save()
    
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

