# Memos - 轻量级备忘录系统

[![部署状态](https://img.shields.io/badge/部署-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![数据库](https://img.shields.io/badge/数据库-Cloudflare%20D1-blue)](https://developers.cloudflare.com/d1/)
[![存储](https://img.shields.io/badge/存储-Cloudflare%20R2-green)](https://developers.cloudflare.com/r2/)

一个基于 Cloudflare Workers 的现代化备忘录管理系统，提供完整的 API 和 Web 界面。

## ✨ 功能特性

- 📝 **备忘录管理** - 创建、查看、编辑、删除备忘录
- 📎 **文件上传** - 支持图片等文件附件
- 🔐 **安全认证** - TOKEN 认证保护敏感操作
- 👥 **用户系统** - 多用户支持，首位用户自动成为管理员
- 🌐 **响应式界面** - 现代化 Web 界面，支持移动端
- ⚡ **边缘计算** - 基于 Cloudflare Workers，全球低延迟
- 🗄️ **零运维** - 无服务器架构，自动扩展

## 🚀 快速开始

### 前置要求

- Node.js 16+
- Cloudflare 账户
- Wrangler CLI


### 手动部署


# 1. 安装依赖
```bash
npm install
```
# 2. 登录 Cloudflare
```bash
wrangler login
```
# 3. 创建数据库
```bash
wrangler d1 create memos_db
```
# 4. 更新 wrangler.toml 中的 `database_id`

将 `wrangler.toml` 文件中的 `database_id` 更新为上一步创建的数据库 ID。

# 5. 初始化数据库
```bash
wrangler d1 execute memos_db --file=./schema.sql --remote
```

# 6. 创建存储桶
```bash
wrangler r2 bucket create memos
```

~~# 7. 设置访问令牌~~
~~wrangler secret put TOKEN~~

# 8. 部署
```bash
wrangler deploy
```

## 📖 API 文档

### 认证

需要权限的接口需要在请求中包含 TOKEN：

```bash
# 请求头方式
Authorization: Bearer YOUR_TOKEN
# 或
X-Token: YOUR_TOKEN

# 查询参数方式
?token=YOUR_TOKEN
```

### 备忘录接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/v1/memo` | 获取备忘录列表 | 无需 |
| GET | `/api/v1/memo/:id` | 获取单个备忘录 | 无需 |
| POST | `/api/v1/memo` | 创建备忘录 | 需要 |
| PUT | `/api/v1/memo/:id` | 更新备忘录 | 需要 |
| DELETE | `/api/v1/memo/:id` | 删除备忘录 | 需要 |

### 用户接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/v1/user` | 获取用户列表 | 需要 |
| POST | `/api/v1/user` | 创建用户 | 首次部署时首个用户无需；之后需要管理员或服务端TOKEN |

### 资源接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/v1/resource/:id` | 获取资源 | 无需 |
| POST | `/api/v1/resource` | 上传文件 | 需要 |
| GET | `/api/v1/resourceList` | 获取资源列表 | 需要 |

## 🌐 Web 界面

- **首页**: `https://your-worker.workers.dev/` - 备忘录列表和创建
- **详情页**: `https://your-worker.workers.dev/m/:id` - 备忘录详情和编辑

## 🏗️ 技术架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web 界面      │───▶│ Cloudflare       │───▶│ Cloudflare D1   │
│   RESTful API   │    │ Workers          │    │ 数据库          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Cloudflare R2   │
                       │ 文件存储        │
                       └─────────────────┘
```

## 📂 项目结构

```
memos/
├── src/
│   ├── handlers/          # API 处理器
│   │   ├── memos.js      # 备忘录接口
│   │   ├── users.js      # 用户接口
│   │   ├── resources.js  # 资源接口
│   │   └── web.js        # Web 界面
│   ├── utils/            # 工具函数
│   │   ├── auth.js       # 认证中间件
│   │   └── cors.js       # CORS 配置
│   └── index.js          # 主入口
├── schema.sql            # 数据库结构
├── wrangler.toml         # Workers 配置
├── package.json          # 项目依赖
```

## 🔧 本地开发

```bash
# 启动本地开发服务器
npm run dev

# 初始化本地数据库
npm run db:local

# 查看实时日志
npm run tail
```

## 📝 使用示例

### 创建备忘录

```bash
curl -X POST "https://your-worker.workers.dev/api/v1/memo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "我的第一条备忘录"}'
```

### 上传文件

```bash
curl -X POST "https://your-worker.workers.dev/api/v1/resource" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器计算平台
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - 无服务器数据库
- [Cloudflare R2](https://developers.cloudflare.com/r2/) - 对象存储服务
- [itty-router](https://github.com/kwhitley/itty-router) - 轻量级路由器