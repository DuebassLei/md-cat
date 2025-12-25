# GitHub Pages 部署配置说明

## 方法一：使用 GitHub Actions（推荐）

### 1. 启用 GitHub Pages

在 GitHub 仓库中：

1. 进入仓库的 **Settings**（设置）
2. 在左侧菜单中找到 **Pages**（页面）
3. 在 **Source**（源）部分：
   - 选择 **GitHub Actions** 作为源
   - 不要选择 "Deploy from a branch"
4. 保存设置

### 2. 检查权限

确保工作流有正确的权限：
- `contents: read` - 读取仓库内容
- `pages: write` - 写入 Pages
- `id-token: write` - 用于 OIDC 认证

这些权限已经在 `.github/workflows/deploy.yml` 中配置好了。

### 3. 推送代码

推送代码到 `main` 或 `master` 分支后，GitHub Actions 会自动：
1. 构建项目
2. 部署到 GitHub Pages

### 4. 访问网站

部署完成后，访问：`https://<你的用户名>.github.io/md-cat/`

## 方法二：手动部署（备选）

如果 GitHub Actions 无法使用，可以手动部署：

1. 本地构建：`yarn build`
2. 将 `dist` 目录的内容推送到 `gh-pages` 分支
3. 在仓库设置中选择 `gh-pages` 分支作为 Pages 源

## 故障排除

### 错误：Get Pages site failed

**原因**：GitHub Pages 未启用或未配置为使用 GitHub Actions

**解决方法**：
1. 进入仓库 Settings → Pages
2. 确保 Source 选择为 "GitHub Actions"
3. 如果看不到 "GitHub Actions" 选项，可能需要：
   - 确保仓库是公开的，或者
   - 升级到 GitHub Pro/Team 账户（私有仓库需要）

### 错误：Permission denied

**原因**：工作流权限不足

**解决方法**：
1. 进入仓库 Settings → Actions → General
2. 在 "Workflow permissions" 部分：
   - 选择 "Read and write permissions"
   - 勾选 "Allow GitHub Actions to create and approve pull requests"

## 注意事项

- 首次部署可能需要几分钟
- 如果修改了仓库名称，需要更新 `vite.config.js` 中的 `base` 路径
- 如果使用自定义域名，将 `base` 设置为 `/`

