<template>
  <div class="theme-selector">
    <div class="theme-selector-trigger" @click="toggleDropdown">
      <span class="theme-icon">{{ currentThemeIcon }}</span>
      <span class="theme-label">{{ currentThemeLabel }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </div>
    <div class="theme-dropdown" v-if="isOpen" @click.stop>
      <div class="theme-categories">
        <div class="category" v-for="category in categories" :key="category.type">
          <div class="category-title">{{ category.title }}</div>
          <div class="theme-list">
            <div
              v-for="theme in category.themes"
              :key="theme.value"
              class="theme-item"
              :class="{ active: currentTheme === theme.value }"
              @click="selectTheme(theme.value)"
            >
              <span class="theme-item-icon">{{ theme.icon }}</span>
              <div class="theme-item-info">
                <div class="theme-item-label">{{ theme.label }}</div>
                <div class="theme-item-desc">{{ theme.description }}</div>
              </div>
              <span class="theme-check" v-if="currentTheme === theme.value">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getThemeList, getTheme } from '../themes/index.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'wechat'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const themes = getThemeList()

const currentTheme = computed(() => props.modelValue)
const currentThemeData = computed(() => getTheme(currentTheme.value))
const currentThemeIcon = computed(() => currentThemeData.value?.icon || '📱')
const currentThemeLabel = computed(() => currentThemeData.value?.label || '微信公众号')

const categories = computed(() => {
  const light = themes.filter(t => t.type === 'light')
  const dark = themes.filter(t => t.type === 'dark')
  
  return [
    { type: 'light', title: '亮色主题', themes: light },
    { type: 'dark', title: '暗色主题', themes: dark }
  ]
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectTheme = (value) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const closeDropdown = (e) => {
  if (!e.target.closest('.theme-selector')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e8e5df;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

body[data-theme-type="dark"] .theme-selector-trigger {
  background: #3e3e42;
  border-color: #555;
  color: #d4d4d4;
}

.theme-selector-trigger:hover {
  border-color: #d4c5b0;
  background: #faf9f6;
}

body[data-theme-type="dark"] .theme-selector-trigger:hover {
  background: #4e4e52;
  border-color: #666;
}

.theme-icon {
  font-size: 16px;
}

.theme-label {
  flex: 1;
  font-size: 14px;
  color: #2c2c2c;
}

.dropdown-arrow {
  font-size: 10px;
  color: #666;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.theme-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 500px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #f0ede5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body[data-theme-type="dark"] .theme-dropdown {
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

.theme-categories {
  padding: 8px;
}

.category {
  margin-bottom: 12px;
}

.category:last-child {
  margin-bottom: 0;
}

.category-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.theme-item:hover {
  background: #faf9f6;
}

body[data-theme-type="dark"] .theme-item:hover {
  background: #2d2d30;
}

.theme-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

body[data-theme-type="dark"] .theme-item.active {
  background: #1e3a5f;
  border-color: #4a9eff;
}

.theme-item-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.theme-item-info {
  flex: 1;
  min-width: 0;
}

.theme-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2c;
  margin-bottom: 2px;
}

.theme-item-desc {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-check {
  color: #1890ff;
  font-weight: bold;
  font-size: 16px;
}

/* 滚动条样式 */
.theme-dropdown::-webkit-scrollbar {
  width: 6px;
}

.theme-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.theme-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.theme-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

