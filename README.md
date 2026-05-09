# LiMao - 全栈项目管理系统

一个现代化的全栈项目管理系统，提供 AI 聊天、代码编辑、文件管理、论坛交流、开源项目管理、支付等功能。

## 功能特性

### 前端功能
- **AI 智能聊天** - 支持多种大语言模型（Claude、GPT-5、Gemini、DeepSeek、通义千问、GLM 等 20+ 模型）
- **AI 长久记忆** - 基于 IndexedDB 的本地记忆存储，跨对话记住用户偏好
- **在线代码编辑器** - 基于 Monaco Editor，支持语法高亮、自动补全
- **文件管理** - 文件树结构管理，支持文件上传下载
- **本地存储管理** - 用户文件上传到浏览器本地 IndexedDB，不依赖服务器
- **开源项目展示** - 精选开源项目展示，支持分类筛选
- **论坛社区** - 用户交流讨论平台，帖子分类管理
- **产品中心** - 商品浏览与购买
- **支付系统** - 支付宝扫码支付 + H5 手机网站支付
- **用户系统** - 注册登录、个人中心、消息通知（WebSocket 实时推送）
- **滑块验证码** - 安全登录验证
- **响应式设计** - 适配各种设备
- **暗黑模式** - 支持明暗主题切换

### 后端功能
- **RESTful API** - 完整的后端接口服务
- **用户认证** - JWT Token 认证机制
- **邮件服务** - 163 邮箱验证码发送
- **数据库管理** - MySQL 数据存储
- **AI 集成** - 集成 NVIDIA API 调用多种 AI 模型
- **支付接口** - 支付宝当面付 + 手机网站支付集成
- **WebSocket** - 实时消息通知推送
- **IP 归属地查询** - 基于 IP2Region 的 IP 地理位置识别
- **图片生成** - AI 图片/视频生成接口

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.32 | 前端框架 |
| Vite | 8.0.10 | 构建工具 |
| Axios | 1.15.2 | HTTP 请求 |
| Monaco Editor | 0.55.1 | 代码编辑器 |
| Marked | 18.0.2 | Markdown 渲染 |
| DOMPurify | 3.4.2 | XSS 防护 |
| JSZip | 3.10.1 | 文件压缩 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | - | 运行环境 |
| Express | 5.2.1 | Web 框架 |
| MySQL | 2.x | 数据库 |
| jsonwebtoken | - | JWT 认证 |
| bcrypt | - | 密码加密 |
| multer | - | 文件上传 |
| nodemailer | - | 邮件发送 |
| alipay-sdk | 4.14.0 | 支付宝 SDK |
| IP2Region | - | IP 归属地 |

## 本地数据存储架构

浏览器本地使用多个 IndexedDB 数据库实现持久化存储：

| 数据库名称 | 存储内容 | 说明 |
|-----------|---------|------|
| `limao_memory` | AI 长久记忆 | 对话中提取的用户偏好和关键信息 |
| `limao_chat` | 聊天记录 | 所有会话和消息内容 |
| `limao_user_files` | 用户上传文件 | 图片、视频、文档等任意类型文件 |
| `limao_workspace` | 工作区文件 | 代码编辑器中的文件内容 |

所有数据存储在用户浏览器本地，不占用后端服务器资源。

## 安装与运行

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- Git

### 1. 克隆项目
```bash
git clone https://github.com/ShiJueTianChuang/LiMao-v1.git
cd LiMao-v1
```

### 2. 配置后端
```bash
cd limaohouduan
npm install

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，填写你的配置
```

### 3. 配置前端
```bash
cd ../limaoqianduan
npm install
```

### 4. 启动服务

**启动后端**（在 `limaohouduan` 目录）:
```bash
npm start
```
后端服务运行在：http://localhost:3000

**启动前端**（在 `limaoqianduan` 目录）:
```bash
npm run dev
```
前端服务运行在：http://localhost:5173

## 项目结构

```
LiMao-v1/
├── limaohouduan/              # 后端服务
│   ├── routes/               # API 路由
│   │   ├── auth.js           # 用户认证
│   │   ├── ai.js             # AI 接口（对话/图片/视频）
│   │   ├── forum.js          # 论坛帖子
│   │   ├── products.js       # 商品管理
│   │   ├── payment.js        # 支付宝支付
│   │   ├── notifications.js  # 通知管理
│   │   └── ...
│   ├── admin.html            # 管理后台
│   ├── server.js             # 服务器入口
│   ├── db.js                 # 数据库配置与初始化
│   ├── config.js             # 应用配置
│   ├── mail.js               # 邮件服务
│   ├── middleware.js          # 中间件
│   └── .env.example          # 环境变量示例
│
├── limaoqianduan/            # 前端应用
│   ├── src/
│   │   ├── components/       # Vue 组件
│   │   │   ├── AiChatPage.vue      # AI 聊天页面
│   │   │   ├── HomePage.vue        # 首页
│   │   │   ├── ForumPage.vue       # 论坛页面
│   │   │   ├── ProductSidebar.vue  # 产品侧边栏
│   │   │   ├── NotificationPanel.vue # 通知面板
│   │   │   ├── NavBar.vue         # 导航栏
│   │   │   ├── AuthModal.vue       # 登录注册弹窗
│   │   │   └── ProfileModal.vue    # 个人中心
│   │   ├── utils/            # 工具函数
│   │   │   ├── memoryDB.js        # AI 记忆存储 (IndexedDB)
│   │   │   ├── localFileDB.js     # 用户文件存储 (IndexedDB)
│   │   │   ├── localChatDB.js     # 聊天记录存储 (IndexedDB)
│   │   │   └── workspaceDB.js      # 工作区文件存储
│   │   ├── constants.js      # 全局常量（分类、图标等）
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 入口文件
│   ├── public/               # 静态资源
│   └── vite.config.js        # Vite 配置
│
├── .gitignore                # Git 忽略配置
└── README.md                 # 项目文档
```

## 论坛分类体系

社区论坛和开源项目使用统一的分类体系：

| 分类 | 说明 |
|------|------|
| 小程序 | 微信小程序、支付宝小程序、百度小程序、抖音小程序 |
| 安卓 | Android 应用 |
| 鸿蒙 | HarmonyOS 应用 |
| 苹果 | iOS 应用 |
| 网站 | 网站类项目 |
| AI | AI 相关项目 |
| 文档 | 使用说明、教程、帮助文档 |

## 支付功能说明

本项目集成了支付宝支付能力：

- **扫码支付** (`alipay.trade.precreate`) - PC 端显示二维码，手机扫码付款
- **H5 手机网站支付** (`alipay.trade.wap.pay`) - 移动端跳转支付宝 App 付款

> 注意：需要先在支付宝开放平台签约"当面付"和"手机网站支付"产品才能在生产环境使用。开发阶段可使用沙箱环境测试。

## 安全说明

- 已配置 `.gitignore`，敏感信息（`.env`、支付宝密钥等）不会被提交
- 部署时请确保 `.env` 文件权限安全
- 生产环境请使用强密码和 HTTPS
- 数据库密码请勿使用弱口令

## 环境变量配置

### 后端必需配置（`.env`）

```env
# 服务器端口
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=limao

# 邮箱配置（163邮箱验证码）
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=你的邮箱@163.com
SMTP_PASS=你的邮箱授权码
SMTP_FROM=你的邮箱@163.com

# JWT密钥
JWT_SECRET=至少32位的随机字符串

# NVIDIA API Key（AI模型调用）
NVIDIA_API_KEY=你的NVIDIA_API_KEY

# 支付宝支付配置（可选）
ALIPAY_APP_ID=你的APPID
ALIPAY_PRIVATE_KEY=应用私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://你的域名/api/payment/notify
ALIPAY_RETURN_URL=https://你的前端域名

# 跨域配置
CORS_ORIGIN=http://localhost:5173
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

ISC License

## 作者

- GitHub: [@ShiJueTianChuang](https://github.com/ShiJueTianChuang)

## 链接

- 项目仓库：https://github.com/ShiJueTianChuang/LiMao-v1
- 问题反馈：https://github.com/ShiJueTianChuang/LiMao-v1/issues
