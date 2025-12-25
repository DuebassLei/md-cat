<template>
  <div class="editor-container">
    <div class="editor-header">
      <span>Markdown 源码</span>
    </div>
    <Toolbar @insert="handleInsert" />
    <textarea
      ref="textareaRef"
      v-model="localContent"
      @input="handleInput"
      @keydown="handleKeydown"
      class="editor-textarea"
      placeholder="在这里输入 Markdown 内容..."
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Toolbar from './Toolbar.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const localContent = ref(props.modelValue)
const textareaRef = ref(null)

watch(() => props.modelValue, (newVal) => {
  localContent.value = newVal
})

const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
}

const handleInsert = ({ before, after, placeholder, newLine }) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end) || placeholder
  const beforeText = localContent.value.substring(0, start)
  const afterText = localContent.value.substring(end)
  
  let insertText = before + selectedText + after
  if (newLine && !beforeText.endsWith('\n') && beforeText) {
    insertText = '\n' + insertText
  }
  if (newLine && !afterText.startsWith('\n') && afterText) {
    insertText = insertText + '\n'
  }

  const newContent = beforeText + insertText + afterText
  localContent.value = newContent
  emit('update:modelValue', newContent)

  // 设置光标位置
  setTimeout(() => {
    const newPos = start + before.length + (selectedText === placeholder ? 0 : selectedText.length)
    textarea.focus()
    textarea.setSelectionRange(newPos, newPos)
  }, 0)
}

const handleKeydown = (e) => {
  // Ctrl+B: 粗体
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    handleInsert({ before: '**', after: '**', placeholder: '粗体文本' })
  }
  // Ctrl+I: 斜体
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault()
    handleInsert({ before: '*', after: '*', placeholder: '斜体文本' })
  }
  // Ctrl+K: 链接
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault()
    handleInsert({ before: '[', after: '](https://)', placeholder: '链接文本' })
  }
  // Ctrl+S: 保存（由父组件处理）
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    emit('save')
  }
  // Ctrl+Enter: 快速复制（由父组件处理）
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    emit('quickCopy')
  }
}

const handleGlobalKeydown = (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    emit('save')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fefaf3;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

body[data-theme-type="dark"] .editor-container {
  background: #1e1e1e;
}

.editor-header {
  padding: 12px 16px;
  background: #faf5eb;
  border-bottom: 2px solid #f0e8d8;
  font-size: 14px;
  font-weight: 600;
  color: #5c4a3a;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

body[data-theme-type="dark"] .editor-header {
  background: #252526;
  border-bottom-color: #3e3e42;
  color: #858585;
}

.editor-textarea {
  flex: 1;
  padding: 20px;
  border: none;
  outline: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  color: #3d3528;
  background: #fffef9;
  transition: background-color 0.3s ease, color 0.3s ease;
}

body[data-theme-type="dark"] .editor-textarea {
  color: #d4d4d4;
  background: #1e1e1e;
}

body[data-theme-type="dark"] .editor-textarea::placeholder {
  color: #858585;
}
</style>

