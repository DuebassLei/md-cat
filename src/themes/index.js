// 主题配置
export const themes = {
  wechat: {
    label: '微信公众号',
    value: 'wechat',
    type: 'light',
    icon: '📱',
    description: '适合微信公众号文章排版'
  },
  aiarticle: {
    label: 'AI文章',
    value: 'aiarticle',
    type: 'light',
    icon: '🤖',
    description: 'AI 生成文章风格，科技感十足'
  },
  readingnotes: {
    label: '读书笔记',
    value: 'readingnotes',
    type: 'light',
    icon: '📚',
    description: '读书笔记风格，优雅阅读体验'
  },
  xiaohongshu: {
    label: '小红书卡片',
    value: 'xiaohongshu',
    type: 'light',
    icon: '📕',
    description: '卡片式设计，渐变色标题'
  },
  github: {
    label: 'GitHub',
    value: 'github',
    type: 'light',
    icon: '💻',
    description: 'GitHub 风格，简洁专业'
  },
  notion: {
    label: 'Notion',
    value: 'notion',
    type: 'light',
    icon: '📝',
    description: 'Notion 风格，现代简洁'
  },
  typora: {
    label: 'Typora',
    value: 'typora',
    type: 'light',
    icon: '✍️',
    description: 'Typora 风格，优雅阅读'
  },
  dark: {
    label: '暗色主题',
    value: 'dark',
    type: 'dark',
    icon: '🌙',
    description: '护眼暗色模式'
  },
  dracula: {
    label: 'Dracula',
    value: 'dracula',
    type: 'dark',
    icon: '🧛',
    description: 'Dracula 暗色主题'
  },
  material: {
    label: 'Material',
    value: 'material',
    type: 'light',
    icon: '🎨',
    description: 'Material Design 风格'
  },
  // doocs/md 主题系列
  doocs: {
    label: 'Doocs 简约',
    value: 'doocs',
    type: 'light',
    icon: '✨',
    description: 'doocs/md 简约风格'
  },
  doocsTech: {
    label: 'Doocs 科技',
    value: 'doocsTech',
    type: 'light',
    icon: '⚡',
    description: 'doocs/md 科技风格'
  },
  doocsArt: {
    label: 'Doocs 文艺',
    value: 'doocsArt',
    type: 'light',
    icon: '🎭',
    description: 'doocs/md 文艺风格'
  },
  doocsBusiness: {
    label: 'Doocs 商务',
    value: 'doocsBusiness',
    type: 'light',
    icon: '💼',
    description: 'doocs/md 商务风格'
  },
  doocsFresh: {
    label: 'Doocs 清新',
    value: 'doocsFresh',
    type: 'light',
    icon: '🌿',
    description: 'doocs/md 清新风格'
  },
  doocsWarm: {
    label: 'Doocs 温暖',
    value: 'doocsWarm',
    type: 'light',
    icon: '☀️',
    description: 'doocs/md 温暖风格'
  },
  doocsCool: {
    label: 'Doocs 冷色',
    value: 'doocsCool',
    type: 'light',
    icon: '❄️',
    description: 'doocs/md 冷色风格'
  }
}

export const getThemeList = () => {
  return Object.values(themes).map(theme => ({
    label: theme.label,
    value: theme.value,
    icon: theme.icon,
    type: theme.type,
    description: theme.description
  }))
}

export const getTheme = (value) => {
  return themes[value] || themes.wechat
}

