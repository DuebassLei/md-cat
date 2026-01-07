/**
 * 主题样式加载器
 * 用于动态加载 mweb-themes 主题样式
 */

// 已加载的主题样式集合
const loadedThemes = new Set()

// mweb-themes 主题列表
const mwebThemes = [
  'ayu', 'bear-default', 'contrast', 'd-boring', 'default', 'duotone-heat', 'duotone-light',
  'gandalf', 'indigo', 'jzman', 'lark', 'olive-dunk', 'red-graphite', 'smartblue',
  'solarized-light', 'typo', 'v-green', 'vue',
  'ayu-mirage', 'charcoal', 'cobalt', 'dark-graphite', 'dieci', 'gotham',
  'lighthouse', 'nord', 'panic', 'solarized-dark', 'toothpaste'
]

/**
 * 动态加载主题样式
 * @param {string} themeName - 主题名称
 */
export const loadThemeStyle = async (themeName) => {
  // 检查是否是 mweb-themes 主题
  if (!mwebThemes.includes(themeName)) {
    return
  }
  
  // 如果已经加载过，跳过
  if (loadedThemes.has(themeName)) {
    return
  }
  
  try {
    // 使用动态导入加载 CSS
    await import(`../themes/styles/${themeName}.css`)
    loadedThemes.add(themeName)
  } catch (error) {
    // 样式文件不存在时静默失败，使用 mweb-default.css 中的基础样式
    // 标记为已尝试加载，避免重复尝试
    loadedThemes.add(themeName)
  }
}

/**
 * 检查主题是否是 mweb-themes 主题
 * @param {string} themeName - 主题名称
 * @returns {boolean}
 */
export const isMwebTheme = (themeName) => {
  return mwebThemes.includes(themeName)
}

