# mweb-themes 主题导入说明

## 概述

已将所有 mweb-themes 主题添加到主题配置中，共 30+ 个主题。

## 主题列表

### 浅色主题
- Ayu
- Bear 默认
- Contrast
- D Boring
- Default
- Duotone Heat
- Duotone Light
- Gandalf
- Indigo
- Jzman
- Lark
- Olive Dunk
- Red Graphite
- Smart Blue
- Solarized Light
- Typo
- V Green
- Vue

### 深色主题
- Ayu Mirage
- Charcoal
- Cobalt
- Dark Graphite
- Dieci
- Dracula (已存在)
- Gotham
- Lighthouse
- Nord
- Panic
- Solarized Dark
- Toothpaste

## 使用方法

### 方法一：使用编译脚本（推荐）

1. 确保已安装依赖：
```bash
npm install sass fs-extra --save-dev
```

2. 运行导入脚本：
```bash
node scripts/import-mweb-themes.js
```

脚本会自动：
- 编译所有 SCSS 主题文件为 CSS
- 将 `.markdown-body` 替换为 `.preview-content.theme-{name}`
- 保存到 `src/themes/styles/` 目录
- 更新主题配置

### 方法二：手动编译

1. 进入 mweb-themes 项目目录：
```bash
cd ../mweb-themes-master
npm install
```

2. 编译主题（生成 CSS 文件）：
```bash
npm run compile
```

3. 将编译后的 CSS 文件复制到 `md-cat/src/themes/styles/` 目录

4. 手动修改 CSS 文件：
   - 将所有 `.markdown-body` 替换为 `.preview-content.theme-{theme-name}`
   - 将 `body` 和 `html` 选择器替换为 `.preview-content.theme-{theme-name}`

### 方法三：使用在线编译工具

1. 访问 [SassMeister](https://www.sassmeister.com/) 或其他在线 SCSS 编译器
2. 复制 mweb-themes 的 SCSS 文件内容
3. 编译为 CSS
4. 按照方法二的步骤 4 进行修改

## 已完成的主题

- ✅ Vue - 已手动转换并添加到 `src/themes/styles/vue.css`

## 注意事项

1. **SCSS 依赖**：mweb-themes 使用 SCSS 变量系统，编译时需要处理所有依赖文件
2. **类名适配**：需要将 `.markdown-body` 替换为 `.preview-content.theme-{name}`
3. **样式隔离**：确保主题样式不会影响其他组件
4. **字体文件**：某些主题（如 Vue）包含字体文件，需要处理字体路径

## 主题文件位置

- 源文件：`D:\DevelopWorkspace\mweb-themes-master\src\themes\`
- 目标位置：`D:\DevelopWorkspace\md-cat\src\themes\styles\`
- 配置文件：`D:\DevelopWorkspace\md-cat\src\themes\index.js`

## 参考

- [mweb-themes GitHub](https://github.com/imageslr/mweb-themes)
- [在线预览所有主题](https://imageslr.github.io/mweb-themes)

