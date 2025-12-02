# GitHub Actions 部署配置指南

本指南将帮助你配置 GitHub Actions 工作流，实现自动部署到 Cloudflare Workers。

## 📋 前置条件

- Cloudflare 账户
- GitHub 仓库访问权限
- 已有 Cloudflare Workers 项目

## 🔑 第一步：获取 Cloudflare API Token

### 1.1 登录 Cloudflare

访问 [Cloudflare Dashboard](https://dash.cloudflare.com) 并登录你的账户。

### 1.2 创建 API Token

1. 点击右上角头像 → **My Profile**
2. 在左侧菜单选择 **API Tokens**
3. 点击 **Create Token**
4. 在 "Custom token" 下点击 **Get started**
5. 填写以下配置：

| 配置项 | 值 |
|--------|-----|
| Token name | `GitHub Actions` (或自定义名称) |
| Permissions | 添加以下权限：<br/>- Account Resources → Cloudflare Workers Scripts → Edit |
| Account Resources | 选择你要部署的账户 |
| TTL | 根据需要设置（建议选择较长期限） |

6. 点击 **Continue to summary** → **Create Token**
7. **复制生成的 Token**（只显示一次，保存好）

## 👤 第二步：获取 Cloudflare Account ID

### 2.1 查找 Account ID

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 右上角头像 → **My Profile**
3. 在 **Account** 部分，找到 **Account ID**
4. 点击复制按钮复制 ID

或者：
- 在任何 Cloudflare 页面 URL 中查找：`https://dash.cloudflare.com/[ACCOUNT_ID]`

## 🌐 第三步：获取 Worker URL（可选）

Worker 部署后的 URL 格式为：
```
https://<worker-name>.<your-subdomain>.workers.dev
```

你可以在 Cloudflare Dashboard → Workers 中找到完整 URL。

## 🔐 第四步：配置 GitHub Secrets

### 4.1 进入仓库设置

1. 进入 GitHub 仓库主页
2. 点击 **Settings** 选项卡
3. 在左侧菜单找到 **Secrets and variables** → **Actions**

### 4.2 添加密钥

点击 **New repository secret**，按顺序添加以下密钥：

#### CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: 粘贴你在步骤 1.2 中复制的 API Token
- 点击 **Add secret**

#### CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: 粘贴你在步骤 2.1 中复制的 Account ID
- 点击 **Add secret**

#### CLOUDFLARE_WORKER_URL（可选）
- **Name**: `CLOUDFLARE_WORKER_URL`
- **Secret**: 粘贴你的 Worker URL（如：`my-worker.example.workers.dev`）
- 点击 **Add secret**

### 4.3 验证密钥

添加完成后，你应该在 Secrets 页面看到三个密钥列表：
- ✓ CLOUDFLARE_API_TOKEN
- ✓ CLOUDFLARE_ACCOUNT_ID
- ✓ CLOUDFLARE_WORKER_URL

## ✅ 第五步：验证部署

### 5.1 触发工作流

进行以下操作之一来触发工作流：

1. **推送到 main 分支** - 自动部署
   ```bash
   git push origin main
   ```

2. **提交 Pull Request** - 运行测试（不部署）
   ```bash
   git push origin feature-branch
   ```

### 5.2 查看运行状态

1. 在仓库主页点击 **Actions** 选项卡
2. 在左侧看到 **Deploy to Cloudflare Workers** 工作流
3. 点击最新的运行记录查看详情

### 5.3 查看部署日志

点击运行记录中的 **Deploy to Cloudflare Workers** job，展开各个步骤查看日志。

## 🐛 常见问题

### Q: 部署失败，提示 "Authentication failed"

**A**: 检查 `CLOUDFLARE_API_TOKEN` 是否正确：
- 确保 Token 未过期
- 检查 Token 权限是否包含 "Cloudflare Workers Scripts → Edit"
- 重新生成新的 Token

### Q: 部署失败，提示 "Invalid account ID"

**A**: 检查 `CLOUDFLARE_ACCOUNT_ID`：
- 确认 Account ID 是正确的 16 位字母数字组合
- Account ID 不是邮箱地址或用户名

### Q: 工作流在 PR 时也部署了

**A**: 检查工作流配置。当前配置只在推送到 `main` 分支时部署，PR 只运行构建测试。

### Q: 如何只在特定条件下部署

**A**: 修改 `.github/workflows/deploy.yml` 中的 `on:` 部分：

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'wrangler.toml'
```

这样只有修改 `src/` 或 `wrangler.toml` 时才会触发部署。

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 💡 高级配置

### 添加多环境部署

如需部署到多个环境（开发、测试、生产），可修改工作流：

```yaml
jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main'
    # ... 部署配置
    
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    # ... 部署配置
```

### 添加通知

在部署后添加通知（Slack、钉钉等）：

```yaml
- name: Send notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

**配置完成后，每次推送到 main 分支时，你的应用就会自动部署到 Cloudflare Workers！** 🚀
