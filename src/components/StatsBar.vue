<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-label">字数</span>
      <span class="stat-value">{{ wordCount }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">行数</span>
      <span class="stat-value">{{ lineCount }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">阅读时间</span>
      <span class="stat-value">{{ readingTime }} 分钟</span>
    </div>
    <div class="stat-item" v-if="lastSaved">
      <span class="stat-label">最后保存</span>
      <span class="stat-value">{{ lastSaved }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  lastSaved: {
    type: String,
    default: ''
  }
})

const wordCount = computed(() => {
  if (!props.content) return 0
  // 中文字符和英文单词都计算
  const chineseChars = props.content.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const englishWords = props.content.match(/[a-zA-Z]+/g)?.length || 0
  return chineseChars + englishWords
})

const lineCount = computed(() => {
  if (!props.content) return 0
  return props.content.split('\n').length
})

const readingTime = computed(() => {
  // 按每分钟 300 字计算
  const words = wordCount.value
  const minutes = Math.ceil(words / 300)
  return minutes || 1
})
</script>

<style scoped>
.stats-bar {
  display: flex;
  gap: 20px;
  padding: 8px 16px;
  background: #faf5eb;
  border-top: 2px solid #f0e8d8;
  font-size: 12px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body[data-theme-type="dark"] .stats-bar {
  background: #252526;
  border-top-color: #3e3e42;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  color: #666;
  transition: color 0.3s ease;
}

body[data-theme-type="dark"] .stat-label {
  color: #858585;
}

.stat-value {
  color: #2c2c2c;
  font-weight: 600;
  transition: color 0.3s ease;
}

body[data-theme-type="dark"] .stat-value {
  color: #d4d4d4;
}
</style>

