<template>
  <div class="theme-selector">
    <div class="theme-selector-trigger" @click="toggleDropdown">
      <span class="theme-icon">{{ currentThemeIcon }}</span>
      <span class="theme-label">{{ currentThemeLabel }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </div>
    <div class="theme-dropdown" v-if="isOpen" @click.stop>
      <!-- 搜索框 -->
      <div class="theme-search">
        <input
          ref="searchInputRef"
          type="text"
          v-model="searchQuery"
          placeholder="搜索主题..."
          class="search-input"
          @input="handleSearch"
          @keydown.esc="clearSearch"
        />
        <span class="search-icon">🔍</span>
        <span v-if="searchQuery" class="clear-search" @click="clearSearch">×</span>
      </div>
      
      <!-- 主题列表 -->
      <div class="theme-categories" ref="categoriesRef">
        <template v-if="filteredCategories.length > 0">
          <div class="category" v-for="category in filteredCategories" :key="category.type">
            <div class="category-title">{{ category.title }}</div>
            <div class="theme-list">
              <div
                v-for="theme in category.themes"
                :key="theme.value"
                :ref="el => { 
                  if (el && currentTheme === theme.value) {
                    activeThemeRef = el
                  }
                }"
                class="theme-item"
                :class="{ active: currentTheme === theme.value }"
                @click="selectTheme(theme.value)"
              >
                <span class="theme-item-icon">{{ theme.icon }}</span>
                <div class="theme-item-info">
                  <div class="theme-item-label">
                    <span v-html="highlightText(theme.label, searchQuery)"></span>
                  </div>
                  <div class="theme-item-desc">
                    <span v-html="highlightText(theme.description, searchQuery)"></span>
                  </div>
                </div>
                <span class="theme-check" v-if="currentTheme === theme.value">✓</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">未找到匹配的主题</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getThemeList, getTheme } from '../themes/index.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'wechat'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const categoriesRef = ref(null)
const activeThemeRef = ref(null)
const themes = getThemeList()

const currentTheme = computed(() => props.modelValue)

// 使用ref来存储主题数据，确保能及时更新
const currentThemeDataRef = ref(getTheme(props.modelValue))

const currentThemeData = computed(() => {
  // 每次访问时都重新获取，确保数据最新
  const theme = getTheme(props.modelValue)
  currentThemeDataRef.value = theme || getTheme('wechat')
  return currentThemeDataRef.value
})

const currentThemeIcon = computed(() => {
  const data = currentThemeData.value
  return data?.icon || '📱'
})

const currentThemeLabel = computed(() => {
  const data = currentThemeData.value
  return data?.label || '微信公众号'
})

// 监听modelValue变化，及时更新主题数据
watch(() => props.modelValue, (newValue) => {
  const theme = getTheme(newValue)
  currentThemeDataRef.value = theme || getTheme('wechat')
}, { immediate: true })

const categories = computed(() => {
  const light = themes.filter(t => t.type === 'light')
  const dark = themes.filter(t => t.type === 'dark')
  
  return [
    { type: 'light', title: '亮色主题', themes: light },
    { type: 'dark', title: '暗色主题', themes: dark }
  ]
})

// 模糊搜索过滤
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  const filtered = categories.value.map(category => {
    const filteredThemes = category.themes.filter(theme => {
      const label = theme.label.toLowerCase()
      const desc = theme.description.toLowerCase()
      const value = theme.value.toLowerCase()
      return label.includes(query) || desc.includes(query) || value.includes(query)
    })
    return { ...category, themes: filteredThemes }
  }).filter(category => category.themes.length > 0)
  
  return filtered
})

// 高亮搜索关键词
const highlightText = (text, query) => {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 处理搜索
const handleSearch = () => {
  // 搜索时不需要额外处理，computed 会自动更新
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

// 滚动到当前选中的主题
const scrollToActiveTheme = async () => {
  await nextTick()
  
  // 如果activeThemeRef不存在，尝试通过选择器查找
  if (!activeThemeRef.value && categoriesRef.value) {
    const activeItem = categoriesRef.value.querySelector('.theme-item.active')
    if (activeItem) {
      activeThemeRef.value = activeItem
    }
  }
  
  if (activeThemeRef.value && categoriesRef.value) {
    // 等待 DOM 更新完成
    await nextTick()
    
    // 获取容器和元素的相对位置
    const containerScrollTop = categoriesRef.value.scrollTop
    const containerHeight = categoriesRef.value.clientHeight
    const itemOffsetTop = activeThemeRef.value.offsetTop
    const itemHeight = activeThemeRef.value.offsetHeight
    
    // 计算元素相对于滚动容器的位置
    const itemTop = itemOffsetTop
    const itemBottom = itemTop + itemHeight
    const visibleTop = containerScrollTop
    const visibleBottom = containerScrollTop + containerHeight
    
    // 如果当前项不在可视区域内，滚动到它
    if (itemTop < visibleTop || itemBottom > visibleBottom) {
      // 滚动到元素中心位置
      const targetScroll = itemTop - containerHeight / 2 + itemHeight / 2
      categoriesRef.value.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      })
    }
  }
}

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  
  if (isOpen.value) {
    // 打开时聚焦搜索框并滚动到当前主题
    await nextTick()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
    }
    scrollToActiveTheme()
  } else {
    // 关闭时清除搜索
    searchQuery.value = ''
  }
}

const selectTheme = async (value) => {
  // 立即更新本地状态，确保UI及时响应
  emit('update:modelValue', value)
  
  // 等待一下确保状态更新
  await nextTick()
  
  isOpen.value = false
  searchQuery.value = ''
}

const closeDropdown = (e) => {
  if (!e.target.closest('.theme-selector')) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// 监听主题变化，如果下拉菜单打开则滚动到新主题
watch(() => props.modelValue, async (newValue, oldValue) => {
  // 等待DOM更新完成
  await nextTick()
  
  // 强制触发computed属性重新计算
  void currentThemeData.value
  
  if (isOpen.value) {
    scrollToActiveTheme()
  }
}, { immediate: false, flush: 'post' })

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
  display: flex;
  flex-direction: column;
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

/* 搜索框样式 */
.theme-search {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid #f0ede5;
  background: #fafafa;
}

body[data-theme-type="dark"] .theme-search {
  background: #2d2d30;
  border-bottom-color: #3e3e42;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 32px;
  border: 1px solid #e8e5df;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: #fff;
  color: #2c2c2c;
}

body[data-theme-type="dark"] .search-input {
  background: #3e3e42;
  border-color: #555;
  color: #d4d4d4;
}

.search-input:focus {
  border-color: #91d5ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

body[data-theme-type="dark"] .search-input:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #999;
  pointer-events: none;
}

.clear-search {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #999;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #e8e5df;
  color: #666;
}

body[data-theme-type="dark"] .clear-search:hover {
  background: #4e4e52;
  color: #d4d4d4;
}

/* 高亮标记 */
.theme-item-label mark,
.theme-item-desc mark {
  background: #fffbe6;
  color: #d48806;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

body[data-theme-type="dark"] .theme-item-label mark,
body[data-theme-type="dark"] .theme-item-desc mark {
  background: #2d2d30;
  color: #ffd666;
}

/* 无结果提示 */
.no-results {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 14px;
}

.theme-categories {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
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


