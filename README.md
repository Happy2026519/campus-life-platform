# 校园生活服务平台

一个基于 React + TypeScript + Express + SQLite 的全栈校园生活服务平台，提供三大核心功能模块：**食堂点评**、**二手交易**、**失物招领**，并集成 AI 智能助手（基于 DeepSeek API）。

---

## 项目功能

### 1. 食堂点评
- 浏览食堂列表（名称、位置、评分、标签）
- 查看食堂评价详情
- 提交/修改/删除评价（需登录）
- AI 评价总结：一键生成食堂口碑总结（3句话）

### 2. 二手交易
- 浏览二手商品列表（支持关键词搜索、分类筛选）
- 查看商品详情
- 发布/修改/下架商品（需登录）
- AI 商品描述生成：填写基本信息后自动生成商品简介

### 3. 失物招领
- 浏览失物招领信息（支持类型筛选、关键词搜索）
- 查看信息详情
- 发布/修改/删除信息（需登录）

### 4. 课表查询
- 查看本周课程安排（按天/按周展示）

### 5. 自习室查询
- 查看自习室空闲情况（按时间段）

### 6. 用户认证
- 注册/登录（JWT Token）
- 个人中心查看统计数据

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式方案 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| 后端框架 | Express 5 |
| 数据库 | SQLite (sql.js) |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| AI 接口 | DeepSeek Chat API |
| 环境变量 | dotenv |

---

## 快速启动

### 前置要求

- Node.js >= 18
- npm >= 9

### 1. 安装依赖

```bash
cd campus-life-platform
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（已提供默认值，无需修改即可启动）：

```env
# 前端 API 地址（开发环境通过 Vite 代理，留空即可）
VITE_API_BASE=

# 后端 DeepSeek API Key（AI 功能必需）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

> **注意**：AI 总结和商品描述生成功能需要有效的 DeepSeek API Key。如未配置，AI 功能将不可用（返回 500），但其他功能不受影响。

### 3. 启动开发环境

**启动后端服务器**（终端 1）：

```bash
npm run server
```

后端默认运行在 `http://localhost:3001`。首次启动会自动创建 SQLite 数据库并导入初始数据。

**启动前端开发服务器**（终端 2）：

```bash
npm run dev
```

前端默认运行在 `http://localhost:5173`，通过 Vite 代理自动转发 `/api` 请求到后端。

### 4. 打开浏览器

访问 `http://localhost:5173` 即可使用。

---

## 部署

### 生产构建

```bash
npm run build
```

构建产物位于 `dist/` 目录，包含：

```
dist/
├── index.html           # 入口 HTML
├── favicon.svg          # 网站图标
├── icons.svg            # 图标集合
├── assets/
│   ├── index-xxx.js     # 打包后的 JS
│   └── index-xxx.css    # 打包后的 CSS
└── api/                 # 静态 API 数据（可选）
```

### 部署方式

#### 方式一：同域部署（推荐）

将 `dist/` 目录下的文件部署到静态文件服务器（如 Nginx），同时将后端 Express 服务反向代理到同一域名下。

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    root /path/to/dist;
    index index.html;

    # API 请求转发到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方式二：前后端分离部署

1. 修改 `.env.production` 中的 `VITE_API_BASE` 为后端实际地址
2. 执行 `npm run build` 重新构建
3. 将 `dist/` 部署到 CDN 或静态服务器
4. 后端服务器独立部署，确保 CORS 配置正确

### 后端启动（生产环境）

```bash
# 设置环境变量
export DEEPSEEK_API_KEY=your_key_here

# 启动后端（推荐使用 PM2 进程管理）
npm install -g pm2
pm2 start server/index.js --name campus-api
```

---

## 项目结构

```
campus-life-platform/
├── public/               # 静态资源
│   ├── favicon.svg
│   └── icons.svg
├── server/               # 后端
│   ├── database/
│   │   ├── connection.js # 数据库连接（sql.js 单例）
│   │   ├── init.js       # 数据库初始化与种子数据
│   │   └── campus.db     # SQLite 数据库文件
│   ├── middleware/
│   │   └── auth.js       # JWT 认证中间件
│   ├── routes/
│   │   ├── canteens.js   # 食堂 API
│   │   ├── items.js      # 二手商品 API
│   │   ├── lost-found.js # 失物招领 API
│   │   ├── reviews.js    # 评价 API
│   │   ├── auth.js       # 认证 API（注册/登录/获取用户信息）
│   │   └── ai.js         # AI 功能 API（评价总结/商品描述生成）
│   └── index.js          # 服务器入口
├── src/                  # 前端
│   ├── assets/           # 图片资源
│   ├── components/       # 通用组件
│   │   ├── FeatureCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   ├── LostFoundForm.tsx
│   │   ├── Navbar.tsx
│   │   ├── PostItemForm.tsx
│   │   ├── RatingStars.tsx
│   │   └── ReviewForm.tsx
│   ├── config/
│   │   └── api.ts        # API 请求工具（含认证拦截）
│   ├── data/
│   │   └── mockData.ts   # 前端模拟数据（课表/自习室/个人统计）
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CanteenPage.tsx    # 食堂点评
│   │   ├── TradePage.tsx      # 二手交易
│   │   ├── LostFoundPage.tsx  # 失物招领
│   │   ├── SchedulePage.tsx   # 课表查询
│   │   ├── StudyRoomPage.tsx  # 自习室
│   │   ├── AuthPage.tsx       # 登录/注册
│   │   └── ProfilePage.tsx    # 个人中心
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── router.tsx
├── .env                  # 开发环境变量
├── .env.production       # 生产环境变量
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## API 接口

| 模块 | 方法 | 路径 | 说明 | 需登录 |
|------|------|------|------|--------|
| 食堂 | GET | `/api/canteens` | 获取食堂列表 | 否 |
| 评价 | GET | `/api/reviews` | 获取评价列表（支持 `canteen_id`/`item_id` 筛选） | 否 |
| 评价 | POST | `/api/reviews` | 提交评价 | 是 |
| 评价 | PUT | `/api/reviews/:id` | 修改评价 | 是（仅本人） |
| 评价 | DELETE | `/api/reviews/:id` | 删除评价 | 是（仅本人） |
| 商品 | GET | `/api/items` | 获取商品列表（支持 `keyword`/`category`/`status`/`page`/`limit`） | 否 |
| 商品 | GET | `/api/items/:id` | 获取商品详情 | 否 |
| 商品 | POST | `/api/items` | 发布商品 | 是 |
| 商品 | PUT | `/api/items/:id` | 修改商品 | 是（仅本人） |
| 商品 | DELETE | `/api/items/:id` | 下架商品（软删除） | 是（仅本人） |
| 失物招领 | GET | `/api/lost-found` | 获取列表（支持 `type`/`keyword`/`page`/`limit`） | 否 |
| 失物招领 | GET | `/api/lost-found/:id` | 获取详情 | 否 |
| 失物招领 | POST | `/api/lost-found` | 发布信息 | 是 |
| 失物招领 | PUT | `/api/lost-found/:id` | 修改信息 | 是（仅本人） |
| 失物招领 | DELETE | `/api/lost-found/:id` | 删除信息 | 是（仅本人） |
| 认证 | POST | `/api/auth/register` | 注册 | 否 |
| 认证 | POST | `/api/auth/login` | 登录 | 否 |
| 认证 | GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| AI | POST | `/api/ai/summarize-reviews` | 评价总结（需 `canteen_id` 或 `item_id`） | 否 |
| AI | POST | `/api/ai/generate-description` | 商品描述生成（需 `title` + `price`） | 否 |

### 认证方式

所有需要登录的接口使用 **Bearer Token** 认证：

```bash
# 1. 登录获取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "学长A", "password": "123456"}'

# 2. 使用 token 请求需要登录的接口
curl -X POST http://localhost:3001/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"canteen_id": 1, "content": "很好吃", "rating": 5}'
```

### 默认用户

| 用户名 | 密码 |
|--------|------|
| 学长A | 123456 |
| 同学B | 123456 |
| 学姐C | 123456 |
| 学长D | 123456 |
| 同学E | 123456 |
| 学姐F | 123456 |

---

## 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `VITE_API_BASE` | `''` | 前端 API 基础地址，开发环境通过 Vite 代理留空 |
| `VITE_BASE_URL` | `'/'` | 前端部署基础路径，部署到子路径时修改 |
| `DEEPSEEK_API_KEY` | - | DeepSeek API Key（AI 功能必需） |
| `DEEPSEEK_API_BASE` | `https://api.deepseek.com` | DeepSeek API 基础地址 |

---

## 测试账号

| 功能 | 测试数据 |
|------|----------|
| 食堂 | 4 个食堂（第一至第三食堂 + 教工食堂） |
| 商品 | 6 件初始商品（教材/电子/生活） |
| 失物招领 | 8 条初始信息（丢失/捡到各4条） |
| 用户 | 6 个预置用户（密码均为 123456） |

---

## 常见问题

**Q: 数据库文件在哪？**
A: `server/database/campus.db`，首次启动时自动创建。已加入 `.gitignore`。

**Q: 如何重置数据？**
A: 删除 `server/database/campus.db` 文件并重启后端，会自动重新初始化。

**Q: 前端端口被占用？**
A: 修改 `vite.config.ts` 中的 `server.port` 配置。

**Q: 后端端口被占用？**
A: 修改 `server/index.js` 中的 `PORT` 变量。

**Q: AI 功能报错 "未配置 DeepSeek API Key"？**
A: 在 `.env` 文件中添加 `DEEPSEEK_API_KEY=your_key` 并重启后端。

---

## 许可证

MIT