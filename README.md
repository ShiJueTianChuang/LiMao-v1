# LiMao - 全栈项目管理系统

一个现代化的全栈项目管理系统，提供 AI 聊天、文件管理、论坛交流等功能。

##  功能特性

### 前端功能
- ✅ **AI 智能聊天** - 支持多种大语言模型（Claude、GPT-4、Gemini、DeepSeek、通义千问等）
- ✅ **文件编辑器** - 基于 Monaco Editor 的在线代码编辑器
- ✅ **项目管理** - 文件树结构管理，支持文件上传下载
- ✅ **论坛社区** - 用户交流讨论平台
- ✅ **用户系统** - 注册登录、个人中心、消息通知
- ✅ **响应式设计** - 适配各种设备

### 后端功能
- ✅ **RESTful API** - 完整的后端接口服务
- ✅ **用户认证** - JWT Token 认证机制
- ✅ **文件上传** - 支持多种文件类型上传
- ✅ **数据库管理** - MySQL 数据存储
- ✅ **邮件服务** - 邮箱验证码发送
- ✅ **AI 集成** - 集成 NVIDIA API 调用多种 AI 模型
- ✅ **支付接口** - 支付宝支付集成（可选）

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3.5.32
- **构建工具**: Vite 8.0.10
- **HTTP 客户端**: Axios
- **代码编辑器**: Monaco Editor
- **Markdown 渲染**: Marked
- **安全过滤**: DOMPurify
- **压缩工具**: JSZip

### 后端
- **运行环境**: Node.js
- **Web 框架**: Express 5.2.1
- **数据库**: MySQL 2
- **认证**: JSON Web Token (jsonwebtoken)
- **密码加密**: bcrypt
- **文件上传**: multer
- **邮件发送**: nodemailer
- **跨域**: cors
- **环境变量**: dotenv

## 📦 安装与运行

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

# 编辑 .env 文件，填写你的数据库配置、邮箱配置等
```

### 3. 配置前端
```bash
cd ../limaoqianduan
npm install

# 复制环境变量配置文件（可选）
cp .env.example .env.development
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

## 📁 项目结构

```
LiMao-v1/
├── limaohouduan/          # 后端服务
│   ├── routes/           # API 路由
│   ├── uploads/          # 上传文件存储
│   ├── server.js         # 服务器入口
│   ├── db.js             # 数据库配置
│   ├── config.js         # 应用配置
│   ├── mail.js           # 邮件服务
│   ├── middleware.js     # 中间件
│   └── .env.example      # 环境变量示例
│
├── limaoqianduan/        # 前端应用
│   ├── src/
│   │   ├── components/   # Vue 组件
│   │   ├── utils/        # 工具函数
│   │   ├── App.vue       # 根组件
│   │   └── main.js       # 入口文件
│   ├── public/           # 静态资源
│   └── vite.config.js    # Vite 配置
│
└── README.md             # 项目文档
```

## 🔐 安全说明

- 项目已配置 `.gitignore`，敏感信息（数据库密码、API 密钥等）不会被提交到 GitHub
- 部署时请确保 `.env` 文件权限安全
- 生产环境请使用强密码和 HTTPS

## 📝 环境变量配置

### 后端必需配置（`.env`）
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_NAME=limao_system
MAIL_HOST=smtp.163.com
MAIL_PORT=465
MAIL_USER=你的邮箱@163.com
MAIL_PASS=你的邮箱授权码
JWT_SECRET=你的 JWT 密钥（至少 32 位）
NVIDIA_API_KEY=你的 NVIDIA API Key
```

### 前端可选配置（`.env.development`）
```env
VITE_API_BASE=/api
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License

## 👤 作者

- GitHub: [@ShiJueTianChuang](https://github.com/ShiJueTianChuang)

## 🔗 链接

- 项目仓库：https://github.com/ShiJueTianChuang/LiMao-v1
- 问题反馈：https://github.com/ShiJueTianChuang/LiMao-v1/issues
