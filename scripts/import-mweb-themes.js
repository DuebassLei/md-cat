/**
 * 将 mweb-themes 项目的主题导入到 md-cat 项目
 * 使用方法: node scripts/import-mweb-themes.cjs
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import sass from 'sass'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MWEB_THEMES_DIR = path.join(__dirname, '../../mweb-themes-master/src/themes')
const OUTPUT_DIR = path.join(__dirname, '../src/themes/styles')
const THEME_CONFIG_FILE = path.join(__dirname, '../src/themes/index.js')

// mweb-themes 主题配置
const mwebThemes = {
  // 浅色主题
  'ayu': { name: 'Ayu', type: 'light', icon: '🌅' },
  'bear-default': { name: 'Bear 默认', type: 'light', icon: '🐻' },
  'contrast': { name: 'Contrast', type: 'light', icon: '⚡' },
  'd-boring': { name: 'D Boring', type: 'light', icon: '📄' },
  'default': { name: 'Default', type: 'light', icon: '📝' },
  'duotone-heat': { name: 'Duotone Heat', type: 'light', icon: '🔥' },
  'duotone-light': { name: 'Duotone Light', type: 'light', icon: '💡' },
  'gandalf': { name: 'Gandalf', type: 'light', icon: '🧙' },
  'indigo': { name: 'Indigo', type: 'light', icon: '💜' },
  'jzman': { name: 'Jzman', type: 'light', icon: '📚' },
  'lark': { name: 'Lark', type: 'light', icon: '📋' },
  'olive-dunk': { name: 'Olive Dunk', type: 'light', icon: '🫒' },
  'red-graphite': { name: 'Red Graphite', type: 'light', icon: '🔴' },
  'smartblue': { name: 'Smart Blue', type: 'light', icon: '💙' },
  'solarized-light': { name: 'Solarized Light', type: 'light', icon: '☀️' },
  'typo': { name: 'Typo', type: 'light', icon: '✍️' },
  'v-green': { name: 'V Green', type: 'light', icon: '💚' },
  'vue': { name: 'Vue', type: 'light', icon: '🟢' },
  
  // 深色主题
  'ayu-mirage': { name: 'Ayu Mirage', type: 'dark', icon: '🌃' },
  'charcoal': { name: 'Charcoal', type: 'dark', icon: '🪨' },
  'cobalt': { name: 'Cobalt', type: 'dark', icon: '🔵' },
  'dark-graphite': { name: 'Dark Graphite', type: 'dark', icon: '⚫' },
  'dieci': { name: 'Dieci', type: 'dark', icon: '🌑' },
  'dracula': { name: 'Dracula', type: 'dark', icon: '🧛' },
  'gotham': { name: 'Gotham', type: 'dark', icon: '🦇' },
  'lighthouse': { name: 'Lighthouse', type: 'dark', icon: '🗼' },
  'nord': { name: 'Nord', type: 'dark', icon: '❄️' },
  'panic': { name: 'Panic', type: 'dark', icon: '🚨' },
  'solarized-dark': { name: 'Solarized Dark', type: 'dark', icon: '🌙' },
  'toothpaste': { name: 'Toothpaste', type: 'dark', icon: '🦷' },
}

// 转换 SCSS 为 CSS，并适配 md-cat 的类名
function convertScssToCss(scssPath, themeName) {
  try {
    // 编译 SCSS
    const result = sass.renderSync({
      file: scssPath,
      outputStyle: 'expanded',
      includePaths: [MWEB_THEMES_DIR]
    })
    
    let css = result.css.toString()
    
    // 将 .markdown-body 替换为 .preview-content.theme-{themeName}
    css = css.replace(/\.markdown-body/g, `.preview-content.theme-${themeName}`)
    
    // 处理 body 和 html 标签，转换为 .preview-content
    css = css.replace(/^body\s*\{/gm, `.preview-content.theme-${themeName} {`)
    css = css.replace(/^html\s*\{/gm, `.preview-content.theme-${themeName} {`)
    
    // 移除可能导致冲突的全局样式
    css = css.replace(/^html\s*\{[\s\S]*?\}/gm, '')
    
    // 对于 vue 主题，移除字体文件的 url 引用（保留 local 回退）
    if (themeName === 'vue') {
      // 移除所有包含 vue/ 路径的 url() 引用，但保留 local() 回退
      css = css.replace(/,\s*url\(["']?vue\/[^"']+["']?\)\s*format\(["']?woff2["']?\)/g, '')
    }
    
    // 确保所有选择器都作用在 .preview-content 内
    // 处理没有前缀的选择器（如 h1, p 等）
    const blockSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'img', 'a', 'hr']
    blockSelectors.forEach(selector => {
      const regex = new RegExp(`^(${selector})\\s*\\{`, 'gm')
      css = css.replace(regex, `.preview-content.theme-${themeName} $1 {`)
    })
    
    return css
  } catch (error) {
    console.error(`编译 ${scssPath} 失败:`, error.message)
    return null
  }
}

// 更新主题配置文件
function updateThemeConfig() {
  const configContent = fs.readFileSync(THEME_CONFIG_FILE, 'utf-8')
  
  // 提取现有的 themes 对象
  const themesMatch = configContent.match(/export const themes = \{([\s\S]*?)\n\}/)
  if (!themesMatch) {
    console.error('无法解析主题配置文件')
    return
  }
  
  // 检查是否已经包含 mweb-themes 主题（通过检查是否有 ayu 主题）
  const existingContent = themesMatch[1]
  const hasMwebThemes = existingContent.includes("'Ayu 主题，来自 mweb-themes'")
  
  if (hasMwebThemes) {
    console.log('⚠️  主题配置已包含 mweb-themes，跳过更新')
    return
  }
  
  // 找到 themes 对象的结束位置（在最后一个主题之后）
  // 在最后一个 } 之前插入新主题
  const lastBraceIndex = configContent.lastIndexOf('}')
  const beforeLastBrace = configContent.substring(0, lastBraceIndex)
  const afterLastBrace = configContent.substring(lastBraceIndex)
  
  // 生成新的主题配置（追加到现有主题之后）
  let newThemes = ''
  Object.entries(mwebThemes).forEach(([key, theme]) => {
    const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    newThemes += `  ${camelKey}: {\n`
    newThemes += `    label: '${theme.name}',\n`
    newThemes += `    value: '${key}',\n`
    newThemes += `    type: '${theme.type}',\n`
    newThemes += `    icon: '${theme.icon}',\n`
    newThemes += `    description: '${theme.name} 主题，来自 mweb-themes'\n`
    newThemes += `  },\n`
  })
  
  // 在最后一个主题之后、} 之前插入新主题
  const newConfig = beforeLastBrace + ',\n' + newThemes + afterLastBrace
  
  fs.writeFileSync(THEME_CONFIG_FILE, newConfig, 'utf-8')
  console.log('✅ 主题配置文件已更新')
}

async function main() {
  console.log('开始导入 mweb-themes...\n')
  
  // 确保输出目录存在
  await fs.ensureDir(OUTPUT_DIR)
  
  let successCount = 0
  let failCount = 0
  
  // 处理每个主题
  for (const [themeKey, themeInfo] of Object.entries(mwebThemes)) {
    const scssFile = path.join(MWEB_THEMES_DIR, `mweb-${themeKey}.scss`)
    const cssFile = path.join(OUTPUT_DIR, `${themeKey}.css`)
    
    if (!fs.existsSync(scssFile)) {
      console.log(`⚠️  跳过 ${themeKey}: SCSS 文件不存在`)
      failCount++
      continue
    }
    
    console.log(`处理 ${themeKey}...`)
    const css = convertScssToCss(scssFile, themeKey)
    
    if (css) {
      fs.writeFileSync(cssFile, css, 'utf-8')
      console.log(`  ✅ ${themeKey} 转换成功`)
      successCount++
    } else {
      console.log(`  ❌ ${themeKey} 转换失败`)
      failCount++
    }
  }
  
  console.log(`\n转换完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
  
  // 更新主题配置
  updateThemeConfig()
  
  console.log('\n✅ 所有主题已导入完成!')
}

main().catch(console.error)

